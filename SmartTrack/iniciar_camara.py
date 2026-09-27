"""IPF SmartTrack - remarca en vivo las cajas de notebook que detecta el modelo.

Uso:
    python iniciar_camara.py                      camara IP (datos en .env)
    python iniciar_camara.py --fuente 0           webcam de la PC
    python iniciar_camara.py --fuente video.mp4   video grabado
    python iniciar_camara.py --sin-ventana        solo consola

Teclas: Q salir | C contar ahora | S captura | +/- confianza | E realce de luz
        Z cajas cerca | M detectar solo con movimiento | L ID y confianza por caja
"""

import argparse
import time
from collections import Counter, deque

import cv2

from smarttrack import config
from smarttrack.detector import DetectorCajas
from smarttrack.fuente_video import crear_fuente
from smarttrack.movimiento import MovimientoSoftware, SensorISAPI
from smarttrack.pantalla import dibujar_detecciones, dibujar_panel, redimensionar
from smarttrack.registro import estado_de, guardar_captura, registrar_conteo


def leer_argumentos():
    parser = argparse.ArgumentParser(description="IPF SmartTrack - deteccion de cajas en vivo")
    parser.add_argument("--fuente", help="indice de webcam (0, 1...) o ruta de video; sin esto usa la camara IP")
    parser.add_argument("--sin-ventana", action="store_true", help="no abrir ventana, solo consola")
    return parser.parse_args()


def mas_repetido(valores):
    return Counter(valores).most_common(1)[0][0]


