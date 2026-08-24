# Despliegue en Render + Supabase

Arquitectura:

| Recurso | Servicio | Proveedor |
|---|---|---|
| Frontend | Static Site (Vite → `dist`) | Render |
| Backend | Web Service (FastAPI/uvicorn) | Render |
| Base de datos | PostgreSQL gestionado | Supabase |

En desarrollo local **no cambia nada**: sin las variables nuevas (`DB_SSL`, `DB_STATEMENT_CACHE_SIZE`, `SIMULADOR_ENABLED`, `VITE_API_URL`) todo funciona igual que siempre.

---

## Paso 0 — Subir el repo a GitHub

El código hoy es solo local. `.env` ya está en `.gitignore`, no se sube.

```powershell
git add .
git commit -m "Preparación para despliegue"
# Crear el repo vacío en github.com y luego:
git remote add origin https://github.com/<tu-usuario>/backend_RFID.git
git branch -M main
git push -u origin main
```

## Paso 1 — Crear la base de datos en Supabase

1. Crear proyecto en [supabase.com](https://supabase.com) (guardar la contraseña de la BD).
2. Ir a **Project Settings → Database → Connection string**.
3. Elegir **Session pooler** (puerto 5432). Es IPv4-compatible y soporta prepared statements. Queda algo así:

   ```
   postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```

4. Si la contraseña tiene caracteres especiales (`@ # % &`), URL-encodearla (ej. `@` → `%40`).

> **No usar** el *Transaction pooler* (puerto 6543) salvo necesidad: no soporta prepared statements y exige `DB_STATEMENT_CACHE_SIZE=0`. El host directo `db.<ref>.supabase.co` es solo-IPv6 y puede no resolverse desde Render.

## Paso 2 — Migrar los datos del Postgres local a Supabase

Los binarios vienen con la instalación local de Postgres (`C:\Program Files\PostgreSQL\18\bin`, verificar que esté en `PATH`).

```powershell
# 1. Volcar la BD local (RFID)
$env:PGPASSWORD='123456'
pg_dump -h localhost -p 5432 -U postgres -d RFID -Fc --no-owner --no-privileges -f rfid_backup.dump

# 2. Restaurar en Supabase (Session pooler)
$env:PGPASSWORD='<password-de-supabase>'
pg_restore -h aws-0-<region>.pooler.supabase.com -p 5432 -U postgres.<project-ref> -d postgres --no-owner --no-privileges --clean --if-exists rfid_backup.dump
```

Como el dump ya trae el esquema completo, sincronizar el historial de Alembic (sin re-ejecutar migraciones):

```powershell
cd backend
$env:DATABASE_URL='postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres'
$env:DB_SSL='true'
.\.venv\Scripts\python -m alembic stamp head
```

*Alternativa*: si se prefiere arrancar sin datos, crear el esquema con `alembic upgrade head` (los usuarios admin/preceptor se crean solos al arrancar el backend).

## Paso 3 — Backend (Web Service en Render)

1. Dashboard → **New → Web Service** → conectar el repo de GitHub.
2. Configuración:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/api/health`
3. Variables de entorno:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | La URI Session pooler de Supabase |
   | `DB_SSL` | `true` |
   | `JWT_SECRET_KEY` | Un random fuerte (ver abajo) |
   | `CORS_ORIGINS` | `https://<frontend>.onrender.com` (completar tras crear el frontend) |
   | `SIMULADOR_ENABLED` | `false` |
   | `PYTHON_VERSION` | `3.12.7` |

Generar un secret seguro:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

4. Deploy. Verificar que `https://<backend>.onrender.com/api/health` responda `{"status": "ok"}`.

## Paso 4 — Frontend (Static Site en Render)

1. Dashboard → **New → Static Site** → mismo repo.
2. Configuración:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Variables de entorno (de build):

   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | `https://<backend>.onrender.com/api` |

4. El archivo `frontend/public/_redirects` (incluido en el build) hace fallback SPA para que `/login`, `/usuarios`, etc. no den 404 al recargar.
5. Volver al **Web Service del backend** y setear `CORS_ORIGINS=https://<frontend>.onrender.com` (ahora sí se conoce la URL) → Save → redeploy automático.

## Notas y límites del free tier

- **Cold start**: el Web Service gratuito se duerme tras ~15 min sin tráfico y tarda ~50 s en despertar. La ventana del QR dinámico es de 60 s, así que si el backend está frío el primer escaneo falla por timeout. Para demo en vivo: abrir la app un par de minutos antes o usar plan pago.
- **Supabase free pausa el proyecto** tras ~1 semana de inactividad; restaurarlo desde el dashboard.
- Los usuarios seed (`admin@test.com` / `admin123`, `preceptor@test.com` / `preceptor123`) se crean automáticamente en el primer arranque del backend.
- El túnel cloudflared deja de ser necesario: Render sirve el frontend por HTTPS, requisito para la cámara del escáner QR en el celular.

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| `prepared statement "__asyncpg..." does not exist` | Pooler en modo transaction (6543) | Usar Session pooler (5432) o setear `DB_STATEMENT_CACHE_SIZE=0` |
| `SSL is required` / conexión rechazada | Falta TLS | `DB_SSL=true` |
| Error de certificado SSL al conectar | CA faltante en el runtime | Ya se usa modo `require` (sin verificación); revisar que `DB_SSL=true` esté seteada |
| 404 al recargar una ruta del frontend | Falta `_redirects` | Verificar que exista `frontend/public/_redirects` y rebuild |
| CORS bloqueado desde el frontend | `CORS_ORIGINS` desactualizada | Setear la URL exacta del Static Site (con `https://`, sin `/` final) |
| Primer escaneo QR falla tras tiempo inactivo | Cold start del free tier | Precalentar el servicio antes de la operación |
