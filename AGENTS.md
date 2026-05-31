# IPF SmartTrack — Contexto del proyecto

## Stack
- **Backend**: Python, FastAPI, SQLAlchemy async, asyncpg, Alembic, Pydantic v2, JWT + bcrypt
- **Frontend**: React + Vite + JavaScript + Tailwind CSS v4 (clases `@theme` en CSS)
- **DB**: PostgreSQL 18.4, host localhost:5432, database `RFID`, user `postgres`, pass `123456` (en `.env`)
- **Tiempo real**: WebSockets (pendiente implementar)

## Seed users (creados automáticamente al iniciar servidor)
- `admin@test.com` / `admin123` — rol `admin`
- `preceptor@test.com` / `preceptor123` — rol `preceptor`

## Comandos
```bash
# Backend (desde backend/)
cd backend && .venv\Scripts\python -m uvicorn app.main:app --reload

# Frontend (desde frontend/)
cd frontend && npm run dev
```

## Variables de entorno importantes
- `VITE_APP_ENV=development` en `frontend/.env.local` — habilita quick-access buttons en login
- `DATABASE_URL` se sobreescribe en `.env` (postgres+asyncpg://postgres:123456@localhost:5432/RFID)

## Rutas frontend
- `/login` → Login.jsx (diseño two-panel, verde oscuro corporativo)
- `/` → Dashboard.jsx (stats, actividad en tiempo real, cámaras, gráfico, tabla préstamos)
- `/usuarios` → Users.jsx (listado + CRUD, solo admin)
- `/usuarios/nuevo` / `/usuarios/:id/editar` → UserForm.jsx

## Colores corporativos (definidos en `index.css` via `@theme`)
- `ipf-dark`: `#0a191e`
- `ipf-green`: `#006143`
- `ipf-light-green`: `#24c48a`
- Font: Inter (Google Fonts)

## Login
- Diseño two-panel (desktop) / single-panel (mobile)
- Left panel: logo IPF, features con iconos SVG
- Right panel: formulario con email, password (toggle show/hide), "Olvidaste tu contraseña?", botón submit verde
- Tras login: redirige a `/usuarios`
- Usa instancia axios separada (sin interceptor global) para evitar redirect en error 401

## Modelos backend
- `User` (id, username, email, password_hash, rol, persona_id nullable FK → Persona, activo)
- `Persona` (tabla existente externa, no modelada en SQLAlchemy)
- `Computadoras` (id, marca, modelo, nro_serie, tag_rfid único, activa, ...)
- `DetalleMant` (FK → Computadoras, fechas, observaciones)
- `LecturaRFID` (FK → Computadoras, timestamp, ubicacion)

## Convenciones
- Ruff para linting Python, ESLint/Prettier para JS
- Alembic `env.py` usa `include_object` para no eliminar tablas externas (alumnos, carreras, imagen, preceptor)
- Backend corre en `0.0.0.0:8000`, frontend en `localhost:5173`
- CORS permitido: `http://localhost:5173`
