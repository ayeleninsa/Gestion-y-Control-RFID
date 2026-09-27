# IPF SmartTrack - usar el detector desde el dashboard

Guia para integrar la deteccion y el conteo de cajas en un dashboard hecho en Python.

El modelo detecta **cajas de computadora** (21 x 13 x 2,74 cm) del armario del bloque 4,
con una camara IP HiLook por RTSP. Una sola clase: `caja_notebook`.

---

## Paso 1. Copiar dos carpetas al proyecto

```
proyecto_del_dashboard/
├── smarttrack/          <- la carpeta completa, tal cual
├── modelos/
│   ├── best.onnx        <- pasada principal (YOLOv8s, entrada 1024x576)
│   └── best.pt          <- mismos pesos: pasadas extra para cajas cerca
└── dashboard.py         <- tu codigo
```

Los otros modelos (`best_1024x1024.onnx`, `best_v1.pt`) no hacen falta: uno es el mismo
modelo pero mas lento y el otro es una version vieja.

**La ubicacion importa:** `smarttrack` busca la carpeta `modelos/` un nivel mas arriba de
si misma. Si los modelos van a otro lado, no los encuentra.

## Paso 2. Instalar

```bash
pip install ultralytics opencv-python python-dotenv onnxruntime lap
```

## Paso 3. Probar que carga, antes de tocar el dashboard

```python
import cv2
from smarttrack.detector import DetectorCajas

detector = DetectorCajas(rastrear=True)
print(detector.imgsz, detector.clases)        # (576, 1024) {0: 'caja_notebook'}
print(len(detector.detectar(cv2.imread("una_foto_del_armario.jpg"))), "cajas")
```

La primera vez tarda unos segundos en cargar los dos modelos. Si esto anda, el resto anda.

## Paso 4. Datos de la camara

Solo si el dashboard va a leer el RTSP. Un archivo `.env` al lado de `smarttrack/`:

```
CAMARA_IP=192.168.2.105
CAMARA_USUARIO=admin
CAMARA_CONTRASENA=(pedirsela a Milagros)
CAMARA_CANAL=101
```

La PC tiene que estar en la misma red que la camara. Para probar sin camara, en el paso 5
se cambia `crear_fuente()` por `crear_fuente("0")` (webcam) o por la ruta de un video.

## Paso 5. El bucle, en un hilo aparte y solo con movimiento

**El modelo corre unicamente cuando hay movimiento.** Sin movimiento el video se sigue
viendo, pero no se procesa nada: la escena no cambio, asi que el ultimo conteo y las
ultimas cajas siguen valiendo. Eso baja muchisimo el uso de CPU (en una prueba, el modelo
corrio en 76 de 310 cuadros) y es como funciona el programa de la camara.

```python
import threading, time
from collections import Counter, deque
from smarttrack import config
from smarttrack.detector import DetectorCajas
from smarttrack.fuente_video import crear_fuente
from smarttrack.movimiento import MovimientoSoftware

estado = {"conteo": 0, "detecciones": [], "frame": None, "procesando": False}

def bucle():
    detector = DetectorCajas(rastrear=True)
    movimiento = MovimientoSoftware(config.UMBRAL_MOVIMIENTO_SW)
    fuente = crear_fuente()          # camara IP del .env; "0" = webcam; o la ruta de un video
    if not fuente.esperar_primer_frame(15):
        print("No llega imagen de la camara")
        return

    ultimos, ultimo_numero = deque(maxlen=9), 0
    pendientes = config.FRAMES_CONTEO   # cuadros que se siguen procesando al terminar el movimiento
    while True:
        numero, frame = fuente.leer()
        if frame is None or numero == ultimo_numero:
            if fuente.terminada:
                break
            time.sleep(0.005)
            continue
        ultimo_numero = numero
        estado["frame"] = frame          # el video se muestra siempre, aunque no se procese

        # Deteccion de movimiento: compara cuadros en baja resolucion, cuesta ~1 ms
        movimiento.actualizar(frame)
        hay_movimiento = time.time() - movimiento.ultimo_movimiento < config.SEGUNDOS_QUIETO
        if hay_movimiento:
            pendientes = config.FRAMES_CONTEO
        elif pendientes > 0:
            pendientes -= 1              # unos cuadros mas para que el conteo se asiente
        else:
            estado["procesando"] = False
            continue                     # escena quieta: el modelo no corre

        estado["procesando"] = True
        detecciones = detector.detectar(frame)
        ultimos.append(len(detecciones))
        estado.update(conteo=Counter(ultimos).most_common(1)[0][0], detecciones=detecciones)
    fuente.cerrar()

threading.Thread(target=bucle, daemon=True).start()
```

