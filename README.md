# CESFAM Santa Rosa — Plataforma Unificada (Monorepo)

Este repositorio unifica el backend (**Django REST Framework** proveniente de `gms-cesfam`) y el frontend (**React 19 + Vite + TypeScript + Tailwind CSS** proveniente de `proyecto-integrado`) en una arquitectura de monorepo limpia y desacoplada.

---

## 📁 Estructura del Proyecto

```text
proyecto_integrado/
├── backend/               # Backend en Django + Django REST Framework + SimpleJWT
│   ├── api/               # Modelos (Rol, Usuario, Metas, REM, Auditoría), Vistas, Serializers
│   ├── core/              # Configuración principal, settings, urls y JWT
│   ├── manage.py          # Gestor de comandos de Django
│   ├── requirements.txt   # Dependencias de Python
│   ├── .env               # Variables de entorno del backend (Base de datos, Secret Key)
│   └── venv/              # Entorno virtual de Python
├── frontend/              # Frontend en React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/               # Código fuente (pages, layouts, components, api)
│   │   ├── api/axios.ts   # Cliente HTTP centralizado con interceptores JWT
│   │   └── pages/         # Vistas: Login, Dashboard, Gestión de Usuarios, Auditoría, etc.
│   ├── package.json       # Dependencias de npm
│   ├── vite.config.ts     # Configuración de Vite
│   └── .env               # Variables de entorno del frontend (VITE_API_URL)
├── package.json           # Scripts de conveniencia para la raíz
└── README.md              # Documentación general
```

---

## 🚀 Puesta en Marcha

### 1. Iniciar el Backend (Django)

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Aplicar migraciones
python manage.py migrate

# Crear superusuario (se solicitará RUT, email, nombres, apellidos y contraseña)
python manage.py createsuperuser

# Iniciar servidor en el puerto 8000
python manage.py runserver 8000
```

> **Base de Datos:** Por defecto en desarrollo local utilizará SQLite (`db.sqlite3`). Si deseas usar PostgreSQL, configura las variables `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` y `DB_PORT` en [backend/.env](file:///Users/d/Desktop/proyecto_integrado/backend/.env).

### 2. Iniciar el Frontend (React + Vite)

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

El frontend se abrirá en `http://localhost:5173` y se conectará automáticamente a la API en `http://127.0.0.1:8000/api/`.

---

## 🔑 Autenticación y Credenciales

- El inicio de sesión utiliza el endpoint real del backend: `POST /api/auth/login/`.
- El campo identificador es el **RUT** institucional y la **Contraseña**.
- Tras la autenticación exitosa, el backend retorna tokens JWT (`access` y `refresh`) junto con la información y rol del usuario (`Directora`, `Subdireccion`, `Gestor`, `JefePrograma`), los cuales se almacenan en `localStorage`.

---

## 📡 Endpoints Principales del Backend

| Endpoint | Métodos | Descripción |
| :--- | :--- | :--- |
| `/api/auth/login/` | `POST` | Autenticación JWT por RUT y contraseña |
| `/api/auth/refresh/` | `POST` | Refresco de token de acceso JWT |
| `/api/roles/` | `GET`, `POST` | Gestión de roles de usuario |
| `/api/usuarios/` | CRUD | Gestión de funcionarios y perfiles |
| `/api/sectores/` | CRUD | Sectores del CESFAM |
| `/api/programas/` | CRUD | Programas de salud |
| `/api/metas-sanitarias/` | CRUD | Metas sanitarias vigentes |
| `/api/indicadores/` | CRUD | Indicadores de cumplimiento |
| `/api/plantillas-mapeo/` | CRUD | Coordenadas de celdas de planillas REM |
| `/api/archivos-rem/` | CRUD | Registro y carga de planillas REM |
| `/api/valores-extraidos/` | CRUD | Valores extraídos de las celdas REM |
| `/api/cumplimiento-mensual/` | CRUD | Porcentajes calculados y estado de umbrales |
| `/api/registros-auditoria/` | `GET`, `POST` | Bitácora de auditoría y trazabilidad |
