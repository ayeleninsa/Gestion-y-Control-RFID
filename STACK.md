# Stack Tecnológico - backend_RFID

## Visión General

Sistema backend para gestión de inventario de computadoras mediante lectura RFID y control de acceso de usuarios con cámaras de seguridad potenciadas por IA. Incluye frontend web para visualización y administración.

---

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Backend API | FastAPI | 0.115+ |
| Lenguaje | Python | 3.12+ |
| ORM | SQLAlchemy | 2.0+ |
| Migraciones | Alembic | 1.13+ |
| Base de datos | PostgreSQL | 16+ |
| Tiempo real | WebSockets (FastAPI nativo) | - |
| Autenticación | JWT (python-jose + passlib) | - |
| Frontend | React + Vite | 18+ / 5+ |
| Lenguaje frontend | JavaScript (sin TypeScript) | ES2022+ |
| Estilos | Tailwind CSS | 3+ |

---

## Justificación de Componentes

### FastAPI
- **Rendimiento**: Framework Python más rápido gracias a async/await nativo y Starlette.
- **Documentación automática**: Genera Swagger (OpenAPI) y ReDoc automáticamente, ideal para equipos y debugging.
- **WebSockets nativo**: Soporte integrado sin librerías externas, crítico para actualizaciones en vivo de lecturas RFID.
- **Pydantic**: Validación de datos robusta y serialización automática.

### SQLAlchemy + Alembic
- **SQLAlchemy**: ORM más maduro del ecosistema Python, con soporte async (via asyncpg), gran flexibilidad para consultas complejas de inventario.
- **Alembic**: Migraciones versionadas de base de datos, permite evolucionar el esquema sin perder datos.

### PostgreSQL
- **Confiabilidad**:Base de datos relacional robusta y probada.
- **JSONB**: Soporte nativo para datos semiestructurados (metadata de computadoras, configuraciones de cámaras).
- **Extensiones**: PostGIS (ubicaciones), pgvector (búsquedas por embeddings de IA) si se necesitan a futuro.

### JWT
- **Stateless**: Ideal para APIs REST, no requiere sesiones en servidor.
- **Escalable**: Permite distribuir la carga sin sesiones compartidas.
- **Estándar**: Amplio soporte en frontend y backend.

### WebSockets
- **Baja latencia**: Las lecturas RFID necesitan reflejarse en el dashboard en tiempo real.
- **Eficiente**: Evita polling constante, reduce carga en servidor y red.

### React + Vite + JavaScript
- **React**: Ecosistema maduro, gran comunidad, ideal para dashboards complejos.
- **Vite**: Build tool ultrarrápido con HMR (Hot Module Replacement) para desarrollo ágil.
- **JavaScript (sin TypeScript)**: Menor complejidad inicial, desarrollo más rápido para el equipo.

### Tailwind CSS
- **Utilidades first**: Prototipado rápido sin escribir CSS personalizado.
- **Consistencia**: Sistema de diseño unificado.
- **Bundle pequeño**: Purga CSS no usado en producción.

---

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────┐
│                   Cliente Web                    │
│           React + Vite + Tailwind                │
│              (Dashboard Admin)                   │
└──────────────────────┬──────────────────────────┘
                       │ HTTP REST + WebSocket
                       ▼
┌─────────────────────────────────────────────────┐
│               FastAPI (Backend)                  │
│  ┌─────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Rutas   │ │Servicios │ │ WebSocket Manager│  │
│  │ REST    │ │(RFID, IA,│ │ (eventos en vivo)│  │
│  │         │ │Acceso)   │ │                  │  │
│  └─────────┘ └──────────┘ └──────────────────┘  │
│  ┌──────────────────────────────────────────┐    │
│  │  Capa de Seguridad (JWT + Middleware)     │    │
│  └──────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────┐    │
│  │  SQLAlchemy ORM + Alembic Migraciones    │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                  PostgreSQL                      │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │ Inventario │ │ Usuarios   │ │ Accesos /    │ │
│  │ Computadoras│ │ y Roles   │ │ Eventos RFID │ │
│  └────────────┘ └────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────┘

┌───────────────────┐  ┌───────────────────────────┐
│  Lector RFID      │  │  Cámaras + IA             │
│  (HW - USB/Red)   │  │  (Modelo de detección)    │
└────────┬──────────┘  └─────────────┬─────────────┘
         │                            │
         └──────────┬─────────────────┘
                    ▼
           FastAPI (endpoints de ingesta)
```

---

## Flujo de Datos

### Lectura RFID (Inventario)
1. Lector RFID captura tag de una computadora.
2. HW envía dato a FastAPI (endpoint REST).
3. Backend valida JWT, procesa el tag, consulta/actualiza inventario en PostgreSQL.
4. WebSocket emite evento `inventario:actualizado` al dashboard.
5. Frontend React actualiza vista en tiempo real.

### Control de Acceso (Cámaras + IA)
1. Cámara captura video/persona.
2. Modelo de IA procesa la imagen (detección facial/postureo).
3. Resultado se envía a FastAPI.
4. Backend verifica en base de datos si el usuario tiene permiso.
5. Emite evento `acceso:autorizado` o `acceso:denegado` vía WebSocket.
6. Frontend muestra notificación en vivo.
