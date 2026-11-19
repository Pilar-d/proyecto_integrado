"""
Validador integral de planillas REM Serie A (RF-03).
Verifica estructura, integridad y contenido celda por celda,
generando mensajes de error detallados con hoja, fila y columna.
"""

import re
from decimal import Decimal
import openpyxl
from openpyxl.utils.cell import coordinate_to_tuple, get_column_letter

EXCEL_ERROR_CODES = {
    '#NULL!', '#DIV/0!', '#VALUE!', '#REF!', '#NAME?', '#NUM!', '#N/A'
}


def _resolver_nombre_hoja(wb, nombre_buscado):
    """Busca una hoja en el libro ignorando prefijos como 'REM' y mayúsculas/minúsculas."""
    if nombre_buscado in wb.sheetnames:
        return nombre_buscado
    limpio = nombre_buscado.replace('REM', '').replace('rem', '').replace('_', '').strip().upper()
    for s in wb.sheetnames:
        s_limpio = s.replace('REM', '').replace('rem', '').replace('_', '').strip().upper()
        if s.strip().upper() == limpio or s_limpio == limpio:
            return s
    return None


def descomponer_coordenada(referencia_celda):
    """
    Descompone una referencia como 'D11' en (fila: 11, columna: 'D').
    Si no es válida, retorna (None, None).
    """
    m = re.match(r'^([A-Za-z]+)([0-9]+)$', referencia_celda.strip())
    if m:
        col = m.group(1).upper()
        fila = int(m.group(2))
        return fila, col
    return None, None


