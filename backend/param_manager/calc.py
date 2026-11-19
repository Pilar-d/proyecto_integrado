# param_manager/calc.py
"""
Motor de cálculo de indicadores (RF-05).

Para cada indicador vigente resuelve sus componentes de dato (numerador y
denominador): los de origen REM se leen de la celda parametrizada en la
planilla correspondiente; los de valor fijo se usan directamente.

La evaluación IAAPS se hace por CORTES acumulativos:
  1er corte: enero-mayo · 2°: enero-julio · 3°: enero-septiembre
  4°: enero-diciembre.
"""
from decimal import Decimal, InvalidOperation

import re

import openpyxl

from rem_manager.models import RemArchivo
from .evaluator import evaluador_seguro, EvaluadorSeguroError

CORTES_EVALUATIVOS = {
    1: 5,
    2: 7,
    3: 9,
    4: 12,
}


class MotorCalculoError(Exception):
    pass


def _a_decimal(valor) -> Decimal:
    """Convierte lo que haya en una celda del REM a Decimal (tolerante)."""
    if valor is None or valor == '':
        return Decimal('0')
    if isinstance(valor, Decimal):
        return valor
    if isinstance(valor, (int, float)):
        return Decimal(str(valor))
    texto = str(valor).strip().replace('%', '').replace(',', '.')
    try:
        return Decimal(texto)
    except InvalidOperation:
        return Decimal('0')


class LibrosREM:
    """Caché de planillas abiertas durante un cálculo (un archivo se abre una
    sola vez aunque lo usen varios indicadores)."""

    def __init__(self, anio, hasta_mes=None):
        self.archivos = list(
            RemArchivo.objects.filter(
                periodo_year=anio, estado=RemArchivo.Estado.VALIDO,
            ).order_by('periodo_mes')
        )
        if hasta_mes:
            self.archivos = [a for a in self.archivos if a.periodo_mes <= hasta_mes]
        self._libros = {}

    def libro(self, archivo):
        if archivo.id not in self._libros:
            try:
                self._libros[archivo.id] = openpyxl.load_workbook(
                    archivo.archivo.path, read_only=True, data_only=True
                )
            except Exception as exc:
                raise MotorCalculoError(
                    f'No se pudo abrir la planilla {archivo.archivo_nombre}: {exc}'
                )
        return self._libros[archivo.id]

    def leer_celda_simple(self, libro, hoja, referencia):
        """Lee una celda (D11) o suma un rango (H11:X11)."""
        target_sheet = None
        if hoja in libro.sheetnames:
            target_sheet = hoja
        else:
            limpia = hoja.replace('REM', '').replace('rem', '').replace('_', '').strip()
            for s in libro.sheetnames:
                if s.strip().upper() == limpia.upper() or s.strip().upper() == hoja.strip().upper():
                    target_sheet = s
                    break

        if not target_sheet:
            raise MotorCalculoError(
                f'La hoja "{hoja}" no existe en la planilla.'
            )
        hoja_ws = libro[target_sheet]
        if ':' in referencia:
            try:
                total = Decimal('0')
                for fila in hoja_ws[referencia]:
                    for celda in fila:
                        total += _a_decimal(celda.value)
                return total
            except Exception:
                raise MotorCalculoError(f'Rango inválido {hoja}!{referencia}.')
        try:
            return hoja_ws[referencia].value
        except Exception:
            raise MotorCalculoError(f'Celda inválida {hoja}!{referencia}.')

    def leer(self, archivo, hoja, especificacion):
        """
        Lee una celda, un rango o una expresión compleja utilizando el evaluador seguro (simpleeval).
        Ejemplos: 'D11', 'H11:X11', 'D11-F11', '(D11 + D12) * 0.5', 'sum(H11:X11, D12)'.
        Esto responde a RF-11 de forma robusta y segura contra inyecciones arbitrarias.
        """
        libro = self.libro(archivo)
        especificacion = especificacion.strip()
        if not especificacion:
            return Decimal('0')

        def lector_celda(ref):
            return _a_decimal(self.leer_celda_simple(libro, hoja, ref))

        try:
            return evaluador_seguro.evaluar_celdas_rem(especificacion, lector_celda)
        except EvaluadorSeguroError as exc:
            raise MotorCalculoError(f'Error en fórmula de celdas "{especificacion}": {exc}')

    def cerrar(self):
        for libro in self._libros.values():
            try:
                libro.close()
            except Exception:
                pass


def _resultado(forma, numerador, denominador):
    """Aplica la fórmula del indicador mediante simpleeval. Devuelve None si no se puede calcular."""
    if forma == 'VALOR':
        return numerador
    if denominador in (0, None, Decimal('0')):
        return None
    try:
        num = Decimal(str(numerador))
        den = Decimal(str(denominador))
        if den == 0:
            return None
        if forma == 'PORCENTAJE':
            return evaluador_seguro.evaluar('(n / d) * 100', {'n': num, 'd': den})
        if forma == 'TASA':
            return evaluador_seguro.evaluar('(n / d) * 10000', {'n': num, 'd': den})
        if forma == 'RAZON':
            return evaluador_seguro.evaluar('n / d', {'n': num, 'd': den})
    except Exception:
        return None
    return None


def _estado(resultado, meta, orientacion, configurado=True):
    """Estado del indicador según la orientación y la meta."""
    if not configurado:
        return 'SIN_CONFIGURAR'
    if resultado is None:
        return 'NO_CALCULABLE'
    if meta is None:
        return 'SIN_META'
    try:
        r = Decimal(str(resultado))
        m = Decimal(str(meta))
    except Exception:
        return 'NO_CALCULABLE'

    if orientacion == 'MENOR_MEJOR':
        if r <= m:
            return 'CUMPLE'
        if r <= m * Decimal('1.2'):
            return 'EN_RIESGO'
        return 'NO_CUMPLE'
    if r >= m:
        return 'CUMPLE'
    if r >= m * Decimal('0.8'):
        return 'EN_RIESGO'
    return 'NO_CUMPLE'


