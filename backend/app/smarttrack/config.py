"""Configuracion central de IPF SmartTrack.

Los datos sensibles (contrasena de la camara, API key de Roboflow) se leen
del archivo .env en la raiz del proyecto. El resto se ajusta aca.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

RAIZ = Path(__file__).resolve().parent.parent.parent  # backend/
load_dotenv(RAIZ / ".env")

# ------------------------------------------------------------
# Camara IP (HiLook / Hikvision)
# ------------------------------------------------------------
IP_CAMARA = os.getenv("CAMARA_IP", "192.168.2.105")
USUARIO = os.getenv("CAMARA_USUARIO", "admin")
CONTRASENA = os.getenv("CAMARA_CONTRASENA", "Camara321")
CANAL_RTSP = os.getenv("CAMARA_CANAL", "101")  # 101 = principal, 102 = secundario
ID_CAMARA = os.getenv("CAMARA_ID", "HILOOK_BLOQUE4")
RTSP_URL = f"rtsp://{USUARIO}:{CONTRASENA}@{IP_CAMARA}:554/Streaming/Channels/{CANAL_RTSP}"

# ------------------------------------------------------------
# Modelo: YOLOv8s entrenado a 1024 px (Roboflow smarttrack-caja.v2-3)
# ------------------------------------------------------------
# best.onnx es el mismo modelo que best.pt exportado con entrada fija 1024x576:
# en esta PC tarda ~190 ms por cuadro, contra ~330 ms del ONNX cuadrado de
# 1024x1024 (guardado como best_1024x1024.onnx) y ~280 ms del .pt.
RUTA_MODELO = RAIZ / "modelos" / "best.onnx"
IMGSZ = 1024  # igual que en el entrenamiento: con menos, las cajas lejanas se pierden
CONFIANZA = 0.25  # teclas +/- para ajustar en vivo
IOU = 0.60

# Tracking con ByteTrack: cada caja conserva un ID entre cuadros. El numero en
# pantalla es la cantidad de cajas del cuadro (las rastreadas mas las de las
# pasadas extra), tomando la mas repetida de los ultimos VENTANA_CONTEO_VIVO
# cuadros. Medido con la escena quieta: el numero cambiaba 46 veces cuadro a
# cuadro y 7 veces asi.
# Ojo: ByteTrack solo muestra una caja cuando la vio en dos cuadros seguidos, asi
# que las cajas que titilan no aparecen aunque se baje la confianza con '-'.
# Para ver todo cuadro a cuadro, sin filtrar: USAR_TRACKING = False.
USAR_TRACKING = True
TRACKER = "bytetrack.yaml"
VENTANA_CONTEO_VIVO = 9

# Realce de contraste (CLAHE). Con buena luz no mejora (menos cajas falsas pero
# pierde algunas) y suma ~40 ms, por eso arranca apagado. Tecla E para prenderlo.
USAR_CLAHE = False

# Pasadas extra para cajas cerca: una caja cerca de la camara se ve enorme y el
# modelo solo aprendio cajas chicas. Analizando el cuadro con menos pixeles de
# entrada, la caja grande queda del tamano que conoce. Con el modelo v8s cubre
# cajas de ~5% a ~40% del cuadro (sin esto no detecta ninguna).
# Necesitan un modelo que acepte cualquier tamano de entrada: el .pt.
# TAMANOS_EXTRA = () desactiva el truco (~190 ms por cuadro en vez de ~300).
RUTA_MODELO_PASADAS_EXTRA = RAIZ / "modelos" / "best.pt"
TAMANOS_EXTRA = (320, 192, 128, 64)
# De esas pasadas solo se aceptan cajas que ocupen al menos esta parte del cuadro
AREA_MINIMA_PASADA_EXTRA = 0.015
# Una caja que queda al menos 70% dentro de otra es la misma vista en otra pasada
CONTENCION_MAXIMA = 0.7

# ------------------------------------------------------------
# Conteo
# ------------------------------------------------------------
CAJAS_ESPERADAS = 22
FRAMES_CONTEO = 15  # frames seguidos sin movimiento para dar un conteo estable
SEGUNDOS_QUIETO = 5
UMBRAL_MOVIMIENTO_SW = 0.02  # % de pixeles que cambian para considerar movimiento
# Sin movimiento el video se sigue viendo pero el modelo no corre (quedan las
# ultimas cajas marcadas). Cuando el movimiento termina detecta FRAMES_CONTEO
# cuadros, toma el conteo mas repetido y vuelve a esperar. Tecla M para cambiarlo.
# El conteo se guarda en el CSV solo con la camara IP; con webcam o video solo se muestra.
DETECTAR_SOLO_CON_MOVIMIENTO = True

# ------------------------------------------------------------
# Pantalla
# ------------------------------------------------------------
ANCHO_VENTANA = 1280
NOMBRE_VENTANA = "IPF SmartTrack - Camara"

# ------------------------------------------------------------
# Carpetas y registro
# ------------------------------------------------------------
CARPETA_DATOS = RAIZ / "datos"
CARPETA_FOTOS_NUEVAS = CARPETA_DATOS / "fotos_nuevas"
CARPETA_SALIDAS = RAIZ / "salidas"
CARPETA_CAPTURAS = CARPETA_SALIDAS / "capturas"
ARCHIVO_REGISTRO = CARPETA_SALIDAS / "registro_conteo.csv"
GUARDAR_CAPTURA_EN_CONTEO = False
BACKEND_URL = os.getenv("BACKEND_URL", "")

# ------------------------------------------------------------
# Roboflow
# ------------------------------------------------------------
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "")
ROBOFLOW_WORKSPACE = "milagros-esquivel"
ROBOFLOW_PROYECTO = "smarttrack-caja-v2"
# Ojo: la "version 1" del proyecto solo tiene 200 de las 2200 fotos.
# Por eso se descarga por grupo de anotaciones (trae todas, incluidas las nuevas).
ROBOFLOW_GRUPO_ANOTACIONES = "smarttrack-caja-v2"
# Medidas reales de la caja (cm): largo, alto, espesor
CAJA_MEDIDAS_CM = (21.0, 13.0, 2.74)
