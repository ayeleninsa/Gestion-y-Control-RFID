"""Dibujo en pantalla: cajas remarcadas y panel de estado."""

import cv2

from smarttrack import config
from smarttrack.registro import estado_de

FUENTE = cv2.FONT_HERSHEY_SIMPLEX
BLANCO = (255, 255, 255)
GRIS = (190, 190, 190)
VERDE = (80, 220, 80)
AMARILLO = (0, 215, 255)
ROJO = (70, 70, 255)
ANCHO_PANEL = 780


def redimensionar(frame, ancho):
    """Devuelve (copia redimensionada, escala) manteniendo la relacion de aspecto."""
    escala = ancho / frame.shape[1]
    if abs(escala - 1) < 1e-3:
        return frame.copy(), 1.0
    return cv2.resize(frame, (ancho, round(frame.shape[0] * escala))), escala


def color_para(confianza):
    return VERDE if confianza >= 0.6 else AMARILLO


def dibujar_detecciones(imagen, detecciones, escala=1.0, mostrar_confianza=False):
    """Remarca cada caja con relleno translucido y borde (verde = segura, amarillo = dudosa)."""
    if not detecciones:
        return
    cajas = [
        (tuple(round(v * escala) for v in (d.x1, d.y1, d.x2, d.y2)), d.confianza, d.id)
        for d in detecciones
    ]
    relleno = imagen.copy()
    for (x1, y1, x2, y2), conf, _ in cajas:
        cv2.rectangle(relleno, (x1, y1), (x2, y2), color_para(conf), -1)
    cv2.addWeighted(relleno, 0.3, imagen, 0.7, 0, dst=imagen)

    for (x1, y1, x2, y2), conf, id_caja in cajas:
        cv2.rectangle(imagen, (x1, y1), (x2, y2), color_para(conf), 2)
        if mostrar_confianza:
            # A la derecha de la caja para no tapar las cajas apiladas
            texto = f"#{id_caja} {conf:.2f}" if id_caja is not None else f"{conf:.2f}"
            cv2.putText(imagen, texto, (x2 + 4, y2 - 3), FUENTE, 0.4, color_para(conf), 1, cv2.LINE_AA)


def dibujar_panel(imagen, cantidad, ultimo_conteo, estado, sensor, confianza, clahe, fps,
                  multiescala, solo_con_movimiento):
    """estado: 'MOVIMIENTO', 'CONTANDO x/y', 'DETECTANDO' o 'EN ESPERA'."""
    _oscurecer(imagen, 0, 0, min(ANCHO_PANEL, imagen.shape[1]), 160)

    cv2.putText(imagen, "IPF SMARTTRACK", (15, 30), FUENTE, 0.75, BLANCO, 2, cv2.LINE_AA)
    if estado == "EN ESPERA":
        color_estado, estado = GRIS, "EN ESPERA (sin movimiento)"
    elif estado == "MOVIMIENTO":
        color_estado = AMARILLO
    else:
        color_estado = VERDE
    cv2.putText(imagen, estado, (260, 30), FUENTE, 0.65, color_estado, 2, cv2.LINE_AA)

    if cantidad == config.CAJAS_ESPERADAS:
        color_cantidad = VERDE
    elif cantidad == 0:
        color_cantidad = ROJO
    else:
        color_cantidad = BLANCO
    cv2.putText(imagen, f"Cajas en pantalla: {cantidad}/{config.CAJAS_ESPERADAS}",
                (15, 70), FUENTE, 0.9, color_cantidad, 2, cv2.LINE_AA)

    if ultimo_conteo is None:
        texto_conteo = "Ultimo conteo: esperando imagen quieta..."
    else:
        texto_conteo = f"Ultimo conteo: {ultimo_conteo}/{config.CAJAS_ESPERADAS} - {estado_de(ultimo_conteo)}"
    cv2.putText(imagen, texto_conteo, (15, 102), FUENTE, 0.65, BLANCO, 2, cv2.LINE_AA)

    cv2.putText(imagen, f"Conf {confianza:.2f} | Luz {'ON' if clahe else 'OFF'} | "
                        f"Cerca {'ON' if multiescala else 'OFF'} | "
                        f"Solo con mov. {'ON' if solo_con_movimiento else 'OFF'} | "
                        f"{fps:4.1f} FPS | Mov: {sensor}",
                (15, 128), FUENTE, 0.45, GRIS, 1, cv2.LINE_AA)
    cv2.putText(imagen, "Q salir  C contar  S captura  +/- confianza  E luz  Z cerca  "
                        "M solo con movimiento  L etiquetas",
                (15, 150), FUENTE, 0.45, GRIS, 1, cv2.LINE_AA)

    if cantidad == 0:
        alto = imagen.shape[0]
        _oscurecer(imagen, 0, alto - 44, min(760, imagen.shape[1]), alto)
        cv2.putText(imagen, "Sin cajas detectadas: apunta la camara al armario",
                    (15, alto - 15), FUENTE, 0.7, ROJO, 2, cv2.LINE_AA)


def _oscurecer(imagen, x1, y1, x2, y2):
    region = imagen[y1:y2, x1:x2]
    region[:] = (region * 0.3).astype(region.dtype)
