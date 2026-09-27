"""IPF SmartTrack: deteccion y conteo de cajas de notebook con YOLOv8."""

import os

# RTSP por TCP (evita imagen rota y cortes). OpenCV lo lee al abrir la camara.
os.environ.setdefault("OPENCV_FFMPEG_CAPTURE_OPTIONS", "rtsp_transport;tcp")
