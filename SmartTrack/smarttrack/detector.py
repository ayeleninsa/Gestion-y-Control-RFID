"""Deteccion de cajas con el modelo YOLOv8 entrenado (modelos/best.onnx)."""

from dataclasses import dataclass
from pathlib import Path

import cv2
from ultralytics import YOLO

from smarttrack import config


@dataclass
class Deteccion:
    x1: float
    y1: float
    x2: float
    y2: float
    confianza: float
    clase: str
    id: int | None = None  # ID de ByteTrack; None sin tracking o en las pasadas extra

    @property
    def area(self):
        return (self.x2 - self.x1) * (self.y2 - self.y1)


class DetectorCajas:
    """Modelo YOLOv8 con tracking opcional y pasadas extra para las cajas cerca.

    Tracking (rastrear=True): la pasada principal usa model.track(persist=True) con
    ByteTrack, asi cada caja conserva su ID entre cuadros. Es solo para video: con
    imagenes sueltas (las herramientas) queda apagado, porque ByteTrack no devuelve
    una caja nueva hasta verla en dos cuadros. Las cajas de las pasadas extra no
    pasan por el tracker: salen sin ID.

    Cajas cerca: el modelo aprendio cajas chicas (el armario, de lejos) y una caja
    cerca de la camara se ve enorme. Por eso el cuadro se vuelve a analizar con
    menos pixeles de entrada (config.TAMANOS_EXTRA), donde la caja grande queda del
    tamano que el modelo conoce, y de esas pasadas solo se aceptan cajas grandes.
    Medido con el modelo v8s 1024 (cajas que ocupan 5-40% del cuadro):
      sin pasadas extra: 0 de 30 en cada tamano
      con (320, 192, 128, 64): 29-30 de 30 (14 de 15 al 40%); armario sin cambios
    Las pasadas extra usan el .pt (el ONNX tiene la entrada fija) en otro objeto:
    si compartieran objeto con la pasada principal, ByteTrack mezclaria sus cajas.
    """

    def __init__(self, ruta_modelo=config.RUTA_MODELO, confianza=config.CONFIANZA,
                 iou=config.IOU, imgsz=config.IMGSZ, rastrear=False,
                 tamanos_extra=config.TAMANOS_EXTRA, ruta_modelo_extra=config.RUTA_MODELO_PASADAS_EXTRA):
        if not Path(ruta_modelo).is_file():
            raise FileNotFoundError(f"No existe el modelo: {ruta_modelo}")
        self.modelo = YOLO(str(ruta_modelo), task="detect")
        self.clases = self.modelo.names
        self.confianza = confianza
        self.iou = iou
        self.imgsz = tamano_de_entrada(ruta_modelo) or imgsz
        self.rastrear = rastrear

        self.modelo_extra = None
        if tamanos_extra and Path(ruta_modelo_extra).is_file():
            self.modelo_extra = YOLO(str(ruta_modelo_extra), task="detect")
        self.tamanos_extra = tuple(tamanos_extra) if self.modelo_extra else ()
        self.multiescala = bool(self.tamanos_extra)

    def detectar(self, frame, clahe=False):
        """Devuelve la lista de Deteccion encontradas en un frame BGR."""
        if clahe:
            frame = mejorar_iluminacion(frame)

        parametros = dict(conf=self.confianza, iou=self.iou, imgsz=self.imgsz, verbose=False)
        if self.rastrear:
            self._ajustar_umbrales_tracker()
            resultado = self.modelo.track(frame, persist=True, tracker=config.TRACKER, **parametros)[0]
        else:
            resultado = self.modelo.predict(frame, **parametros)[0]
        detecciones = _a_detecciones(resultado, frame, self.clases)
        if not self.multiescala:
            return detecciones

        alto, ancho = frame.shape[:2]
        area_minima = config.AREA_MINIMA_PASADA_EXTRA * ancho * alto
        for tamano in self.tamanos_extra:
            extra = self.modelo_extra.predict(frame, conf=self.confianza, iou=self.iou,
                                              imgsz=tamano, verbose=False)[0]
            detecciones += [d for d in _a_detecciones(extra, frame, self.clases) if d.area >= area_minima]
        return _quitar_repetidas(detecciones, self.iou)

    def _ajustar_umbrales_tracker(self):
        """Iguala los umbrales de ByteTrack a la confianza actual.

        bytetrack.yaml los trae fijos en 0.25: sin esto, bajar la confianza con la
        tecla '-' no hace aparecer ninguna caja nueva en la pasada principal.
        """
        predictor = getattr(self.modelo, "predictor", None)
        for tracker in getattr(predictor, "trackers", None) or ():
            tracker.args.track_high_thresh = self.confianza
            tracker.args.new_track_thresh = self.confianza
            tracker.args.track_low_thresh = min(tracker.args.track_low_thresh, self.confianza / 2)


def tamano_de_entrada(ruta_modelo):
    """(alto, ancho) de un ONNX exportado con entrada fija; None si acepta cualquier tamano.

    Ultralytics recibe imgsz=1024 y arma una entrada cuadrada de 1024x1024 desde el
    segundo cuadro: un ONNX de 1024x576 falla. Por eso se usa el tamano del archivo.
    """
    if Path(ruta_modelo).suffix.lower() != ".onnx":
        return None
    import onnxruntime

    sesion = onnxruntime.InferenceSession(str(ruta_modelo), providers=["CPUExecutionProvider"])
    alto, ancho = sesion.get_inputs()[0].shape[2:]
    return (alto, ancho) if isinstance(alto, int) and isinstance(ancho, int) else None


def _a_detecciones(resultado, frame, clases):
    alto, ancho = frame.shape[:2]
    cajas = resultado.boxes
    ids = cajas.id.int().tolist() if cajas.id is not None else [None] * len(cajas)
    return [
        Deteccion(max(x1, 0), max(y1, 0), min(x2, ancho), min(y2, alto), conf, clases[int(clase)], id_caja)
        for (x1, y1, x2, y2), conf, clase, id_caja in zip(
            cajas.xyxy.tolist(), cajas.conf.tolist(), cajas.cls.tolist(), ids
        )
    ]


def _quitar_repetidas(detecciones, umbral_iou):
    """Una caja puede salir en varias pasadas, entera o solo un pedazo: queda la de mayor confianza."""
    elegidas = []
    for deteccion in sorted(detecciones, key=lambda d: d.confianza, reverse=True):
        if not any(_es_la_misma(deteccion, elegida, umbral_iou) for elegida in elegidas):
            elegidas.append(deteccion)
    return elegidas


def _es_la_misma(a, b, umbral_iou):
    ancho = min(a.x2, b.x2) - max(a.x1, b.x1)
    alto = min(a.y2, b.y2) - max(a.y1, b.y1)
    if ancho <= 0 or alto <= 0:
        return False
    interseccion = ancho * alto
    iou = interseccion / (a.area + b.area - interseccion)
    contenida = interseccion / min(a.area, b.area)
    return iou >= umbral_iou or contenida >= config.CONTENCION_MAXIMA


def mejorar_iluminacion(imagen):
    """Realce de contraste local (CLAHE) para interiores oscuros."""
    lab = cv2.cvtColor(imagen, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8)).apply(l)
    return cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)
