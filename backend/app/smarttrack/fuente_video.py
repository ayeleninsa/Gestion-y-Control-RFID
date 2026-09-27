"""Fuentes de video: camara IP por RTSP, webcam o archivo de video."""

import threading
import time

import cv2

from app.smarttrack import config


class CamaraRTSP:
    """Lee la camara en un hilo aparte y conserva solo el ultimo frame.

    Asi la deteccion trabaja siempre sobre la imagen actual y no se acumula
    retraso en el buffer RTSP. Si se corta la senal, reconecta sola.
    """

    es_camara = True
    terminada = False

    def __init__(self, url, nombre):
        self.nombre = nombre
        self._url = url
        self._cap = None
        self._frame = None
        self._numero = 0
        self._activa = True
        self._lock = threading.Lock()
        self._hilo = threading.Thread(target=self._leer, daemon=True)
        self._hilo.start()

    def _abrir(self):
        if self._cap is not None:
            self._cap.release()
        self._cap = cv2.VideoCapture(self._url, cv2.CAP_FFMPEG)
        self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    def _leer(self):
        # Solo este hilo toca VideoCapture: liberarlo desde otro mientras read() esta
        # bloqueado puede cerrar el programa de golpe.
        self._abrir()
        try:
            while self._activa:
                ok, frame = self._cap.read()
                if ok:
                    with self._lock:
                        self._frame = frame
                        self._numero += 1
                    continue
                if not self._activa:
                    break
                print("[CAMARA] Sin senal de video. Reintentando en 3 s...")
                time.sleep(3)
                self._abrir()
        finally:
            self._cap.release()

    def leer(self):
        """Devuelve (numero, frame) del ultimo frame recibido, o (0, None) si aun no hay."""
        with self._lock:
            if self._frame is None:
                return 0, None
            return self._numero, self._frame.copy()

    def esperar_primer_frame(self, segundos):
        limite = time.time() + segundos
        while time.time() < limite:
            if self.leer()[1] is not None:
                return True
            time.sleep(0.1)
        return False

    def cerrar(self):
        """Pide al hilo que termine; el hilo libera la camara al salir."""
        self._activa = False
        self._hilo.join(timeout=3)


class FuenteLocal:
    """Webcam (indice 0, 1...) o archivo de video, para probar sin la camara IP."""

    es_camara = False

    def __init__(self, origen):
        self.nombre = f"webcam {origen}" if isinstance(origen, int) else str(origen)
        self._cap = cv2.VideoCapture(origen)
        self._numero = 0
        self._pendiente = None  # frame leido al esperar, se entrega en el primer leer()
        self.terminada = False
        # Un archivo se reproduce a su velocidad real (nunca mas rapido): la logica de
        # movimiento y de espera se mide en segundos
        fps = 0 if isinstance(origen, int) else self._cap.get(cv2.CAP_PROP_FPS)
        self._intervalo = 1 / fps if fps and fps > 0 else 0
        self._proximo = 0.0

    def leer(self):
        if self._intervalo:
            if time.time() < self._proximo:
                return self._numero, None
            self._proximo = time.time() + self._intervalo
        if self._pendiente is not None:
            frame, self._pendiente = self._pendiente, None
        else:
            ok, frame = self._cap.read()
            if not ok:
                self.terminada = True
                return self._numero, None
        self._numero += 1
        return self._numero, frame

    def esperar_primer_frame(self, segundos):
        limite = time.time() + segundos
        while self._cap.isOpened() and time.time() < limite:
            ok, frame = self._cap.read()
            if ok:
                self._pendiente = frame
                return True
            time.sleep(0.1)
        return False

    def cerrar(self):
        self._cap.release()


def crear_fuente(origen=None):
    """Sin origen: camara IP del .env. Un numero: webcam. Otro texto: ruta de video."""
    if origen is None:
        return CamaraRTSP(config.RTSP_URL, f"camara {config.IP_CAMARA} (canal {config.CANAL_RTSP})")
    if origen.isdigit():
        return FuenteLocal(int(origen))
    return FuenteLocal(origen)
