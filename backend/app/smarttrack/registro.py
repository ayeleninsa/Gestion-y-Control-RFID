"""Registro de conteos (CSV, capturas y envio opcional a un backend)."""

import csv
import threading
from datetime import datetime

import cv2
import requests

from app.smarttrack import config


def estado_de(cantidad):
    faltan = config.CAJAS_ESPERADAS - cantidad
    if faltan == 0:
        return "COMPLETO"
    if faltan > 0:
        return f"FALTAN {faltan}"
    return f"SOBRAN {-faltan}"


def guardar_captura(imagen, prefijo="captura"):
    config.CARPETA_CAPTURAS.mkdir(parents=True, exist_ok=True)
    marca = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
    ruta = config.CARPETA_CAPTURAS / f"{prefijo}_{marca}.jpg"
    cv2.imwrite(str(ruta), imagen)
    return ruta


def registrar_conteo(cantidad, imagen):
    datos = {
        "camara_id": config.ID_CAMARA,
        "fecha_hora": datetime.now().isoformat(timespec="seconds"),
        "cajas_detectadas": cantidad,
        "cajas_esperadas": config.CAJAS_ESPERADAS,
        "faltantes": max(config.CAJAS_ESPERADAS - cantidad, 0),
        "estado": estado_de(cantidad),
    }
    _escribir_csv(datos)
    if config.GUARDAR_CAPTURA_EN_CONTEO:
        guardar_captura(imagen, "conteo")
    if config.BACKEND_URL:
        threading.Thread(target=_enviar_backend, args=(datos,), daemon=True).start()
    return datos


def _escribir_csv(datos):
    config.ARCHIVO_REGISTRO.parent.mkdir(parents=True, exist_ok=True)
    nuevo = not config.ARCHIVO_REGISTRO.exists()
    try:
        with open(config.ARCHIVO_REGISTRO, "a", newline="", encoding="utf-8") as archivo:
            escritor = csv.DictWriter(archivo, fieldnames=datos.keys())
            if nuevo:
                escritor.writeheader()
            escritor.writerow(datos)
    except PermissionError:
        print(f"[REGISTRO] No se pudo escribir {config.ARCHIVO_REGISTRO.name}: cerralo si esta abierto en Excel.")


def _enviar_backend(datos):
    try:
        respuesta = requests.post(config.BACKEND_URL, json=datos, timeout=5)
        print(f"[REGISTRO] Enviado al backend ({respuesta.status_code}).")
    except requests.RequestException as error:
        print(f"[REGISTRO] No se pudo enviar al backend: {error}")
