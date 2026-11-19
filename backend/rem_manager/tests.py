"""
Pruebas unitarias para la validación y carga de archivos REM (RF-03)
con reporte de errores por fila y columna.
"""
import io
import openpyxl
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from api.models import Usuario, Rol
from .models import RemArchivo
from .validator import validar_archivo_rem, descomponer_coordenada


class RemUploadTestCase(TestCase):
    def setUp(self):
        self.rol_gestor = Rol.objects.create(nombre_rol='Gestor', descripcion='Gestor')
        self.rol_jefe = Rol.objects.create(nombre_rol='JefePrograma', descripcion='Jefe')

        self.gestor = Usuario.objects.create_user(
            rut='33333333-3',
            username='33333333-3',
            password='cesfam2026',
            email='gestor.test@salud.cl',
            nombres='María',
            apellidos='Pérez',
            rol=self.rol_gestor
        )

        self.jefe = Usuario.objects.create_user(
            rut='44444444-4',
            username='44444444-4',
            password='cesfam2026',
            email='jefe.test@salud.cl',
            nombres='Marcela',
            apellidos='Riquelme',
            rol=self.rol_jefe
        )

        self.client = APIClient()

    def _crear_excel(self, hojas=None, celdas_error=None):
        wb = openpyxl.Workbook()
        hojas = hojas or ['NOMBRE', 'A01', 'A02', 'A24']
        wb.active.title = hojas[0]
        for h in hojas[1:]:
            wb.create_sheet(title=h)

        if celdas_error:
            for hoja, celda, valor in celdas_error:
                if hoja in wb.sheetnames:
                    wb[hoja][celda] = valor

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        return buf

    def test_descomponer_coordenada(self):
        fila, col = descomponer_coordenada('D11')
        self.assertEqual(fila, 11)
        self.assertEqual(col, 'D')

        fila, col = descomponer_coordenada('AA150')
        self.assertEqual(fila, 150)
        self.assertEqual(col, 'AA')

        fila, col = descomponer_coordenada('invalido')
        self.assertIsNone(fila)
        self.assertIsNone(col)

    def test_validacion_archivo_valido(self):
        buf = self._crear_excel()
        buf.name = 'REM_Serie_A_Enero_2026.xlsx'
        buf.size = len(buf.getvalue())

        res = validar_archivo_rem(buf, {'hojaRem': 'A24'})
        self.assertTrue(res['es_valido'])
        self.assertEqual(res['total_errores'], 0)

    def test_validacion_errores_por_fila_y_columna(self):
        # Libro con errores intencionales en celdas específicas
        celdas_con_error = [
            ('A01', 'D11', '#REF!'),
            ('A02', 'F14', '#DIV/0!'),
        ]
        buf = self._crear_excel(celdas_error=celdas_con_error)
        buf.name = 'REM_Serie_A_Corrupto.xlsx'
        buf.size = len(buf.getvalue())

        res = validar_archivo_rem(buf, {
            'hojaRem': 'A01',
            'filaInicioDatos': 10,
            'columnaIndicador': 'D'
        })
        self.assertFalse(res['es_valido'])
        self.assertGreaterEqual(res['total_errores'], 1)

        error_d11 = next((e for e in res['errores'] if e['celda'] == 'D11'), None)
        self.assertIsNotNone(error_d11)
        self.assertEqual(error_d11['hoja'], 'A01')
        self.assertEqual(error_d11['fila'], 11)
        self.assertEqual(error_d11['columna'], 'D')
        self.assertEqual(error_d11['tipo'], 'ERROR_FORMULA')

    def test_upload_endpoint_rechaza_extension_invalida(self):
        self.client.force_authenticate(user=self.gestor)
        archivo_txt = SimpleUploadedFile('documento.txt', b'contenido de texto no excel', content_type='text/plain')
        res = self.client.post('/api/rem/upload/', {'file': archivo_txt}, format='multipart')
        self.assertEqual(res.status_code, 400)
        self.assertIn('errores_detalle', res.json())
        self.assertEqual(res.json()['errores_detalle'][0]['tipo'], 'FORMATO_INVALIDO')

    def test_upload_endpoint_exitoso_para_gestor(self):
        self.client.force_authenticate(user=self.gestor)
        buf = self._crear_excel()
        archivo_excel = SimpleUploadedFile('REM_Enero_Valido.xlsx', buf.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

        res = self.client.post('/api/rem/upload/', {
            'file': archivo_excel,
            'periodo_mes': 1,
            'periodo_year': 2026
        }, format='multipart')

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['status'], 'success')
        self.assertEqual(res.json()['estado'], 'VALIDO')
        self.assertEqual(RemArchivo.objects.count(), 1)

    def test_upload_endpoint_bloquea_rol_no_autorizado(self):
        # Jefe de programa no tiene permisos de carga REM (solo Gestor y Subdirección)
        self.client.force_authenticate(user=self.jefe)
        buf = self._crear_excel()
        archivo_excel = SimpleUploadedFile('REM_Intento.xlsx', buf.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

        res = self.client.post('/api/rem/upload/', {'file': archivo_excel}, format='multipart')
        self.assertEqual(res.status_code, 403)
