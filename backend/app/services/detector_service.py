"""Servicio de detección y conteo en tiempo real de cajas SmartTrack.

Ejecuta el bucle de captura y análisis de la cámara HiLook en un hilo separado
siguiendo las recomendaciones de PARA_EL_DASHBOARD.md:
- Solo procesa cuando detecta movimiento (ahorro masivo de CPU).
- Mantiene el último conteo suavizado (moda de los últimos frames) y las cajas marcadas.
- Provee frames anotados (bounding boxes) listos para streaming MJPEG.
"""

from collections import Counter, deque
import logging
import threading
import time
from typing import Any

import cv2

from app.smarttrack import config
from app.smarttrack.detector import DetectorCajas
from app.smarttrack.fuente_video import crear_fuente
from app.smarttrack.movimiento import MovimientoSoftware, SensorISAPI
from app.smarttrack.pantalla import dibujar_detecciones, redimensionar

logger = logging.getLogger("smarttrack.service")


class DetectorService:
    def __init__(self):
        self._lock = threading.Lock()
        self._thread: threading.Thread | None = None
        self._running = False

        self.conteo = config.CAJAS_ESPERADAS
        self.cajas_esperadas = config.CAJAS_ESPERADAS
        self.estado_str = "COMPLETO"
        self.detecciones: list[Any] = []
        self.procesando = False
        self.hay_movimiento = False
        self.fps = 0.0
        self.ultimo_frame_bytes: bytes | None = None
        self.ultimo_frame_anotado_bytes: bytes | None = None
        self.camara_conectada = False

    def iniciar(self):
        with self._lock:
            if self._running:
                return
            self._running = True
            self._thread = threading.Thread(target=self._bucle_deteccion, daemon=True)
            self._thread.start()
            logger.info("DetectorService iniciado en segundo plano")

    def detener(self):
        with self._lock:
            self._running = False

    def get_info(self) -> dict:
        with self._lock:
            return {
                "conteo": self.conteo,
                "cajas_esperadas": self.cajas_esperadas,
                "faltantes": max(self.cajas_esperadas - self.conteo, 0),
                "estado": self.estado_str,
                "procesando": self.procesando,
                "hay_movimiento": self.hay_movimiento,
                "camara_conectada": self.camara_conectada,
                "total_cajas_detectadas": len(self.detecciones),
                "fps": round(self.fps, 1),
            }

    def get_frame_anotado(self) -> bytes | None:
        with self._lock:
            return self.ultimo_frame_anotado_bytes

    def _bucle_deteccion(self):
        logger.info("Iniciando detector de cajas YOLOv8...")
        try:
            detector = DetectorCajas(rastrear=config.USAR_TRACKING)
        except Exception as e:
            logger.error("No se pudo cargar el modelo de detección: %s", e)
            self.camara_conectada = False
            return

        sensor = SensorISAPI(config.IP_CAMARA, config.USUARIO, config.CONTRASENA)
        software = MovimientoSoftware(config.UMBRAL_MOVIMIENTO_SW)

        fuente = None
        ultimos_conteos = deque(maxlen=config.VENTANA_CONTEO_VIVO)
        ultimo_numero = 0
        pendientes = config.FRAMES_CONTEO
        t_prev = time.time()

        while self._running:
            if fuente is None:
                try:
                    logger.info("Conectando a fuente de video RTSP: %s", config.RTSP_URL)
                    fuente = crear_fuente()
                    if not fuente.esperar_primer_frame(segundos=10):
                        logger.warning("No llega frame de la cámara. Reintentando en 5s...")
                        fuente.cerrar()
                        fuente = None
                        with self._lock:
                            self.camara_conectada = False
                        time.sleep(5)
                        continue
                    with self._lock:
                        self.camara_conectada = True
                    logger.info("Cámara conectada exitosamente.")
                except Exception as ex:
                    logger.error("Error al conectar fuente de video: %s", ex)
                    fuente = None
                    time.sleep(5)
                    continue

            numero, frame = fuente.leer()
            if frame is None or numero == ultimo_numero:
                if getattr(fuente, "terminada", False):
                    fuente.cerrar()
                    fuente = None
                    with self._lock:
                        self.camara_conectada = False
                    time.sleep(2)
                    continue
                time.sleep(0.01)
                continue

            ultimo_numero = numero
            ahora = time.time()
            dt = ahora - t_prev
            if dt > 0:
                self.fps = 1.0 / dt
            t_prev = ahora

            # Detección de movimiento
            software.actualizar(frame)
            origen = sensor if sensor and sensor.funcionando else software
            hay_mov = (ahora - origen.ultimo_movimiento) < config.SEGUNDOS_QUIETO

            if hay_mov:
                pendientes = config.FRAMES_CONTEO
            elif pendientes > 0:
                pendientes -= 1
            else:
                with self._lock:
                    self.procesando = False
                    self.hay_movimiento = False
                    # Generar frame visual con las últimas cajas
                    self._generar_frame_anotado(frame, self.detecciones)
                time.sleep(0.03)
                continue

            # Hay movimiento o frames pendientes
            with self._lock:
                self.procesando = True
                self.hay_movimiento = hay_mov

            try:
                detecciones = detector.detectar(frame, clahe=config.USAR_CLAHE)
                ultimos_conteos.append(len(detecciones))
                conteo_estable = Counter(ultimos_conteos).most_common(1)[0][0]

                faltan = config.CAJAS_ESPERADAS - conteo_estable
                if faltan == 0:
                    estado_str = "COMPLETO"
                elif faltan > 0:
                    estado_str = f"FALTAN {faltan}"
                else:
                    estado_str = f"SOBRAN {-faltan}"

                with self._lock:
                    self.detecciones = detecciones
                    self.conteo = conteo_estable
                    self.estado_str = estado_str
                    self._generar_frame_anotado(frame, detecciones)
            except Exception as e:
                logger.error("Error en detección de cajas: %s", e)

        if fuente:
            fuente.cerrar()
        if sensor:
            sensor.detener()

    def _generar_frame_anotado(self, frame, detecciones):
        vista, escala = redimensionar(frame, 1024)
        dibujar_detecciones(vista, detecciones, escala=escala, mostrar_confianza=True)
        ret, buffer = cv2.imencode(".jpg", vista, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        if ret:
            self.ultimo_frame_anotado_bytes = buffer.tobytes()


# Instancia singleton del servicio
detector_service = DetectorService()
