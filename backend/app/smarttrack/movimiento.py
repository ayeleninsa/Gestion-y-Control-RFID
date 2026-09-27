"""Deteccion de movimiento: evento VMD de la camara (ISAPI) o diferencia de frames."""

import threading
import time

import cv2
import requests
from requests.auth import HTTPDigestAuth


class SensorISAPI:
    """Escucha el alertStream de la camara HiLook/Hikvision y marca los eventos VMD."""

    nombre = "Camara (ISAPI)"

    def __init__(self, ip, usuario, contrasena):
        self._url = f"http://{ip}/ISAPI/Event/notification/alertStream"
        self._auth = HTTPDigestAuth(usuario, contrasena)
        self.funcionando = False
        self.ultimo_movimiento = 0.0
        self._activo = True
        self._aviso_error = False
        threading.Thread(target=self._escuchar, daemon=True).start()

    def _escuchar(self):
        while self._activo:
            try:
                with requests.get(self._url, auth=self._auth, stream=True, timeout=(5, 60)) as respuesta:
                    respuesta.raise_for_status()
                    self.funcionando = True
                    self._aviso_error = False
                    print("[MOVIMIENTO] Sensor ISAPI de la camara conectado.")
                    bloque = ""
                    for linea in respuesta.iter_lines():
                        if not self._activo:
                            return
                        if not linea:
                            continue
                        bloque += linea.decode("utf-8", errors="ignore")
                        if "</EventNotificationAlert>" in bloque:
                            if _es_movimiento(bloque):
                                self.ultimo_movimiento = time.time()
                            bloque = ""
                        elif len(bloque) > 20000:
                            bloque = ""
                self.funcionando = False
                time.sleep(1)
            except requests.RequestException as error:
                self.funcionando = False
                if not self._aviso_error:
                    print(f"[MOVIMIENTO] ISAPI no disponible, uso deteccion por software ({error})")
                    self._aviso_error = True
                time.sleep(10)

    def detener(self):
        self._activo = False


def _es_movimiento(bloque):
    texto = bloque.replace(" ", "").lower()
    return "<eventtype>vmd</eventtype>" in texto and "<eventstate>active</eventstate>" in texto


class MovimientoSoftware:
    """Respaldo cuando ISAPI no responde: compara frames consecutivos en baja resolucion."""

    nombre = "Software"

    def __init__(self, umbral):
        self._umbral = umbral
        self._anterior = None
        self.ultimo_movimiento = 0.0

    def actualizar(self, frame):
        gris = cv2.cvtColor(cv2.resize(frame, (320, 180)), cv2.COLOR_BGR2GRAY)
        gris = cv2.GaussianBlur(gris, (5, 5), 0)
        if self._anterior is not None:
            _, mascara = cv2.threshold(cv2.absdiff(self._anterior, gris), 25, 255, cv2.THRESH_BINARY)
            if cv2.countNonZero(mascara) / mascara.size > self._umbral:
                self.ultimo_movimiento = time.time()
        self._anterior = gris