def main():
    args = leer_argumentos()

    print("=" * 60)
    print("  IPF SMARTTRACK - DETECCION DE CAJAS DE NOTEBOOK")
    print("=" * 60)

    try:
        detector = DetectorCajas(rastrear=config.USAR_TRACKING)
    except Exception as error:
        print(f"[ERROR] No se pudo cargar el modelo: {error}")
        return 1
    print(f"[MODELO] {config.RUTA_MODELO.name} ({detector.imgsz} px) | clases: {', '.join(detector.clases.values())} "
          f"| tracking: {config.TRACKER if detector.rastrear else 'no'}")
    if detector.multiescala:
        print(f"[MODELO] Pasadas para cajas cerca: {detector.tamanos_extra} px con "
              f"{config.RUTA_MODELO_PASADAS_EXTRA.name} (tecla Z para apagarlas)")
    elif config.TAMANOS_EXTRA:
        print(f"[AVISO] No esta {config.RUTA_MODELO_PASADAS_EXTRA}: sin pasadas para cajas cerca")

    fuente = crear_fuente(args.fuente)
    print(f"[FUENTE] Conectando a {fuente.nombre}...")
    if not fuente.esperar_primer_frame(segundos=15):
        print("[ERROR] No llega imagen. Revisa IP, usuario y contrasena en .env y la conexion de red.")
        fuente.cerrar()
        return 1
    print("[FUENTE] Video conectado.")
    if not fuente.es_camara:
        print("[INFO] Fuente local: el conteo se muestra en pantalla pero no se guarda en el CSV.")

    sensor = SensorISAPI(config.IP_CAMARA, config.USUARIO, config.CONTRASENA) if fuente.es_camara else None
    software = MovimientoSoftware(config.UMBRAL_MOVIMIENTO_SW)

    mostrar_ventana = not args.sin_ventana
    mostrar_confianza = False
    usar_clahe = config.USAR_CLAHE
    solo_con_movimiento = config.DETECTAR_SOLO_CON_MOVIMIENTO
    conteos = deque(maxlen=config.FRAMES_CONTEO)
    cajas_por_cuadro = deque(maxlen=config.FRAMES_CONTEO)
    conteos_vivo = deque(maxlen=config.VENTANA_CONTEO_VIVO)
    conteo_pendiente = True  # al arrancar se detecta y se registra el primer conteo estable
    ultimo_conteo = None
    ultimo_numero = 0

    detecciones = []
    frame = vista = None
    fps = 0.0
    t_ultima_deteccion = 0.0

    if mostrar_ventana:
        print("[INFO] Teclas: Q salir | C contar | S captura | +/- confianza | E luz | Z cerca "
              "| M solo con movimiento | L etiquetas")

    try:
        while True:
            numero, nuevo_frame = fuente.leer()

            if nuevo_frame is not None and numero != ultimo_numero:
                frame, ultimo_numero = nuevo_frame, numero
                ahora = time.time()

                software.actualizar(frame)
                origen_movimiento = sensor if sensor and sensor.funcionando else software
                hay_movimiento = ahora - origen_movimiento.ultimo_movimiento < config.SEGUNDOS_QUIETO

                # Sin movimiento y con el conteo ya registrado, el modelo no corre:
                # la escena no cambio, asi que las ultimas cajas siguen valiendo.
                detectar_ahora = hay_movimiento or conteo_pendiente or not solo_con_movimiento
                nuevo_conteo = False
                if detectar_ahora:
                    if ahora - t_ultima_deteccion < 2:
                        instantaneo = 1.0 / max(ahora - t_ultima_deteccion, 1e-6)
                        fps = instantaneo if fps == 0 else 0.9 * fps + 0.1 * instantaneo
                    t_ultima_deteccion = ahora

                    detecciones = detector.detectar(frame, clahe=usar_clahe)
                    conteos_vivo.append(len(detecciones))

                    # Conteo registrado: el mas repetido de N frames seguidos sin movimiento
                    if hay_movimiento:
                        conteos.clear()
                        cajas_por_cuadro.clear()
                        conteo_pendiente = True
                    else:
                        conteos.append(len(detecciones))
                        cajas_por_cuadro.append(detecciones)
                        if conteo_pendiente and len(conteos) == conteos.maxlen:
                            ultimo_conteo = mas_repetido(conteos)
                            # Quedan dibujadas las cajas del cuadro que dio ese numero,
                            # asi el panel, la imagen y el CSV coinciden
                            for cantidad, cajas in zip(reversed(conteos), reversed(cajas_por_cuadro)):
                                if cantidad == ultimo_conteo:
                                    detecciones = cajas
                                    break
                            conteos_vivo.clear()
                            conteos_vivo.append(ultimo_conteo)
                            conteo_pendiente = False
                            nuevo_conteo = True

                if hay_movimiento:
                    estado = "MOVIMIENTO"
                elif conteo_pendiente:
                    estado = f"CONTANDO {len(conteos)}/{conteos.maxlen}"
                elif not solo_con_movimiento:
                    estado = "DETECTANDO"
                else:
                    estado = "EN ESPERA"

                # El numero en pantalla no parpadea: es el mas repetido de los ultimos cuadros
                cantidad_pantalla = mas_repetido(conteos_vivo) if conteos_vivo else 0

                vista, escala = redimensionar(frame, config.ANCHO_VENTANA)
                dibujar_detecciones(vista, detecciones, escala, mostrar_confianza)
                dibujar_panel(vista, cantidad_pantalla, ultimo_conteo, estado, origen_movimiento.nombre,
                              detector.confianza, usar_clahe, fps, detector.multiescala, solo_con_movimiento)

                if nuevo_conteo:
                    print(f"[CONTEO] {ultimo_conteo}/{config.CAJAS_ESPERADAS} - {estado_de(ultimo_conteo)}")
                    if fuente.es_camara:
                        registrar_conteo(ultimo_conteo, vista)

                if mostrar_ventana:
                    cv2.imshow(config.NOMBRE_VENTANA, vista)

            elif fuente.terminada:
                print("[FUENTE] Fin del video.")
                break
            else:
                time.sleep(0.005)

            if not mostrar_ventana or vista is None:
                continue

            letra = chr(cv2.waitKey(1) & 0xFF).lower()
            ajuste = False
            if letra in ("q", "\x1b"):
                break
            elif letra == "c":
                print("[CONTEO] Conteo manual solicitado.")
                ajuste = True
            elif letra == "s":
                # La original (sin dibujos) sirve para subirla a Roboflow y etiquetarla
                print(f"[CAPTURA] {guardar_captura(vista, 'captura')}")
                print(f"[CAPTURA] {guardar_captura(frame, 'original')}")
            elif letra in ("+", "="):
                detector.confianza = min(0.95, round(detector.confianza + 0.05, 2))
                print(f"[AJUSTE] Confianza: {detector.confianza:.2f}")
                ajuste = True
            elif letra in ("-", "_"):
                detector.confianza = max(0.05, round(detector.confianza - 0.05, 2))
                print(f"[AJUSTE] Confianza: {detector.confianza:.2f}")
                ajuste = True
            elif letra == "e":
                usar_clahe = not usar_clahe
                print(f"[AJUSTE] Realce de luz: {'ON' if usar_clahe else 'OFF'}")
                ajuste = True
            elif letra == "z":
                detector.multiescala = not detector.multiescala and bool(detector.tamanos_extra)
                print(f"[AJUSTE] Cajas cerca: {'ON' if detector.multiescala else 'OFF'} "
                      f"({'mas lento' if detector.multiescala else 'mas rapido'})")
                ajuste = True
            elif letra == "l":
                mostrar_confianza = not mostrar_confianza

            if ajuste:
                # Un ajuste tiene que verse enseguida, aunque la escena este quieta
                conteos.clear()
                cajas_por_cuadro.clear()
                conteo_pendiente = True

            if cv2.getWindowProperty(config.NOMBRE_VENTANA, cv2.WND_PROP_VISIBLE) < 1:
                break

    except KeyboardInterrupt:
        print("\n[INFO] Interrumpido por el usuario.")
    finally:
        if sensor:
            sensor.detener()
        fuente.cerrar()
        if mostrar_ventana:
            cv2.destroyAllWindows()
        print("[INFO] IPF SmartTrack cerrado.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
