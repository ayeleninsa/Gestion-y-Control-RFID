"""Funciones comunes para las herramientas de dataset."""

from pathlib import Path

EXTENSIONES_IMAGEN = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def listar_imagenes(ruta, maximo=None):
    """Una imagen suelta o todas las imagenes (recursivo) de una carpeta."""
    ruta = Path(ruta)
    if ruta.is_file():
        return [ruta]
    if not ruta.is_dir():
        return []
    imagenes = sorted(p for p in ruta.rglob("*") if p.is_file() and p.suffix.lower() in EXTENSIONES_IMAGEN)
    return imagenes[:maximo] if maximo else imagenes


def linea_yolo(x1, y1, x2, y2, ancho, alto, clase=0):
    """Caja en pixeles (xyxy) -> linea YOLO normalizada, o None si es demasiado chica."""
    x1, x2 = sorted((min(max(x1, 0), ancho), min(max(x2, 0), ancho)))
    y1, y2 = sorted((min(max(y1, 0), alto), min(max(y2, 0), alto)))
    w, h = x2 - x1, y2 - y1
    if w <= 1 or h <= 1:
        return None
    return f"{clase} {(x1 + w / 2) / ancho:.6f} {(y1 + h / 2) / alto:.6f} {w / ancho:.6f} {h / alto:.6f}"
