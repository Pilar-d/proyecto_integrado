# CESFAM Santa Rosa — Sistema de Monitoreo de Metas Sanitarias

Plataforma web para la gestión, procesamiento y visualización de indicadores de
cumplimiento de metas sanitarias del CESFAM Santa Rosa (Temuco), basada en los
**Requerimientos 2026** (RF-01 a RF-12).

## Stack

- **Backend:** Django 4.2 + Django REST Framework + SimpleJWT (login por RUT)
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Base de datos:** SQLite en desarrollo (Postgres preparado en `requirements.txt`)

## Puesta en marcha (desarrollo)

### Backend (puerto 8080)

```bash
cd backend
source venv/bin/activate
python manage.py migrate        # crea tablas y siembra los 4 roles
python manage.py runserver 8080
```

### Frontend (puerto 5173)

```bash
cd frontend
npm install
npm run dev
```

## Usuario de desarrollo

| RUT | Contraseña | Rol |
|-----|-----------|-----|
| `11111111-1` | `cesfam2026` | Gestor (superusuario) |

> ⚠️ Credenciales solo para desarrollo local. Cámbielas antes de cualquier despliegue.

## Roles oficiales (según documento de requerimientos)

| Rol | Permisos |
|-----|----------|
| `Directora` | Consulta reportes y dashboards. No carga REM ni modifica parámetros. |
| `Subdireccion` | Consulta reportes, carga REM, modifica información, accede a parametrización. |
| `Gestor` | Administración completa: usuarios, REM, parametrización, auditoría. |
| `JefePrograma` | Solo reportes de su programa y transversales. |

Los roles se siembran con la migración `authentication.0002_seed_roles` y se
asignan desde el admin de Django (`/admin/`).

## API principal

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/token/` | POST | Login (RUT + contraseña), devuelve JWT y rol real |
| `/api/token/refresh/` | POST | Renueva el token de acceso |
| `/api/rem/upload/` | POST | Carga y validación de planilla REM Serie A (Gestor/Subdirección) |
| `/api/rem/archivos/` | GET | Historial de cargas REM (Gestor/Subdirección) |

### Validaciones de la carga REM

- Formato `.xlsx` / `.xlsm` oficial MINSAL-DEIS (Serie A).
- Debe contener la hoja `NOMBRE` y hojas REM (`A01`, `A02`, ...).
- El mes/año declarado en el formulario debe coincidir con el de la planilla.
- Toda carga (exitosa o rechazada) queda registrada en la bitácora de auditoría (RF-12).
- Recargar un período reemplaza la carga anterior (queda como `REEMPLAZADO`).

## Estado del desarrollo

- [x] Autenticación JWT por RUT con rol real (RF-01, RF-02)
- [x] Carga de REM Serie A con validación e historial (RF-03)
- [x] Auditoría de logins y cargas (RF-12)
- [x] Vistas: Login, Dashboard (placeholder), Carga REM, Usuarios (maqueta), Auditoría (maqueta)
- [ ] CRUD de usuarios con API (rol Gestor)
- [ ] Bitácora de auditoría con API y filtros
- [ ] Parametrización de metas, indicadores, fórmulas y celdas REM (RF-04, RF-11)
- [ ] Motor de cálculo de indicadores por corte evaluativo IAAPS
- [ ] Dashboard con gráficos, reportes por área/programa y comparativos históricos (RF-05 a RF-08)
- [ ] Exportación CSV/XLSX y estructura compatible con Power BI (RF-09, RF-10)
