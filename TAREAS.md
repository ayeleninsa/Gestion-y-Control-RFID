# TAREAS - Desarrollo backend_RFID

## Leyenda
- [ ] Pendiente
- [/] En progreso
- [x] Completada

---

## Fase 1: Inicialización del Proyecto

- [x] **1.1** Inicializar repositorio Git
- [x] **1.2** Crear entorno virtual Python (`.venv`)
- [x] **1.3** Generar `requirements.txt` con dependencias base (FastAPI, SQLAlchemy, Alembic, asyncpg, python-jose, passlib, websockets, uvicorn)
- [x] **1.4** Inicializar proyecto React + Vite + JavaScript en `frontend/`
- [x] **1.5** Instalar Tailwind CSS en frontend
- [x] **1.6** Configurar ESLint y Prettier (backend y frontend)
- [x] **1.7** Crear archivos de configuración base (.env.example, .gitignore)

---

## Fase 2: Base del Backend (FastAPI)

- [x] **2.1** Crear estructura de carpetas backend
- [x] **2.2** Configurar `app/core/config.py` (variables de entorno, settings)
- [x] **2.3** Configurar `app/core/database.py` (motor SQLAlchemy async + sesión)
- [x] **2.4** Configurar `app/core/security.py` (JWT creación/verificación, hashing)
- [x] **2.5** Crear `app/main.py` con FastAPI app, CORS, lifespan
- [x] **2.6** Agregar health check endpoint (`GET /api/health`)
- [x] **2.7** Configurar Alembic e inicializar migraciones
- [x] **2.8** Verificar conexión a PostgreSQL y primeras migraciones

---

## Fase 3: Módulo de Autenticación y Usuarios

- [x] **3.1** Crear modelo SQLAlchemy `User` (id, email, username, hashed_password, rol, activo, creado, actualizado)
- [x] **3.2** Crear schema Pydantic para User (create, read, update)
- [x] **3.3** Crear endpoint `POST /api/auth/register`
- [x] **3.4** Crear endpoint `POST /api/auth/login` (devuelve JWT)
- [x] **3.5** Crear endpoint `GET /api/auth/me` (perfil del usuario logueado)
- [x] **3.6** Crear middleware/ dependency de autenticación JWT
- [x] **3.7** Crear endpoints CRUD de usuarios (solo admin)
- [x] **3.8** Agregar roles: `admin`, `preceptor`

---

## Fase 4: Módulo de Inventario (RFID - Computadoras)

- [x] **4.1** Crear modelo SQLAlchemy `Computadoras` (id, tag_rfid, modelo, estado, activa)
- [x] **4.2** Crear modelo SQLAlchemy `LecturaRFID` (id, tag_rfid, id_computadoras, timestamp, lector_origen)
- [x] **4.3** Crear schemas Pydantic para Computadoras y LecturaRFID
- [x] **4.4** Crear endpoint `POST /api/inventario/leer` (recibe tag RFID del lector)
- [x] **4.5** Crear endpoint `GET /api/inventario/computadoras` (listar con filtros)
- [x] **4.6** Crear endpoint `GET /api/inventario/computadoras/{id}`
- [x] **4.7** Crear endpoint `PUT /api/inventario/computadoras/{id}` (actualizar datos)
- [x] **4.8** Crear endpoint `DELETE /api/inventario/computadoras/{id}` (soft delete)
- [x] **4.9** Crear endpoint `GET /api/inventario/lecturas` (historial de lecturas)
- [x] **4.10** Servicio de procesamiento de tags RFID (validación, deduplicación)

---

## Fase 5: Módulo de Control de Acceso (Cámaras + IA)

- [x] **5.1** Crear modelo SQLAlchemy `Camara` (id, nombre, ubicacion, ip, activa, creado)
- [x] **5.2** Crear modelo SQLAlchemy `EventoAcceso` (id, camara_id, persona_id, tipo_evento, imagen_url, confianza_ia, resultado, timestamp)
- [x] **5.3** Crear schemas Pydantic para Camara y EventoAcceso
- [x] **5.4** Crear endpoint `POST /api/acceso/evento` (recibe detección de IA)
- [x] **5.5** Crear endpoint `GET /api/acceso/eventos` (historial con filtros)
- [x] **5.6** Crear endpoint `GET /api/acceso/camaras` (listar cámaras)
- [x] **5.7** Crear endpoint `POST /api/acceso/camaras` (registrar cámara)
- [x] **5.8** Servicio de evaluación de acceso (lógica autorización según confianza)
- [ ] **5.9** Servicio de integración con modelo de IA (interfaz para recibir predicciones)

---

## Fase 6: WebSockets - Tiempo Real

- [ ] **6.1** Crear WebSocket manager en backend (`app/services/websocket_manager.py`)
- [ ] **6.2** Endpoint WebSocket `ws://host/api/ws` (conexión autenticada vía token)
- [ ] **6.3** Evento `inventario:actualizado` (cuando se lee un tag RFID)
- [ ] **6.4** Evento `acceso:autorizado` / `acceso:denegado`
- [ ] **6.5** Evento `usuario:conectado` / `usuario:desconectado`
- [ ] **6.6** Broadcast selectivo por sala/rol

---

## Fase 7: Frontend - Base