**Por que en un hilo:** cada deteccion tarda ~300 ms en CPU. Si el dashboard llama al modelo
dentro de cada request web, se cuelga. Asi responde al instante con el ultimo valor.

**Por que la moda de los ultimos 9:** el conteo crudo parpadea (22, 21, 22...). Medido con la
escena quieta, el numero cambiaba 46 veces cuadro a cuadro y 7 veces con este suavizado.

**Si la camara tiene su propio sensor de movimiento** (Hikvision / HiLook con ISAPI), se puede
usar en vez del de software, que es mas preciso porque lo calcula la camara:

```python
from smarttrack.movimiento import SensorISAPI
sensor = SensorISAPI(config.IP_CAMARA, config.USUARIO, config.CONTRASENA)
# y donde dice movimiento.ultimo_movimiento, usar: sensor.ultimo_movimiento si sensor.funcionando
```

## Paso 6. Mostrarlo

El numero, desde cualquier vista o endpoint:

```python
estado["conteo"]              # ej. 20
len(estado["detecciones"])    # cajas del ultimo cuadro procesado
estado["procesando"]          # True = hay movimiento; False = en espera
```

La imagen con las cajas marcadas:

```python
import cv2
from smarttrack.pantalla import dibujar_detecciones, redimensionar

vista, escala = redimensionar(estado["frame"], 1280)
dibujar_detecciones(vista, estado["detecciones"], escala)
jpg = cv2.imencode(".jpg", vista)[1].tobytes()   # para servirlo por HTTP
```

Cada deteccion tiene `x1, y1, x2, y2, confianza, clase, id` (el `id` es el de ByteTrack),
por si conviene dibujarlas de otra forma.

## Paso 7. Ajustes, en `smarttrack/config.py`

| Ajuste | Valor | Para que |
|---|---|---|
| `CAJAS_ESPERADAS` | 22 | el total que deberia haber en el armario |
| `CONFIANZA` / `IOU` | 0.25 / 0.60 | ya ajustados midiendo; no conviene tocarlos a ojo |
| `TAMANOS_EXTRA` | (320, 192, 128, 64) | pasadas extra para cajas cerca. Vacio `()` = ~190 ms por cuadro en vez de ~300 |
| `USAR_TRACKING` | True | ByteTrack: mantiene el ID de cada caja y estabiliza el conteo |
| `SEGUNDOS_QUIETO` | 5 | cuanto espera sin movimiento antes de dejar de procesar |
| `UMBRAL_MOVIMIENTO_SW` | 0.02 | que porcentaje de la imagen tiene que cambiar para contar como movimiento |

## Lo que conviene saber

- **No conviene que dos PC corran el modelo sobre la misma camara al mismo tiempo:** son dos
  procesos peleando por el mismo RTSP y por la CPU. Si el dashboard solo necesita **mostrar el
  conteo**, es mejor que el programa de Milagros se lo mande por HTTP: se configura
  `BACKEND_URL` en su `.env` y le llega un POST con este JSON en cada conteo:

  ```json
  {"camara_id": "HILOOK_BLOQUE4", "fecha_hora": "2026-09-23T14:30:00",
   "cajas_detectadas": 20, "cajas_esperadas": 22, "faltantes": 2, "estado": "FALTAN 2"}
  ```

- **Cajas cerca:** el modelo aprendio cajas chicas (el armario, de lejos). Una caja cerca de la
  camara se ve enorme y una sola pasada no la detecta. Por eso `DetectorCajas` analiza el cuadro
  tambien con menos resolucion. Si se usa Ultralytics directo (`YOLO("best.pt")`), eso se pierde.

- **Rendimiento medido** (CPU, Ryzen 7 5700U): ~300 ms por cuadro con las pasadas extra,
  ~190 ms sin ellas. Con GPU es bastante mas rapido. Procesando solo con movimiento, la mayor
  parte del tiempo no gasta nada.

- **Precision medida** en videos del armario que el modelo no vio al entrenar: precision 0.93,
  recall 0.98. En cajas grandes (cerca): 0.81 / 0.96. Sin probar: la caja de frente mostrando la
  cara grande de 21 x 13 cm, porque no hay fotos etiquetadas asi.

- **Tracking:** ByteTrack muestra una caja recien cuando la vio en dos cuadros seguidos, asi que
  las detecciones que titilan no aparecen. Para ver todo cuadro a cuadro: `USAR_TRACKING = False`.
