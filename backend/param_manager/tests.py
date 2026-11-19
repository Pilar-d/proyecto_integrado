"""
Pruebas unitarias para el Evaluador Seguro de Fórmulas (simpleeval)
"""
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from .evaluator import evaluador_seguro, EvaluadorSeguroError, EvaluadorSeguroFormulas
from .calc import _resultado, _estado


class EvaluadorSeguroTestCase(TestCase):
    def setUp(self):
        self.evaluador = evaluador_seguro
        self.client = APIClient()

    def test_operaciones_aritmeticas_basicas(self):
        self.assertEqual(self.evaluador.evaluar('2 + 3 * 4'), Decimal('14'))
        self.assertEqual(self.evaluador.evaluar('(10 - 2) / 4'), Decimal('2'))
        self.assertEqual(self.evaluador.evaluar('100 * 0.15'), Decimal('15.0'))

    def test_formulas_con_variables(self):
        vars_test = {'numerador': 75, 'denominador': 100}
        res = self.evaluador.evaluar('(numerador / denominador) * 100', vars_test)
        self.assertEqual(res, Decimal('75.0'))

    def test_funciones_sanitarias_incorporadas(self):
        # porcentaje
        self.assertEqual(self.evaluador.evaluar('porcentaje(n, d)', {'n': 80, 'd': 100}), Decimal('80.0'))
        # tasa por 10.000
        self.assertEqual(self.evaluador.evaluar('tasa(casos, poblacion)', {'casos': 50, 'poblacion': 10000}), Decimal('50.0'))
        # razon
        self.assertEqual(self.evaluador.evaluar('razon(a, b)', {'a': 15, 'b': 3}), Decimal('5.0'))
        # promedio
        self.assertEqual(self.evaluador.evaluar('promedio(10, 20, 30)'), Decimal('20.0'))
        # min / max / round
        self.assertEqual(self.evaluador.evaluar('max(10, 50, 30)'), Decimal('50'))
        self.assertEqual(self.evaluador.evaluar('min(10, 50, 30)'), Decimal('10'))
        self.assertEqual(self.evaluador.evaluar('round(3.14159, 2)'), Decimal('3.14'))

    def test_resolucion_celdas_y_rangos_rem(self):
        hoja_mock = {
            'D11': Decimal('100'),
            'D12': Decimal('50'),
            'F11': Decimal('20'),
            'H11:X11': Decimal('300'),
        }
        lector = lambda ref: hoja_mock[ref]

        # Celda simple
        self.assertEqual(self.evaluador.evaluar_celdas_rem('D11', lector), Decimal('100'))
        # Rango simple
        self.assertEqual(self.evaluador.evaluar_celdas_rem('H11:X11', lector), Decimal('300'))
        # Operaciones entre celdas
        self.assertEqual(self.evaluador.evaluar_celdas_rem('D11 + D12 - F11', lector), Decimal('130.0'))
        # Operaciones complejas con paréntesis y factores
        self.assertEqual(self.evaluador.evaluar_celdas_rem('(D11 + D12) * 0.5', lector), Decimal('75.0'))
        # Combinación de rango y celda
        self.assertEqual(self.evaluador.evaluar_celdas_rem('H11:X11 + D11', lector), Decimal('400.0'))

    def test_seguridad_bloqueo_inyecciones(self):
        # Intento de importar módulos de Python
        with self.assertRaises(EvaluadorSeguroError):
            self.evaluador.evaluar('__import__("os").system("ls")')

        # Intento de llamar a eval() o exec()
        with self.assertRaises(EvaluadorSeguroError):
            self.evaluador.evaluar('eval("2 + 2")')

        with self.assertRaises(EvaluadorSeguroError):
            self.evaluador.evaluar('exec("a = 1")')

        # Intento de acceder a atributos privados o traversal
        with self.assertRaises(EvaluadorSeguroError):
            self.evaluador.evaluar('().__class__.__bases__[0].__subclasses__()')

    def test_control_division_por_cero(self):
        with self.assertRaises(EvaluadorSeguroError):
            self.evaluador.evaluar('100 / 0')

    def test_calc_motor_integrado_con_simpleeval(self):
        self.assertEqual(_resultado('PORCENTAJE', 75, 100), Decimal('75.0'))
        self.assertEqual(_resultado('TASA', 50, 10000), Decimal('50.0'))
        self.assertEqual(_resultado('RAZON', 15, 5), Decimal('3.0'))
        self.assertEqual(_resultado('VALOR', 42, 0), 42)

    def test_api_endpoint_evaluar_formula(self):
        # Éxito
        res = self.client.post('/api/param/evaluar-formula/', {
            'formula': '(n / d) * 100',
            'variables': {'n': 60, 'd': 80}
        }, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['resultado'], '75.0')
        self.assertTrue(res.json()['valida'])

        # Bloqueo de seguridad en la API
        res_sec = self.client.post('/api/param/evaluar-formula/', {
            'formula': '__import__("sys").exit()'
        }, format='json')
        self.assertEqual(res_sec.status_code, 400)
        self.assertFalse(res_sec.json()['valida'])

    def test_motor_calculo_por_programa_y_sector_hu06(self):
        from .calc import resolver_sector, DISTRIBUCION_SECTORES

        # 1. Normalización de sectores
        self.assertEqual(resolver_sector('Sector Norte (Azul)'), 'Sector Norte (Azul)')
        self.assertEqual(resolver_sector('Sector Sur (Verde)'), 'Sector Sur (Verde)')
        self.assertEqual(resolver_sector('verde'), 'Sector Sur (Verde)')
        self.assertEqual(resolver_sector('rojo'), 'Sector Oriente (Rojo)')
        self.assertEqual(resolver_sector('Todos los Sectores'), None)
        self.assertEqual(resolver_sector('todos'), None)

        # 2. Factores de distribución territorial
        self.assertEqual(DISTRIBUCION_SECTORES['Sector Norte (Azul)'], Decimal('0.35'))
        self.assertEqual(DISTRIBUCION_SECTORES['Sector Sur (Verde)'], Decimal('0.35'))
        self.assertEqual(DISTRIBUCION_SECTORES['Sector Oriente (Rojo)'], Decimal('0.30'))

    def test_consultas_historicas_y_comparativas_hu07(self):
        """
        HU-07: Consultas históricas y comparativas interanuales de metas sanitarias.
        Verifica cálculo de variación delta, estadísticas globales y filtrado por sector/programa.
        """
        from api.models import Usuario, Rol
        from .models import Meta, Indicador, Programa

        # 1. Crear rol directivo y usuario autenticado
        rol_directora, _ = Rol.objects.get_or_create(nombre_rol='Directora', defaults={'descripcion': 'Directora'})
        usuario_directora = Usuario.objects.create_user(
            rut='55555555-5',
            username='55555555-5',
            password='cesfam2026',
            email='directora.test@salud.cl',
            nombres='Patricia',
            apellidos='Directora',
            rol=rol_directora
        )

        prog = Programa.objects.create(nombre='Programa Test', activo=True)
        meta = Meta.objects.create(codigo='MTEST-01', nombre='Meta Test', programa=prog, seccion='PRODUCCION', vigente=True)
        ind = Indicador.objects.create(
            codigo='IND-TEST-01',
            nombre='Indicador Test Historico',
            meta=meta,
            forma_calculo='PORCENTAJE',
            vigente=True
        )

        self.client.force_authenticate(user=usuario_directora)

        # 2. Consultar endpoint comparativo interanual
        res = self.client.get('/api/param/comparativo/?anio_base=2025&anio_evaluacion=2026')
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data['anio_base'], 2025)
        self.assertEqual(data['anio_evaluacion'], 2026)
        self.assertIn('estadisticas', data)
        self.assertIn('mejoras', data['estadisticas'])
        self.assertIn('descensos', data['estadisticas'])
        self.assertIn('estables', data['estadisticas'])
        self.assertIn('variacion_promedio', data['estadisticas'])
        self.assertTrue(len(data['resultados']) >= 1)

        # 3. Verificar estructura de cada indicador comparativo
        primer_resultado = data['resultados'][0]
        self.assertIn('codigo', primer_resultado)
        self.assertIn('pct_base', primer_resultado)
        self.assertIn('pct_evaluacion', primer_resultado)
        self.assertIn('delta', primer_resultado)
        self.assertIn('tendencia', primer_resultado)
        self.assertIn(primer_resultado['tendencia'], ['MEJORA', 'DESCENSO', 'ESTABLE'])

        # 4. Verificar alias /api/param/historico/
        res_alias = self.client.get('/api/param/historico/?anio_base=2025&anio_evaluacion=2026')
        self.assertEqual(res_alias.status_code, 200)
        self.assertEqual(res_alias.json()['total_indicadores'], data['total_indicadores'])

    def test_calculos_coinciden_con_planillas_oficiales_cesfam(self):
        """
        RF-05 / RF-06: Verificación de que las extracciones de celdas y cálculos
        coinciden exactamente con las planillas oficiales REM Serie A del CESFAM Santa Rosa.
        """
        import io
        import openpyxl
        from django.core.files.base import ContentFile
        from rem_manager.models import RemArchivo
        from .models import Programa, Meta, Indicador, ComponenteDato, MetaValor
        from .calc import LibrosREM, calcular_indicador

        # 1. Simular planilla idéntica a la oficial Serie A de Enero del CESFAM Santa Rosa
        wb = openpyxl.Workbook()
        ws_a09 = wb.active
        ws_a09.title = 'A09'
        ws_a09['D12'] = 1002  # Cobertura DM2 15+
        ws_a09['E12'] = 410   # Cobertura HTA 15+

        ws_a04 = wb.create_sheet('A04')
        ws_a04['D12'] = 1101  # Cobertura EMP Hombres

        ws_a03 = wb.create_sheet('A03')
        ws_a03['C13'] = 27    # Cobertura evaluación desarrollo psicomotor

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)

        rem_doc = RemArchivo.objects.create(
            archivo_nombre='REM_Serie_A_Oficial_Test.xlsx',
            archivo=ContentFile(buf.getvalue(), name='REM_Serie_A_Oficial_Test.xlsx'),
            periodo_year=2026,
            periodo_mes=1,
            estado=RemArchivo.Estado.VALIDO
        )

        prog_cv = Programa.objects.create(nombre='Cardiovascular CESFAM')
        meta_dm2 = Meta.objects.create(codigo='IAAPS-14-OFICIAL', nombre='Meta DM2', programa=prog_cv, seccion='PRODUCCION')
        ind_14 = Indicador.objects.create(codigo='14-OFICIAL', nombre='DM2 15+', meta=meta_dm2, forma_calculo='PORCENTAJE')
        MetaValor.objects.create(indicador=ind_14, anio=2026, valor=Decimal('63.0'))
        ComponenteDato.objects.create(indicador=ind_14, tipo='NUMERADOR', origen='REM', rem_hoja='A09', rem_celda='D12', activo=True)
        ComponenteDato.objects.create(indicador=ind_14, tipo='DENOMINADOR', origen='VALOR_FIJO', valor_fijo=Decimal('2280.00'), activo=True)

        meta_hta = Meta.objects.create(codigo='IAAPS-15-OFICIAL', nombre='Meta HTA', programa=prog_cv, seccion='PRODUCCION')
        ind_15 = Indicador.objects.create(codigo='15-OFICIAL', nombre='HTA 15+', meta=meta_hta, forma_calculo='PORCENTAJE')
        MetaValor.objects.create(indicador=ind_15, anio=2026, valor=Decimal('62.0'))
        ComponenteDato.objects.create(indicador=ind_15, tipo='NUMERADOR', origen='REM', rem_hoja='A09', rem_celda='E12', activo=True)
        ComponenteDato.objects.create(indicador=ind_15, tipo='DENOMINADOR', origen='VALOR_FIJO', valor_fijo=Decimal('4200.00'), activo=True)

        # 2. Ejecutar cálculo con motor LibrosREM
        libros = LibrosREM(2026, hasta_mes=1)
        calc_14 = calcular_indicador(ind_14, 2026, libros)
        calc_15 = calcular_indicador(ind_15, 2026, libros)
        libros.cerrar()

        # 3. Aserciones de coincidencia exacta con la planilla
        self.assertEqual(calc_14['numerador'], Decimal('1002'))
        self.assertEqual(calc_14['denominador'], Decimal('2280.00'))
        self.assertEqual(round(calc_14['resultado'], 2), Decimal('43.95'))
        self.assertEqual(round(calc_14['cumplimiento_pct'], 1), Decimal('69.8'))
        self.assertEqual(calc_14['estado'], 'NO_CUMPLE')

        self.assertEqual(calc_15['numerador'], Decimal('410'))
        self.assertEqual(calc_15['denominador'], Decimal('4200.00'))
        self.assertEqual(round(calc_15['resultado'], 2), Decimal('9.76'))
        self.assertEqual(round(calc_15['cumplimiento_pct'], 1), Decimal('15.7'))
        self.assertEqual(calc_15['estado'], 'NO_CUMPLE')

    def test_usabilidad_y_detalles_visuales_frontend(self):
        """
        RF-09 / Criterios de Usabilidad y Detalles Visuales:
        Verifica la presencia y consistencia de los estándares de usabilidad (semáforos cromáticos,
        diseño responsivo, feedback visual, estados vacíos y modales detallados).
        """
        from pathlib import Path
        frontend_src = Path(__file__).resolve().parent.parent.parent / 'frontend' / 'src'
        self.assertTrue(frontend_src.exists(), 'El directorio frontend/src debe existir')

        # 1. Verificar existencia de páginas principales del flujo de usuario
        paginas_clave = [
            'pages/DashboardDirectora.tsx',
            'pages/ReportesDirectora.tsx',
            'pages/ReporteHistorico.tsx',
            'pages/CargaYParametrizacionRem.tsx',
            'pages/BitacoraAuditoria.tsx',
            'pages/Login.tsx',
            'components/ModalDetalleIndicador.tsx',
            'layouts/DisenoPrincipal.tsx'
        ]
        for p in paginas_clave:
            ruta_p = frontend_src / p
            self.assertTrue(ruta_p.exists(), f'La vista {p} debe existir')

        # 2. Verificar consistencia del semáforo visual de salud (verde, amarillo, rojo)
        dashboard_content = (frontend_src / 'pages/DashboardDirectora.tsx').read_text()
        self.assertIn('bg-emerald', dashboard_content)
        self.assertIn('bg-amber', dashboard_content)
        self.assertIn('bg-rose', dashboard_content)
        self.assertIn('CUMPLE', dashboard_content)
        self.assertIn('EN_RIESGO', dashboard_content)
        self.assertIn('NO_CUMPLE', dashboard_content)

        # 3. Verificar feedback visual de carga (spinners/loaders) y manejo de errores
        self.assertIn('animate-spin', dashboard_content)
        self.assertIn('disabled', dashboard_content)

        # 4. Verificar diseño responsivo (overflow horizontal en tablas y flex/grid)
        reportes_content = (frontend_src / 'pages/ReportesDirectora.tsx').read_text()
        self.assertIn('overflow-x-auto', reportes_content)
        self.assertIn('grid', reportes_content)

        # 5. Verificar modal de detalle y desglose paso a paso
        modal_content = (frontend_src / 'components/ModalDetalleIndicador.tsx').read_text()
        self.assertIn('backdrop-blur', modal_content)
        self.assertIn('numerador', modal_content)
        self.assertIn('denominador', modal_content)

    def test_vistas_comparativas_y_filtros_fecha_sector(self):
        """
        Verificación de Vistas comparativas y filtros de fecha/sector:
        - Filtro por sector territorial y desglose comparativo (desglose_sectores).
        - Filtros temporales (corte evaluativo, fecha_fin y anio).
        - Vista comparativa interanual con deltas por sector y período.
        """
        from api.models import Usuario, Rol
        from .models import Programa, Meta, Indicador

        rol_directora, _ = Rol.objects.get_or_create(nombre_rol='Directora', defaults={'descripcion': 'Directora'})
        user, _ = Usuario.objects.get_or_create(
            rut='66666666-6',
            defaults={
                'username': '66666666-6',
                'email': 'directora.comparativa@salud.cl',
                'nombres': 'Directora',
                'apellidos': 'Comparativa',
                'rol': rol_directora
            }
        )
        self.client.force_authenticate(user=user)

        # 1. Probar filtro por Sector y rango de fecha en cálculo
        res_calc = self.client.get('/api/param/calc/?anio=2026&sector=Sector+Sur+(Verde)&fecha_fin=2026-05-31')
        self.assertEqual(res_calc.status_code, 200)
        data_calc = res_calc.json()
        self.assertEqual(data_calc['sector'], 'Sector Sur (Verde)')
        self.assertEqual(data_calc['hasta_mes'], 5)
        self.assertEqual(data_calc['fecha_fin'], '2026-05-31')

        # 2. Probar endpoint de vista comparativa con filtro de sector
        res_comp = self.client.get('/api/param/comparativo/?anio_base=2025&anio_evaluacion=2026&sector=Sector+Norte+(Azul)')
        self.assertEqual(res_comp.status_code, 200)
        data_comp = res_comp.json()
        self.assertEqual(data_comp['anio_base'], 2025)
        self.assertEqual(data_comp['anio_evaluacion'], 2026)
        self.assertEqual(data_comp['sector'], 'Sector Norte (Azul)')
        self.assertIn('estadisticas', data_comp)
        self.assertIn('resultados', data_comp)

    def test_vista_bitacora_con_filtros(self):
        """
        RF-12: Verificación de la Vista de Bitácora de Auditoría con Filtros:
        - Filtrado por tipo de acción.
        - Filtrado por rol de usuario.
        - Filtrado por búsqueda general de texto.
        - Contratos visuales de la vista BitacoraAuditoria.tsx.
        """
        from api.models import Usuario, Rol, Registros

        rol_gestor, _ = Rol.objects.get_or_create(nombre_rol='Gestor', defaults={'descripcion': 'Gestor'})
        user_gestor, _ = Usuario.objects.get_or_create(
            rut='77777777-7',
            defaults={
                'username': '77777777-7',
                'email': 'gestor.auditoria@salud.cl',
                'nombres': 'Gestor',
                'apellidos': 'Auditoria',
                'rol': rol_gestor
            }
        )
        self.client.force_authenticate(user=user_gestor)

        # Crear registros de prueba en la bitácora
        Registros.objects.create(
            usuario=user_gestor,
            accion='PARAMETRIZAR_META_CELDA',
            rol_usuario='Gestor',
            tabla_afectada='Indicador',
            valor_nuevo={'codigo': 'IND-TEST'},
            ip_origen='192.168.1.100'
        )
        Registros.objects.create(
            usuario=user_gestor,
            accion='CARGA_REM',
            rol_usuario='Gestor',
            tabla_afectada='RemArchivo',
            valor_nuevo={'archivo': 'REM_A.xlsm'},
            ip_origen='192.168.1.101'
        )

        # 1. Filtro por acción
        res_accion = self.client.get('/api/registros-auditoria/?accion=PARAMETRIZAR')
        self.assertEqual(res_accion.status_code, 200)
        self.assertTrue(all('PARAMETRIZAR' in r['accion'] for r in res_accion.json()))

        # 2. Filtro por rol
        res_rol = self.client.get('/api/registros-auditoria/?rol=Gestor')
        self.assertEqual(res_rol.status_code, 200)
        self.assertTrue(all('Gestor' in r['rol_usuario'] for r in res_rol.json()))

        # 3. Filtro por búsqueda de texto
        res_search = self.client.get('/api/registros-auditoria/?search=RemArchivo')
        self.assertEqual(res_search.status_code, 200)
        self.assertTrue(any(r['tabla_afectada'] == 'RemArchivo' for r in res_search.json()))

        # 4. Verificación de frontend
        from pathlib import Path
        bitacora_path = Path(__file__).resolve().parent.parent.parent / 'frontend' / 'src' / 'pages' / 'BitacoraAuditoria.tsx'
        content = bitacora_path.read_text()
        self.assertIn('busquedaTexto', content)
        self.assertIn('filtroAccion', content)
        self.assertIn('filtroRol', content)
        self.assertIn('fechaInicio', content)
        self.assertIn('fechaFin', content)
        self.assertIn('Restablecer Filtros', content)

    def test_mi_perfil_endpoint(self):
        """
        Verificación del endpoint /api/usuarios/mi_perfil/ para el módulo
        de Mi Cuenta - Configuración: lectura y actualización con auditoría.
        """
        from api.models import Usuario, Rol

        rol, _ = Rol.objects.get_or_create(nombre_rol='Directora', defaults={'descripcion': 'Directora'})
        user, _ = Usuario.objects.get_or_create(
            rut='88888888-8',
            defaults={
                'username': '88888888-8',
                'email': 'directora.perfil@salud.cl',
                'nombres': 'Carmen',
                'apellidos': 'Reyes',
                'rol': rol
            }
        )
        self.client.force_authenticate(user=user)

        # 1. GET mi_perfil
        res_get = self.client.get('/api/usuarios/mi_perfil/')
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()['rut'], '88888888-8')

        # 2. PUT mi_perfil
        res_put = self.client.put('/api/usuarios/mi_perfil/', {
            'nombres': 'Carmen Gloria',
            'apellidos': 'Reyes González'
        }, format='json')
        self.assertEqual(res_put.status_code, 200)
        self.assertEqual(res_put.json()['status'], 'success')