- [x] **7.1** Configurar React Router (rutas protegidas y públicas)
- [x] **7.2** Implementar `AuthContext` y login persistente (localStorage JWT)
- [x] **7.3** Crear página de Login
- [x] **7.4** Crear layout principal (sidebar + header + contenido)
- [x] **7.5** Configurar Axios con interceptor JWT
- [ ] **7.6** Conectar WebSocket cliente con reconexión automática

### ABML Usuarios (Frontend)

- [x] Página de listado de usuarios (solo admin)
- [x] Página de creación de usuario
- [x] Página de edición de usuario
- [x] Eliminación de usuario

---

## Fase 8: Frontend - Módulo Inventario

- [ ] **8.1** Página "Listado de Computadoras" (tabla con filtros y búsqueda)
- [ ] **8.2** Página "Detalle de Computadora" (ver/editar)
- [ ] **8.3** Página "Registrar Computadora" (formulario)
- [ ] **8.4** Página "Lecturas RFID" (historial en tiempo real)
- [ ] **8.5** Componente de notificaciones en vivo vía WebSocket

---

## Fase 9: Frontend - Módulo Control de Acceso

- [ ] **9.1** Página "Eventos de Acceso" (timeline con filtros)
- [ ] **9.2** Página "Cámaras" (listado y gestión)
- [ ] **9.3** Página "Detalle de Evento" (imagen, resultado IA, metadata)
- [ ] **9.4** Dashboard con cards resumen (total accesos hoy, denegados, etc.)

---

## Fase 10: Dashboard General

- [ ] **10.1** Página Dashboard con métricas clave
- [ ] **10.2** Gráficos (total computadoras, lecturas por día, accesos por hora)
- [ ] **10.3** Timeline de actividad reciente
- [ ] **10.4** Alertas visuales en tiempo real

---

## Fase 11: Pruebas y Calidad

- [ ] **11.1** Tests unitarios backend (pytest + httpx)
- [ ] **11.2** Tests de integración backend (base de datos de prueba)
- [ ] **11.3** Tests de WebSockets backend
- [ ] **11.4** Tests frontend (Vitest + React Testing Library)
- [ ] **11.5** Configurar linting y formateo automático (pre-commit hooks)
- [ ] **11.6** Documentación de API (Swagger ya viene con FastAPI)

---

## Fase 12: Simulacion Temporal (datos en memoria)

- [x] **12.1** Crear `backend/app/services/simulador.py` con datos generados en memoria al iniciar servidor
  - [x] 12.1.1 Datos de alumnos (nombre, email, dni, carrera, cohorte)
  - [x] 12.1.2 Datos de computadoras con QR fisico (id_unico, modelo, tag_rfid, alumno asignado)
  - [x] 12.1.3 QR fisico pegado en cada computadora (id_unico, alumno, cohorte, modelo, carrera, tag_rfid, hash)
  - [x] 12.1.4 QR dinamico diario por carrera/año (hash unico, correo, dni, carrera, año, fecha)
  - [x] 12.1.5 Actividad de camaras IP (prestamos, devoluciones, lecturas antena, escaneos QR, movimientos)
  - [x] 12.1.6 Alertas automaticas (alumno con mas de una computadora, detecciones sin registro, etc.)
  - [x] 12.1.7 Lecturas de antena RFID (tag, computadora, lector, timestamp, ubicacion)
  - [x] 12.1.8 Generacion periodica de nuevos eventos cada 25-45 segundos (background thread)
  - [x] 12.1.9 Stats y grafico de prestamos para dashboard
- [x] **12.2** Crear `backend/app/api/simulacion.py` con endpoints REST para servir datos simulados
  - [x] 12.2.1 `GET /api/simulacion/stats`
  - [x] 12.2.2 `GET /api/simulacion/actividad`
  - [x] 12.2.3 `GET /api/simulacion/alertas`
  - [x] 12.2.4 `GET /api/simulacion/eventos-qr`
  - [x] 12.2.5 `GET /api/simulacion/lecturas-antenna`
  - [x] 12.2.6 `GET /api/simulacion/qr-fisico`
  - [x] 12.2.7 `GET /api/simulacion/qr-dinamico`
  - [x] 12.2.8 `GET /api/simulacion/prestamos`
  - [x] 12.2.9 `GET /api/simulacion/camaras`
  - [x] 12.2.10 `GET /api/simulacion/grafico-prestamos`
- [x] **12.3** Registrar simulador en `main.py` (lifespan + router)
- [x] **12.4** Dashboard.jsx consume datos simulados (stats, actividad, camaras, prestamos, grafico)
- [x] **12.5** EventosQR.jsx consume datos simulados (escaneos QR fisicos y dinamicos)
- [x] **12.6** Alertas.jsx consume datos simulados (alertas con tipo, mensaje, timestamp, leida/no leida)
- [x] **12.7** Crear pagina `AntenaRFID.jsx` con lecturas de antenas en tiempo real
  - [x] 12.7.1 Cards por antena con contador de lecturas
  - [x] 12.7.2 Tabla historial con tag RFID, computadora, modelo, lector, ubicacion, timestamp
- [x] **12.8** Agregar "Antena RFID" al menu lateral y ruta en App.jsx

---

## Fase 13: Despliegue

- [ ] **12.1** Configurar variables de entorno para producción
- [ ] **12.2** Crear scripts de deploy / Dockerfile
- [ ] **12.3** Configurar CORS para producción
- [ ] **12.4** Pruebas de carga y rendimiento
- [ ] **12.5** Documentación final del proyecto
