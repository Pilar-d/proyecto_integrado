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
        if hoja not in libro.sheetnames:
            raise MotorCalculoError(
                f'La hoja "{hoja}" no existe en la planilla.'
            )
        hoja_ws = libro[hoja]
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
        Lee una celda, un rango o una expresión simple con + y -.
        Ejemplos: 'D11', 'H11:X11', 'D11-F11' (mujeres total menos 15-19).
        Esto responde a RF-11: la data puede requerir sumas o restas de celdas.
        """
        libro = self.libro(archivo)
        especificacion = especificacion.replace(' ', '')
        tokens = re.split(r'([+-])', especificacion)
        total = Decimal('0')
        signo = 1
        for token in tokens:
            if not token:
                continue
            if token == '+':
                signo = 1
            elif token == '-':
                signo = -1
            else:
                total += signo * _a_decimal(
                    self.leer_celda_simple(libro, hoja, token)
                )
        return total

    def cerrar(self):
        for libro in self._libros.values():
            try:
                libro.close()
            except Exception:
                pass


def _resultado(forma, numerador, denominador):
    """Aplica la fórmula del indicador. Devuelve None si no se puede calcular."""
    if forma == 'VALOR':
        return numerador
    if denominador == 0:
        return None
    if forma == 'PORCENTAJE':
        return (numerador / denominador) * 100
    if forma == 'TASA':
        return (numerador / denominador) * 10000
    if forma == 'RAZON':
        return numerador / denominador
    return None


def _estado(resultado, meta, orientacion, configurado=True):
    """Estado del indicador según la orientación y la meta."""
    if not configurado:
        return 'SIN_CONFIGURAR'
    if resultado is None:
        return 'NO_CALCULABLE'
    if meta is None:
        return 'SIN_META'
    if orientacion == 'MENOR_MEJOR':
        if resultado <= meta:
            return 'CUMPLE'
        if resultado <= meta * Decimal('1.2'):
            return 'EN_RIESGO'
        return 'NO_CUMPLE'
    if resultado >= meta:
        return 'CUMPLE'
    if resultado >= meta * Decimal('0.8'):
        return 'EN_RIESGO'
    return 'NO_CUMPLE'


def calcular_indicador(indicador, anio, libros):
    """
    Calcula un indicador para el año/período de `libros`.
    Devuelve: numerador, denominador, resultado, cumplimiento y detalle por mes.
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
        cumplimiento = (resultado / meta) * 100

    return {
        'numerador': numerador,
        'denominador': denominador if indicador.forma_calculo != 'VALOR' else None,
        'resultado': resultado,
        'meta_valor': meta,
        'cumplimiento_pct': cumplimiento,
        'estado': _estado(resultado, meta, indicador.orientacion, configurado),
        'por_mes': por_mes,
        'errores': errores,
        'meses_con_datos': [a.periodo_mes for a in libros.archivos],
    }
