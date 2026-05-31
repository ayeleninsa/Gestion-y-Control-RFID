# Backend RFID

Sistema de gestión de inventario de computadoras mediante **lectura RFID** y control de acceso de usuarios con **cámaras de seguridad potenciadas por IA**.

---

## Flujo de trabajo con Git

**Importante:**

- **No hacer push directamente a `main`**.
- Cada desarrollador debe crear una rama paralela para pruebas o desarrollo propio:

```bash
# Crear y cambiarse a una rama nueva a partir de main
git checkout -b testing/mi-rama main

# Publicarla en el repositorio personal (origin)
git push -u origin testing/mi-rama
```

- Trabajar siempre en tu rama y, al finalizar, hacer un Pull Request hacia `main`.
- Para traer cambios del repositorio original:

```bash
git pull upstream main
```

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | FastAPI (Python 3.13) |
| ORM | SQLAlchemy 2.0 (async) |
| Base de datos | PostgreSQL 16+ |
| Frontend | React 19 + Vite + Tailwind CSS 4 |
| Tiempo real | WebSockets |
| Autenticación | JWT |

---

## Requisitos

- **Python** 3.12 o superior
- **PostgreSQL** 16 o superior (corriendo)
- **Node.js** 22 LTS o superior

---

## Inicializar el proyecto

### 1. Clonar e instalar backend

```bash
# Crear y activar entorno virtual
cd backend
python -m venv .venv
.venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `backend\.env` y ajustar los valores:

```bash
cp .env.example backend\.env
# Editar backend\.env con tus datos
```

Variables principales:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL | `postgresql+asyncpg://user:pass@localhost:5432/rfid_db` |
| `JWT_SECRET_KEY` | Clave secreta para JWT (mín 32 caracteres) | `cambiame_por_una_clave_segura_123456` |
| `CORS_ORIGINS` | Orígenes permitidos separados por coma | `http://localhost:5173` |

### 3. Crear la base de datos

Conectarse a PostgreSQL y crear la base de datos:

```sql
CREATE DATABASE rfid_db;
```

### 4. Ejecutar migraciones

```bash
cd backend
.venv\Scripts\alembic upgrade head
```

### 5. Iniciar servidor backend

```bash
cd backend
.venv\Scripts\python -m uvicorn app.main:app --reload
```

El servidor estará disponible en `http://localhost:8000`.

- Documentación interactiva: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### 6. Inicializar frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:5173`.

---

## Comandos útiles

```bash
# Backend - lint
ruff check backend/

# Backend - generar migración (después de cambiar modelos)
alembic revision --autogenerate -m "descripcion"

# Backend - aplicar migraciones
alembic upgrade head

# Frontend - lint
cd frontend && npm run lint
cd frontend && npm run build
```

---

## Estructura del proyecto

```
backend_RFID/
├── backend/
│   ├── app/
│   │   ├── api/          # Endpoints REST + WebSockets
│   │   ├── core/         # Config, DB, seguridad
│   │   ├── models/       # Modelos SQLAlchemy
│   │   ├── schemas/      # Schemas Pydantic
│   │   └── services/     # Lógica de negocio
│   ├── alembic/          # Migraciones
│   ├── .env              # Variables de entorno
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── services/
│   └── package.json
├── .env.example
├── .gitignore
├── STACK.md
└── TAREAS.md
```
