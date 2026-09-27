# Guía de Comunicación Cámara ↔ Sistema IPF SmartTrack

Objetivo: conectar una cámara IP al sistema para que su transmisión (RTSP/MJPEG) se vea en el Dashboard de preceptor/admin.

---

## 1. Dirección de la información

| Dirección | Qué pasa | Dónde |
|---|---|---|
| **Sistema → Cámara** | El sistema envía la URL del stream para que la cámara empiece a transmitir | Base de datos `camaras.stream_url` |
| **Cámara → Sistema** | La cámara envía el flujo de video (RTSP o MJPEG) | Browser muestra el `<video>` con esa URL |

**Nota:** la cámara no recibe comandos del sistema por ahora (solo se configura la URL). El sistema lee el stream en vivo.

---

## 2. Qué datos necesita cada cámara

Para registrar una cámara en el sistema necesitás completar estos campos (se envían al `POST /api/acceso/camaras`):

| Campo | Ejemplo | Descripción |
|---|---|---|
| `nombre` | `"Camara Aula TST"` | Nombre descriptivo para identificarla |
| `ubicacion` | `"Aula principal - TST"` | Dónde está física |
| `ip` | `"192.168.1.100"` | IP de la cámara en la red local |
| `stream_url` | `"rtsp://admin:12345@192.168.1.100:554/stream1"` | URL del stream RTSP o MJPEG |
| `activa` | `true` | Si está activa (se muestra en el Dashboard) |

---

## 3. Formato de la URL de stream (`stream_url`)

### RTSP (protocolo estándar de cámaras IP)
```
rtsp://<usuario>:<contraseña>@<ip>:<puerto>/<ruta>
```

Ejemplos según marca:
```
# Hikvision
rtsp://admin:12345@192.168.1.100:554/Streaming/Channels/101

# Dahua
rtsp://admin:12345@192.168.1.101:554/cam/realmonitor?channel=1&subtype=0

# Reolink
rtsp://admin:12345@192.168.1.102:554/stream1

# Genérica / ONVIF
rtsp://admin:12345@192.168.1.103:554/live

# Hilook (modelo HDCVI / AI / NVR)
rtsp://admin:12345@192.168.1.104:554/Streaming/Channels/101
rtsp://admin:12345@192.168.1.104:554/h264/ch1/main/av_stream
```

### MJPEG (más compatible con navegadores)
```
http://<ip>:<puerto>/<ruta>
```
```
# Muchas cámaras baratas / IP cam web
http://192.168.1.100:8080/video
http://192.168.1.101:8080/mjpg/video.mjpg
http://192.168.1.102:80/video
```

> **Recomendación:** usá MJPEG si la cámara lo soporta, es el más compatible con el `<video>` del navegador. RTSP funciona en Chrome/Edge pero puede requerir configuración adicional.

### Hilook — Modelos y rutas RTSP específicas

Hilook (marca de cámaras HDCVI/IP, compatible con protocolo ONVIF). Los modelos más comunes usan rutas tipo Hikvision:

| Modelo Hilook | URL RTSP | Puerto |
|---|---|---|
| Hilook HDCVI (analógica IP) | `rtsp://admin:12345@<ip>:554/Streaming/Channels/101` | 554 |
| Hilook AI (nueva generación) | `rtsp://admin:12345@<ip>:554/h264/ch1/main/av_stream` | 554 |
| Hilook conectada a NVR | `rtsp://admin:contraseña@<ip>:554/Streaming/Channels/101` | 554 |
| Hilook con usuario personalizado | `rtsp://usuario:password@<ip>:554/h264/ch1/main/av_stream` | 554 |

> Si la cámara está conectada a un **NVR Hilook**, usar la IP del NVR y el canal correspondiente (`101` = canal 1, `102` = canal 2, etc.).

---

## 4. Pasos para conectar una cámara