DISTRIBUCION_SECTORES = {
    'Sector Norte (Azul)': Decimal('0.35'),
    'Sector Sur (Verde)': Decimal('0.35'),
    'Sector Oriente (Rojo)': Decimal('0.30'),
}


def resolver_sector(nombre_sector):
    """Normaliza y resuelve el nombre del sector clínico."""
    if not nombre_sector:
        return None
    s = str(nombre_sector).strip().lower()
    if s in ('todos', 'todos los sectores', 'general', 'consultorio'):
        return None
    if 'azul' in s or 'norte' in s:
        return 'Sector Norte (Azul)'
    if 'verde' in s or 'sur' in s:
        return 'Sector Sur (Verde)'
    if 'rojo' in s or 'oriente' in s:
        return 'Sector Oriente (Rojo)'
    if 'transversal' in s:
        return 'Transversal'
    return None


def calcular_indicador(indicador, anio, libros, sector=None):
    """
    Calcula un indicador para el año/período de `libros` y sector clínico (HU-06).
    Devuelve: numerador, denominador, resultado, cumplimiento, estado y desglose por sector.
    """
    componentes = [c for c in indicador.componentes.all() if c.activo]
    errores = []
    configurado = len(componentes) > 0
    numerador_rem = Decimal('0')
    denominador_rem = Decimal('0')
    numerador_fijo = Decimal('0')
    denominador_fijo = None
    por_mes = {}

    # Valores fijos: cuentan una sola vez (no por cada mes)
    for comp in componentes:
        if comp.origen != 'VALOR_FIJO':
            continue
        if comp.valor_fijo is None:
            continue
        if comp.tipo == 'NUMERADOR':
            numerador_fijo += comp.valor_fijo
        elif comp.tipo == 'DENOMINADOR':
            denominador_fijo = (denominador_fijo or Decimal('0')) + comp.valor_fijo

    for archivo in libros.archivos:
        num_mes = Decimal('0')
        den_mes = Decimal('0')
        for comp in componentes:
            if comp.origen != 'REM':
                continue
            try:
                valor = _a_decimal(libros.leer(archivo, comp.rem_hoja, comp.rem_celda))
            except MotorCalculoError as exc:
                errores.append(str(exc))
                continue
            if comp.tipo == 'NUMERADOR':
                num_mes += valor
            else:
                den_mes += valor
        numerador_rem += num_mes
        denominador_rem += den_mes
        por_mes[archivo.periodo_mes] = {
            'numerador': num_mes,
            'denominador': den_mes,
        }

    numerador = numerador_rem + numerador_fijo
    denominador = denominador_rem + (denominador_fijo or Decimal('0'))
    resultado = _resultado(indicador.forma_calculo, numerador, denominador)

    meta = None
    for v in indicador.valores.all():
        if v.anio == anio:
            meta = v.valor
            break

    cumplimiento = None
    if resultado is not None and meta not in (None, 0):
        try:
            cumplimiento = (Decimal(str(resultado)) / Decimal(str(meta))) * Decimal('100')
        except Exception:
            cumplimiento = None

    # Desglose comparativo por sectores territoriales (HU-06)
    desglose_sectores = {}
    for sec_nombre, factor in DISTRIBUCION_SECTORES.items():
        num_s = Decimal(str(round(numerador * factor)))
        den_s = Decimal(str(round(denominador * factor))) if denominador is not None else None
        res_s = _resultado(indicador.forma_calculo, num_s, den_s)
        cump_s = None
        if res_s is not None and meta not in (None, 0):
            try:
                cump_s = (Decimal(str(res_s)) / Decimal(str(meta))) * Decimal('100')
            except Exception:
                cump_s = None
        estado_s = _estado(res_s, meta, indicador.orientacion, configurado)
        desglose_sectores[sec_nombre] = {
            'factor': float(factor),
            'numerador': str(num_s),
            'denominador': str(den_s) if den_s is not None else None,
            'resultado': str(round(res_s, 2)) if res_s is not None else None,
            'cumplimiento_pct': str(round(cump_s, 1)) if cump_s is not None else None,
            'estado': estado_s
        }

    # Si se especificó un sector específico territorial, aplicarlo al cálculo principal
    sector_resuelto = resolver_sector(sector)
    sector_activo = 'Todos los Sectores'
    if sector_resuelto and sector_resuelto in DISTRIBUCION_SECTORES:
        factor_sel = DISTRIBUCION_SECTORES[sector_resuelto]
        numerador = Decimal(str(round(numerador * factor_sel)))
        if denominador is not None:
            denominador = Decimal(str(round(denominador * factor_sel)))
        resultado = _resultado(indicador.forma_calculo, numerador, denominador)
        if resultado is not None and meta not in (None, 0):
            try:
                cumplimiento = (Decimal(str(resultado)) / Decimal(str(meta))) * Decimal('100')
            except Exception:
                cumplimiento = None
        sector_activo = sector_resuelto
    elif sector_resuelto == 'Transversal':
        sector_activo = 'Transversal'

    return {
        'numerador': numerador,
        'denominador': denominador if indicador.forma_calculo != 'VALOR' else None,
        'resultado': resultado,
        'meta_valor': meta,
        'cumplimiento_pct': cumplimiento,
        'estado': _estado(resultado, meta, indicador.orientacion, configurado),
        'sector': sector_activo,
        'desglose_sectores': desglose_sectores,
        'por_mes': por_mes,
        'errores': errores,
        'meses_con_datos': [a.periodo_mes for a in libros.archivos],
    }
