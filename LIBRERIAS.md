# LIBRERIAS.md — Librerías y protocolos de IPF SmartTrack

> Documento vivo: actualizar este archivo cada vez que se agregue, cambie o quite una
> librería o protocolo. Ver sección [Historial de cambios](#historial-de-cambios).

---

## 1. Backend (Python / FastAPI)

| Librería | Versión | Protocolo / uso | Por qué |
|---|---|---|---|
| `fastapi` | 0.115.6 | Framework web ASGI (async) | Desarrolla toda la API REST con validación, routing y docs automáticas (Swagger en `/docs`) sobre un event loop asíncrono. |
| `uvicorn[standard]` | 0.34.0 | Servidor ASGI (HTTP/1.1, h11, websockets) | Sirve la app FastAPI. `[standard]` incluye `websockets` y mejoras de rendimiento. Backend corre en `0.0.0.0:8000` con `--reload`. |
| `sqlalchemy[asyncio]` | 2.0.36 | ORM async (patrón Mapped/mapped_column) | Mapea tablas a objetos Python y arma queries tipadas. El modo async evita bloquear el event loop. |
| `asyncpg` | 0.30.0 | Driver async de PostgreSQL (protocolo wire de PostgreSQL) | Driver no bloqueante de PostgreSQL, el más rápido del ecosistema Python async. |
| `alembic` | 1.14.0 | Migraciones de esquema (DDL versionado) | Evoluciona la tabla de la DB de forma reproducible. `include_object` en `env.py` protege tablas externas (Persona, alumnos, preceptor). |
| `python-jose[cryptography]` | 3.3.0 | JWT (HS256, firmado) | Token stateless para autenticación y para el QR dinámico de 60 s. `[cryptography]` agrega algoritmos seguros. |
| `passlib[bcrypt]` | 1.7.4 | Hash de contraseñas | Hash adaptativo y lento por diseño (brute force inviable). |
| `bcrypt` | 4.0.1 | Algoritmo de hashing (adobe: ver passlib) | Implementación concreta de bcrypt usada por passlib. |
| `pydantic` | 2.10.3 | Validación y schemas (BaseModel) | Define el contrato request/response de cada endpoint, genera la doc y elimina tipos inválidos. |
| `email-validator` | 2.3.0 | Validación de emails (Pydantic) | Soporta `EmailStr` en los schemas de usuarios/alumnos. |
| `pydantic-settings` | 2.7.0 | Configuración desde variables/`.env` | Carga `DATABASE_URL`, JWT secret, CORS, etc. desde `.env`. |
| `websockets` | 14.1 | WebSocket (RFC 6455) | Instalado para el tiempo real planificado (Fase 6 de TAREAS.md). Aún **no implementado** en endpoints. |
| `httpx` | 0.28.1 | Cliente HTTP async + DigestAuth | Consumo del snapshot HTTP ISAPI de cámaras Hilook/Hikvision (`httpx.DigestAuth`), proxying de frames hacia el browser y pruebas end-to-end. |
| `pytest` / `pytest-asyncio` | 8.3.4 / 0.24.0 | Framework de testing + plugin async | Correr tests unitarios sobre el stack async. |
| `python-multipart` | 0.0.19 | `multipart/form-data` | Necesario para `UploadFile` en `POST /api/alumnos/import` (CSV/Excel). |
| `openpyxl` | 3.1.5 | Lectura de archivos Excel (.xlsx) | Procesa el template de importación de alumnos. |
| `opencv-python-headless` / `opencv-python` | 5.0.0 | Procesamiento de visión por computadora | Decodificación de frames RTSP, redimensionamiento, dibujo de bounding boxes translúcidos y codificación a JPEG para streaming. |
| `ultralytics` | 8.4.160 | Framework YOLOv8 e inferencia | Carga y ejecución del modelo entrenado de detección de cajas (`best.onnx` y `best.pt`), gestión de ByteTrack. |
| `onnxruntime` | 1.30.0 | Runtime de inferencia acelerado ONNX | Inferencia optimizada en CPU de `best.onnx` (~190 ms por frame a 1024x576 px). |
| `lap` | 0.5.13 | Algoritmo de asignación lineal (LAP) | Necesario para el algoritmo de seguimiento multiobjeto ByteTrack. |

## 2. Frontend (React / Vite)

| Librería | Versión | Uso | Por qué |
|---|---|---|---|
| `react` / `react-dom` | 19.2.x | UI (componentes, hooks) | Base del SPA. |
| `vite` | 8.0.x | Bundler / dev server | Arranque y build rápidos, HMR. Config con `host: true` y `allowedHosts: true` para acceso desde el celular y el túnel. |
| `@vitejs/plugin-react` | 6.0.1 | Plugin React (Fast Refresh) | Actualizaciones en caliente de componentes. |
| `react-router-dom` | 7.15.1 | Enrutamiento cliente (SPA) | Rutas `/login`, `/usuarios`, `/alumnos`, `/computadoras`, `/prestamos`, etc., con rutas protegidas por rol (`ProtectedRoute`). |
| `axios` | 1.16.1 | Cliente HTTP para el backend | `baseURL: '/api'`; interceptor que agrega el JWT y redirige a `/login` en 401. |
| `tailwindcss` | 4.3.0 | CSS utilitario (`@theme`, colores IPF) | Estilizado rápido, responsive (mobile-first), sin CSS custom. |
| `@tailwindcss/vite` | 4.3.0 | Plugin de Tailwind para Vite | Compila las utilidades en el build. |
| `html5-qrcode` | 2.3.8 | Escaneo de QR desde la cámara (cámara + decodificador) | Escáner del alumno (`EscanerQR.jsx`) con `facingMode: environment`. Requiere HTTPS en móvil. |
| `qrcode.react` | 4.2.0 | Generación de QR (SVG) | QR de computadoras en el módulo `Computadoras` (codifica el texto con datos del alumno). |
| `lucide-react` | 1.17.x | Iconografía SVG | Iconos del sidebar y botones (cumple el estilo corporativo sin peso extra). |
| `eslint` + plugins | 10.x | Linting JS/React | Calidad de código (`npm run lint`). |
| `prettier` / `eslint-config-prettier` | 3.8.x / 10.x | Formato de código | Estilo consistente. |

## 3. Bases de datos

| Componente | Versión | Protocolo | Por qué |
|---|---|---|---|
| PostgreSQL | 18.4 | Wire protocol de PostgreSQL (asyncpg por TCP) | DB principal `RFID` en `localhost:5432`. |

## 4. Protocolos de comunicación

| Protocolo | Dónde se usa | Por qué |
|---|---|---|
| **HTTP/1.1 + JSON** | Toda la API REST (`/api/*`) | Estándar universal, legible, validado con Pydantic v2. |
| **HTTP/2 + QUIC (HTTPS)** | Túnel Cloudflare al celular | Certificado válido; es **requisito del navegador** para usar la cámara (HTTPS). |
| **JWT (HS256)** | Auth (`Authorization: Bearer`), QR dinámico de 60 s | Autenticación stateless: el backend no guarda sesiones. |
| **bcrypt** | Hasheo de contraseñas | Cost factor alto → protección frente a brute force. |
| **multipart/form-data** | Import de alumnos (CSV/Excel) | Estándar para subir binarios con axios `FormData`. |
| **ISAPI / Digest Auth (HTTP)** | Comunicación Backend ↔ Cámaras Hilook / Hikvision | Protocolo propietario de Hikvision sobre HTTP con autenticación Digest para obtener snapshots JPEG (`/ISAPI/Streaming/channels/{ch}/picture`). |
| **MJPEG (multipart/x-mixed-replace)** | Streaming Backend → Frontend (`/api/acceso/camaras/{id}/mjpeg`) | Permite mostrar la transmisión en vivo de cámaras RTSP/ISAPI en cualquier navegador sin plugins ni soporte nativo de RTSP. |
| **WebSocket (RFC 6455)** | **Pendiente** (`websockets` instalado) | Previsto para notificaciones en vivo del dashboard (eventos de antena/rfid). Hoy se usa polling HTTP en `/api/simulacion/*`. |

### Flujo de QR (resumen de protocolos)
- QR **físico** (stickers): texto estático → lo escanea cualquier lector y **muestra los datos del alumno** sin red.
- QR **dinámico** (pantalla): JWT firmado verificado en `POST /api/qr/validar`.
- Endpoint público `GET /api/qr/alumno-por-dni/{dni}`: permite consultar el dueño de una computadora sin login (consulta desde el celular).

## 5. Herramientas de desarrollo

| Herramienta | Uso |
|---|---|
| `cloudflared` (túnel) | Expone `localhost:5173` en `https://*.trycloudflare.com` para probar desde el celular (HTTPS/cámara). Los dominios son temporales. |
| `ruff` | Linting de Python (backend). |
| `.venv` (backend) | Entorno virtual Python aislado. |
| Vite proxy (`/api` → `localhost:8000`) | Evita problemas de CORS en desarrollo. |

---

## Historial de cambios

- **2026-09-23** — Integración completa del Detector de Cajas con IA (SmartTrack):
  - Inclusión de `ultralytics`, `onnxruntime`, `lap` y `opencv-python` para inferencia YOLOv8s y seguimiento ByteTrack.
  - Implementación de `DetectorService` en segundo plano con optimización por detección de movimiento (Software / ISAPI).
  - Streaming MJPEG en vivo con bounding boxes translucidos y endpoint `/api/acceso/camaras/conteo-ia`.
  - Visualización en el Dashboard con badge en vivo de cajas en armario (`X / 22 Cajas`) e indicador de actividad de IA.
- **2026-09-23** — Integración de cámara IP Hilook TST Aula:
  - Backend: endpoints de proxy `/snapshot` y `/mjpeg` en `app/api/acceso.py` usando `httpx.DigestAuth` para interactuar con el protocolo ISAPI de Hikvision/Hilook.
  - Frontend: actualización del Dashboard para consumir stream MJPEG autenticado y seleccionar dinámicamente la cámara con transmisión activa.
- **2026-08-12** — Versión inicial del documento con el snapshot actual del stack: creación del módulo `prestamos`, autocomplete de alumnos, QR de computadoras con datos en texto, túnel HTTPS con cloudflared.

## Regla de actualización

Cada vez que se **agregue, actualice o elimine** una librería/protocolo:

1. Editar las tablas correspondientes (Backend / Frontend / Protocolos).
2. Agregar una entrada en **Historial de cambios** con la fecha (YYYY-MM-DD) y qué cambió.
3. Si cambió una versión, actualizar también `requirements.txt` (backend) o `package.json` (frontend).