### Paso 1 — Obtener los datos de la cámara
1. Encender la cámara en la red local.
2. Anotar: **IP**, **puerto RTSP** (usualmente 554), **usuario**, **contraseña**, **ruta del stream**.
3. Probar la URL en VLC: `Medio → Abrir ubicación de red → rtsp://...` para confirmar que funciona.

### Paso 2 — Registrar la cámara en el sistema
```http
POST http://localhost:8000/api/acceso/camaras
Content-Type: application/json
Authorization: Bearer <token_admin>

{
  "nombre": "Camara Aula TST",
  "ubicacion": "Aula principal",
  "ip": "192.168.1.100",
  "stream_url": "rtsp://admin:12345@192.168.1.100:554/stream1",
  "activa": true
}
```

O desde el código Python (simulador/seeder):
```python
# En backend/app/services/seeder.py → SEED_CAMARAS
SEED_CAMARAS = [
    {"nombre": "Camara Aula TST", "ubicacion": "Aula principal", "ip": "192.168.1.100", "stream_url": "rtsp://admin:12345@192.168.1.100:554/stream1"},
]
```

### Paso 3 — Verificar la conexión
1. Reiniciar el backend: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
2. Verificar:
   ```http
   GET http://localhost:8000/api/acceso/camaras
   Authorization: Bearer <token_admin>
   ```
   → debe devolver la cámara con `stream_url` y `activa: true`.
3. Abrir el Dashboard del preceptor en el navegador (`http://localhost:5173`).
4. El `<video>` debe mostrar la transmisión de la cámara.

### Paso 4 — Solucionar problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| Video en negro | URL RTSP incorrecta o cámara offline | Probar la URL en VLC |
| Video en negro | Navegador no soporta RTSP | Cambiar a MJPEG o instalar `hls.js` |
| Error CORS | Cámara en red diferente al backend | El backend proxya la petición |
| "Sin transmisión" | `stream_url` es `null` en BD | Completar el campo `stream_url` |
| Cámara no aparece | `activa: false` | Cambiar a `activa: true` |

---

## 5. Estructura de datos en la base de datos

Tabla `camaras`:
```
id_camara   | nombre           | ubicacion       | ip            | stream_url                           | activa | created_at
--------------------------------------------------------------------------------------------------------------
1           | Camara Aula TST  | Aula principal  | 192.168.1.100 | rtsp://admin:12345@...554/stream1   | true   | 2026-09-23...
2           | Camara Inventario| Puerta ingreso  | 192.168.1.100 | http://192.168.1.100:8080/video     | true   | 2026-09-23...
```

---

## 6. Endpoint de API relevantes

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/api/acceso/camaras` | Listar todas las cámaras (ya funciona) |
| `POST` | `/api/acceso/camaras` | Registrar una nueva cámara |
| `PUT` | `/api/acceso/camaras/{id}` | Actualizar cámara (cambiar URL, activar/desactivar) |
| `GET` | `/simulacion/camaras` | Listado simulado (solo para desarrollo) |

---

## 7. Qué cambia en el Dashboard (vista preceptor/admin)

- Se muestra un `<video>` con el `stream_url` de la primera cámara activa
- Indicador verde "En vivo" si la cámara responde, rojo "Sin conexión" si no
- Nombre de la cámara visible en la esquina inferior izquierda
- El stream se refresca cada 15 segundos verificando conexión

---

## 8. Notas sobre RTSP en navegadores

- **RTSP nativo en `<video>`**: Chrome/Edge lo soportan parcialmente; Firefox no. Si no anda, convertir a **HLS** (`http://ip:8080/hls/stream.m3u8`) con un proxy como `ffmpeg` o `rtsp-to-web`.
- **Alternativa MJPEG**: `<img>` o `<video>` con `src="http://ip:8080/video"` — funciona en todos los navegadores.
- **Proxy backend**: si la cámara está en red interna y el frontend es público, el backend puede servir como proxy (`GET /api/camara/{id}/stream`). Por ahora se usa la URL directa en el `<video>`.
