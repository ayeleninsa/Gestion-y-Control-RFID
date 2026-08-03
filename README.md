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

### 7. (Alternativa) Base de datos con Docker

Levantar una instancia PostgreSQL aislada sin afectar servicios existentes:

```bash
docker compose up -d
```

El contenedor expone PostgreSQL en el puerto `5433` del host. El esquema y datos de `RFID.sql` se cargan automáticamente al primer inicio.

Connection string para `backend\.env`:
```
DATABASE_URL=postgresql+asyncpg://postgres:123456@localhost:5433/RFID
```

Detener:
```bash
docker compose down
```

Eliminar datos (volumen):
```bash
docker compose down -v
```

---

## Respaldar e Importar la Base de Datos (`RFID.sql`)

### 1. Guardar los datos en `RFID.sql` (Exportar)

Si realizaste cambios en la base de datos y quieres guardar la estructura y los datos actualizados en el archivo `RFID.sql`:

#### Con Docker (Recomendado, no requiere pg_dump instalado localmente)
```bash
docker run --rm -e PGPASSWORD=123456 postgres:16 pg_dump -h host.docker.internal -p 5432 -U postgres RFID > RFID.sql
```

#### Con pg_dump en la terminal
```bash
# Windows (PowerShell)
$env:PGPASSWORD="123456"; pg_dump -U postgres -h localhost -p 5432 -d RFID -f RFID.sql

# Linux / macOS (Bash)
PGPASSWORD="123456" pg_dump -U postgres -h localhost -p 5432 -d RFID -f RFID.sql
```

#### Con pgAdmin 4
1. Haz clic derecho sobre la base de datos `RFID` -> **Backup...**.
2. Asigna la ruta del archivo `RFID.sql` y selecciona formato **Plain**.
3. Haz clic en **Backup**.

---

### 2. Volver a insertar / restaurar los datos (Importar)

Para cargar los datos respaldados en `RFID.sql` en una nueva PC o base de datos vacía:

#### Con psql en la terminal
1. Asegúrate de tener la base de datos creada (`CREATE DATABASE RFID;`).
2. Ejecuta el comando de restauración:
   ```bash
   # Windows (PowerShell)
   $env:PGPASSWORD="123456"; psql -U postgres -h localhost -p 5432 -d RFID -f RFID.sql

   # Linux / macOS (Bash)
   PGPASSWORD="123456" psql -U postgres -h localhost -p 5432 -d RFID -f RFID.sql
   ```

#### Con Docker Compose
Si levantas la base de datos con Docker (`docker compose up -d`), la imagen cargará el archivo `RFID.sql` de la raíz automáticamente en la primera ejecución.

Para restaurar manualmente sobre un contenedor ya iniciado:
```bash
docker exec -i <nombre_contenedor_postgres> psql -U postgres -d RFID < RFID.sql
```

#### Con pgAdmin 4
1. Crea una base de datos `RFID`.
2. Haz clic derecho sobre `RFID` -> **Restore...**.
3. Selecciona el archivo `RFID.sql` y haz clic en **Restore**.

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