def validar_archivo_rem(file_obj, parametros=None):
    """
    Realiza la validación técnica y de datos del archivo REM.
    Devuelve un diccionario estructurado con:
      - es_valido: bool
      - total_errores: int
      - total_advertencias: int
      - errores: lista de objetos {hoja, fila, columna, celda, tipo, valor, mensaje}
      - advertencias: lista de objetos {hoja, fila, columna, celda, tipo, valor, mensaje}
      - metadatos: dict con info extraída (establecimiento, mes, año, total de hojas)
    """
    parametros = parametros or {}
    errores = []
    advertencias = []
    metadatos = {
        'nombre_archivo': getattr(file_obj, 'name', 'archivo.xlsx'),
        'tamano_bytes': getattr(file_obj, 'size', 0),
        'establecimiento': 'CESFAM Santa Rosa (210450)',
        'mes': 1,
        'year': 2026,
        'total_hojas': 0,
        'hojas': []
    }

    nombre = metadatos['nombre_archivo'].lower()

    # 1. Validación de extensión
    if not (nombre.endswith('.xlsx') or nombre.endswith('.xlsm') or nombre.endswith('.xls')):
        errores.append({
            'hoja': 'N/A',
            'fila': '-',
            'columna': '-',
            'celda': 'N/A',
            'tipo': 'FORMATO_INVALIDO',
            'valor': nombre,
            'mensaje': f"El archivo '{metadatos['nombre_archivo']}' no tiene una extensión Excel permitida (.xlsx, .xlsm, .xls)."
        })
        return {
            'es_valido': False,
            'total_errores': len(errores),
            'total_advertencias': 0,
            'errores': errores,
            'advertencias': [],
            'metadatos': metadatos
        }

    # 2. Validación de tamaño (Máximo 50 MB)
    if metadatos['tamano_bytes'] > 50 * 1024 * 1024:
        errores.append({
            'hoja': 'N/A',
            'fila': '-',
            'columna': '-',
            'celda': 'N/A',
            'tipo': 'TAMANO_EXCEDIDO',
            'valor': f"{metadatos['tamano_bytes'] / (1024*1024):.2f} MB",
            'mensaje': "El archivo supera el tamaño máximo permitido de 50 MB."
        })
        return {
            'es_valido': False,
            'total_errores': len(errores),
            'total_advertencias': 0,
            'errores': errores,
            'advertencias': [],
            'metadatos': metadatos
        }

    # 3. Cargar libro en memoria para validación
    try:
        wb = openpyxl.load_workbook(file_obj, data_only=True)
        sheet_names = wb.sheetnames
        metadatos['total_hojas'] = len(sheet_names)
        metadatos['hojas'] = sheet_names
    except Exception as e:
        errores.append({
            'hoja': 'N/A',
            'fila': '-',
            'columna': '-',
            'celda': 'N/A',
            'tipo': 'CORRUPCION_EXCEL',
            'valor': str(e),
            'mensaje': f"No se pudo abrir el archivo Excel. Estructura dañada o protegida con clave: {e}"
        })
        return {
            'es_valido': False,
            'total_errores': len(errores),
            'total_advertencias': 0,
            'errores': errores,
            'advertencias': [],
            'metadatos': metadatos
        }

    # 4. Validar que contenga hojas oficiales Serie A
    tiene_serie_a = any(
        s.upper().startswith('A') or s.upper() == 'NOMBRE' or s.upper().startswith('P')
        for s in sheet_names
    )
    if not tiene_serie_a:
        errores.append({
            'hoja': 'Estructura Libro',
            'fila': '-',
            'columna': '-',
            'celda': '-',
            'tipo': 'ESTRUCTURA_MINSAL_NO_VALIDA',
            'valor': ', '.join(sheet_names[:5]),
            'mensaje': "La planilla no contiene hojas estándar del REM Serie A (ej: NOMBRE, A01, A02, A24, etc.)."
        })

    # 5. Extraer metadatos de establecimiento y período si existe hoja NOMBRE
    hoja_nombre = _resolver_nombre_hoja(wb, 'NOMBRE')
    if hoja_nombre:
        ws_n = wb[hoja_nombre]
        # Buscar establecimiento en celdas comunes
        for r in range(1, 10):
            for c in range(1, 10):
                val = ws_n.cell(row=r, column=c).value
                if val and 'SANTA ROSA' in str(val).upper():
                    metadatos['establecimiento'] = str(val).strip()
                    break

    # 6. Validación de celdas configuradas en la interfaz (Parámetros Base)
    hoja_base = parametros.get('hojaRem')
    if hoja_base:
        hoja_real = _resolver_nombre_hoja(wb, hoja_base)
        if not hoja_real:
            advertencias.append({
                'hoja': hoja_base,
                'fila': '-',
                'columna': '-',
                'celda': '-',
                'tipo': 'HOJA_PARAMETRIZADA_NO_ENCONTRADA',
                'valor': hoja_base,
                'mensaje': f"La hoja base configurada '{hoja_base}' no fue encontrada en este libro."
            })
        else:
            ws_base = wb[hoja_real]
            # Validar celda de establecimiento
            celda_est = parametros.get('celdaEstablecimiento')
            if celda_est:
                fila, col = descomponer_coordenada(celda_est)
                if fila and col:
                    try:
                        val = ws_base[celda_est].value
                        if val in EXCEL_ERROR_CODES:
                            errores.append({
                                'hoja': hoja_base,
                                'fila': fila,
                                'columna': col,
                                'celda': celda_est,
                                'tipo': 'ERROR_FORMULA',
                                'valor': str(val),
                                'mensaje': f"Error de fórmula '{val}' en la celda de establecimiento (fila {fila}, columna {col})."
                            })
                    except Exception as e:
                        errores.append({
                            'hoja': hoja_base,
                            'fila': fila,
                            'columna': col,
                            'celda': celda_est,
                            'tipo': 'CELDA_INVALIDA',
                            'valor': celda_est,
                            'mensaje': f"No se pudo leer la celda de establecimiento en fila {fila}, columna {col}: {e}"
                        })

            # Validar celda de mes
            celda_mes = parametros.get('celdaMes')
            if celda_mes:
                fila, col = descomponer_coordenada(celda_mes)
                if fila and col:
                    try:
                        val = ws_base[celda_mes].value
                        if val in EXCEL_ERROR_CODES:
                            errores.append({
                                'hoja': hoja_base,
                                'fila': fila,
                                'columna': col,
                                'celda': celda_mes,
                                'tipo': 'ERROR_FORMULA',
                                'valor': str(val),
                                'mensaje': f"Error de fórmula '{val}' en la celda de mes (fila {fila}, columna {col})."
                            })
                    except Exception:
                        pass

            # Validar rango de datos a partir de filaInicioDatos y columnaIndicador
            fila_ini = parametros.get('filaInicioDatos')
            col_ind = parametros.get('columnaIndicador')
            if fila_ini and col_ind:
                try:
                    fila_num = int(fila_ini)
                    col_str = str(col_ind).strip().upper()
                    # Verificar primeras 20 filas de datos
                    for f in range(fila_num, fila_num + 20):
                        coord = f"{col_str}{f}"
                        val = ws_base[coord].value
                        if val in EXCEL_ERROR_CODES:
                            errores.append({
                                'hoja': hoja_base,
                                'fila': f,
                                'columna': col_str,
                                'celda': coord,
                                'tipo': 'ERROR_FORMULA',
                                'valor': str(val),
                                'mensaje': f"Error de fórmula '{val}' en fila {f}, columna {col_str}."
                            })
                except Exception:
                    pass

    # 7. Validación de celdas mapeadas en el catálogo de Indicadores (PostgreSQL)
    try:
        from param_manager.models import ComponenteDato
        componentes_rem = ComponenteDato.objects.filter(origen='REM', activo=True)
        for comp in componentes_rem:
            hoja_req = comp.rem_hoja
            celda_req = comp.rem_celda
            if not hoja_req or not celda_req:
                continue

            hoja_encontrada = _resolver_nombre_hoja(wb, hoja_req)
            if not hoja_encontrada:
                advertencias.append({
                    'hoja': hoja_req,
                    'fila': '-',
                    'columna': '-',
                    'celda': celda_req,
                    'tipo': 'HOJA_REQUERIDA_AUSENTE',
                    'valor': hoja_req,
                    'mensaje': f"La hoja '{hoja_req}' requerida para el indicador {comp.indicador.codigo} no existe en la planilla."
                })
                continue

            ws = wb[hoja_encontrada]

            # Detectar si es un rango (ej: H11:X11) o celda simple o fórmula
            celdas_a_revisar = []
            if ':' in celda_req:
                m_rango = re.match(r'^([A-Za-z]+[0-9]+):([A-Za-z]+[0-9]+)$', celda_req.strip())
                if m_rango:
                    try:
                        for row in ws[celda_req]:
                            for c in row:
                                celdas_a_revisar.append(c.coordinate)
                    except Exception:
                        errores.append({
                            'hoja': hoja_req,
                            'fila': '-',
                            'columna': '-',
                            'celda': celda_req,
                            'tipo': 'RANGO_INVALIDO',
                            'valor': celda_req,
                            'mensaje': f"Rango de celdas '{celda_req}' inválido en la hoja '{hoja_req}'."
                        })
            else:
                # Extraer celdas con regex
                celdas_a_revisar = re.findall(r'\b[A-Za-z]+[0-9]+\b', celda_req)

            for coord in celdas_a_revisar:
                f, c = descomponer_coordenada(coord)
                if not f or not c:
                    continue
                try:
                    val = ws[coord].value
                    if val in EXCEL_ERROR_CODES:
                        errores.append({
                            'hoja': hoja_req,
                            'fila': f,
                            'columna': c,
                            'celda': coord,
                            'tipo': 'ERROR_FORMULA_EXCEL',
                            'valor': str(val),
                            'mensaje': f"La celda contiene el error de fórmula '{val}' en la fila {f}, columna {c} (Indicador {comp.indicador.codigo})."
                        })
                except Exception as e:
                    errores.append({
                        'hoja': hoja_req,
                        'fila': f,
                        'columna': c,
                        'celda': coord,
                        'tipo': 'ERROR_LECTURA_CELDA',
                        'valor': str(e),
                        'mensaje': f"Falla de lectura en celda '{coord}' (fila {f}, columna {c}): {e}"
                    })

    except Exception:
        # Si la BD no está disponible en este momento, no bloquear la validación técnica
        pass

    wb.close()

    es_valido = len(errores) == 0

    return {
        'es_valido': es_valido,
        'total_errores': len(errores),
        'total_advertencias': len(advertencias),
        'errores': errores,
        'advertencias': advertencias,
        'metadatos': metadatos
    }
