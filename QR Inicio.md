# QR Inicio — Túnel fijo + QR impreso al login

Objetivo: URL **estática** (que nunca cambia) tunelizando el frontend local, asociada a un QR impreso que al escanearlo con el celular abre la página de login.

- URL fija: `https://<tu-dominio>.ngrok-free.app` (se define una sola vez)
- Destino del QR impreso: `https://<tu-dominio>.ngrok-free.app/login`
- Puerto tunelizado: **5173** (el frontend ya proxea `/api` al backend en `:8000`, así que con un solo túnel funciona todo, incluida la cámara por HTTPS).

---

## 1. Requisitos (una sola vez)

1. Crear cuenta gratuita en [ngrok.com](https://ngrok.com).
2. Copiar el **authtoken** del dashboard.
3. En el dashboard → **Domains** → reservar el dominio estático (ej. `ipf-alumnos`) y anotar el nombre completo: `https://<tu-dominio>.ngrok-free.app`.

## 2. Instalación de ngrok (una sola vez)

```powershell
winget install ngrok
ngrok config add-authtoken <tu-authtoken>
```

## 3. Lanzador del túnel fijo

Archivo `iniciar_tunel_fijo.bat` (en la raíz del repo):

```bat
@echo off
ngrok http 5173 --domain=<tu-dominio>.ngrok-free.app
```

Para lanzar: doble clic en `iniciar_tunel_fijo.bat`. Dejar la ventana abierta mientras se use.

## 4. Generar el QR impreso (una sola vez)

Requiere la URL fija ya definida. Con el venv del backend:

```powershell
cd backend
.\.venv\Scripts\python -m pip install segno
.\.venv\Scripts\python ..\scripts\generar_qr_acceso.py https://<tu-dominio>.ngrok-free.app/login
```

Genera `qr/acceso_login.png` (corrección de errores alta, apto para impresión). Imprimirlo y pegarlo en un lugar visible. No confundirlo con los QR físicos de las computadoras (`qr/<alumno>_<dni>.png`).

## 5. Si se cierra la sesión / se cae el túnel

1. Doble clic en `iniciar_tunel_fijo.bat`.
2. La URL vuelve a ser **la misma** → el QR impreso sigue válido, no hay que reimprimir nada.

## 6. Verificación

- [ ] `cd frontend && npm run build` compila sin errores.
- [ ] El túnel responde: abrir `https://<tu-dominio>.ngrok-free.app/login` en el celular.
- [ ] Escanear `qr/acceso_login.png` con la cámara → abre el login por HTTPS.
- [ ] Login de alumno OK y cámara del escáner funcionando.

## Notas

- ngrok gratuito muestra una página intermedia de aviso ("Visit Site") la primera vez que se abre en cada celular: es un clic extra, no bloquea nada.
- El dominio estático es 1 por cuenta gratuita: no borrarlo del dashboard o la URL cambiará.
- `vite.config.js` ya tiene `host: true` y `allowedHosts: true`, compatible con el host de ngrok sin cambios.
