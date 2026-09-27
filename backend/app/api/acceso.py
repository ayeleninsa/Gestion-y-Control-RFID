import asyncio
import re

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.camara import Camara
from app.models.evento_acceso import EventoAcceso
from app.models.user import User
from app.schemas.acceso import (
    CamaraCreate,
    CamaraRead,
    CamaraUpdate,
    EventoAccesoCreate,
    EventoAccesoRead,
)
from app.services.detector_service import detector_service
from app.services.evaluacion_acceso import evaluar_acceso

router = APIRouter(prefix="/api/acceso", tags=["Control de Acceso"])


async def _get_user_from_token_query(token: str, db: AsyncSession) -> User:
    """Valida un token JWT pasado por query string (para endpoints usados en <img src>)."""
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.activo:
        raise HTTPException(status_code=401, detail="Usuario no encontrado o inactivo")
    return user


def _parse_rtsp_url(rtsp_url: str, ip: str) -> tuple[str, str, str]:
    """
    Parsea la URL RTSP y devuelve (snapshot_url, usuario, password).
    La URL de snapshot no incluye credenciales (se pasan via DigestAuth).
    Hilook/Hikvision usan autenticación Digest.

    Ejemplo:
      rtsp://admin:Camara321@192.168.2.105:554/Streaming/Channels/101
      -> ("http://192.168.2.105/ISAPI/Streaming/channels/1/picture", "admin", "Camara321")
    """
    match = re.match(
        r"rtsp://([^:]+):([^@]+)@([^:/]+)(?::\d+)?/Streaming/Channels/(\d+)",
        rtsp_url,
        re.IGNORECASE,
    )
    if match:
        user, password, host, channel_str = match.groups()
        channel = int(channel_str) // 100 if int(channel_str) >= 100 else int(channel_str)
        return f"http://{host}/ISAPI/Streaming/channels/{channel}/picture", user, password

    # Fallback genérico sin auth
    return f"http://{ip}/video.mjpg", "", ""


@router.get("/camaras", response_model=list[CamaraRead])
async def listar_camaras(
    activa: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(Camara)
    if activa is not None:
        query = query.where(Camara.activa == activa)
    query = query.order_by(Camara.id_camara)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/camaras", response_model=CamaraRead, status_code=201)
async def crear_camara(
    data: CamaraCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    camara = Camara(**data.model_dump())
    db.add(camara)
    await db.commit()
    await db.refresh(camara)
    return camara


@router.put("/camaras/{id_camara}", response_model=CamaraRead)
async def actualizar_camara(
    id_camara: int,
    data: CamaraUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    camara = await db.get(Camara, id_camara)
    if not camara:
        raise HTTPException(status_code=404, detail="Camara no encontrada")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(camara, key, value)
    await db.commit()
    await db.refresh(camara)
    return camara


@router.get("/camaras/{id_camara}/snapshot")
async def snapshot_camara(
    id_camara: int,
    token: str = Query(..., description="JWT de acceso (requerido para uso en <img src>)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Proxy: obtiene un frame JPEG de la cámara y lo devuelve al browser.
    Usa Digest Auth (requerido por Hilook/Hikvision).
    Acepta token por query param para usarse en <img src="...?token=...">.
    """
    await _get_user_from_token_query(token, db)

    camara = await db.get(Camara, id_camara)
    if not camara or not camara.activa:
        raise HTTPException(status_code=404, detail="Cámara no encontrada o inactiva")
    if not camara.stream_url:
        raise HTTPException(status_code=404, detail="Esta cámara no tiene stream_url configurado")

    snapshot_url, user, password = _parse_rtsp_url(camara.stream_url, camara.ip)
    auth = httpx.DigestAuth(user, password) if user else None

    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True, auth=auth) as client:
            resp = await client.get(snapshot_url)
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=(
                        f"La cámara respondió con estado {resp.status_code}. "
                        "Verificá credenciales."
                    ),
                )
            content_type = resp.headers.get("content-type", "image/jpeg").split(";")[0].strip()
            return Response(
                content=resp.content,
                media_type=content_type,
                headers={"Cache-Control": "no-store"},
            )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail=f"No se pudo conectar a la cámara en {camara.ip}.",
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="La cámara no respondió a tiempo.")


@router.get("/camaras/conteo-ia")
async def obtener_conteo_ia(
    token: str | None = Query(None),
    current_user=Depends(get_current_user),
):
    """Devuelve el estado de conteo en vivo de cajas detectadas por la IA en el armario."""
    return detector_service.get_info()


@router.get("/camaras/{id_camara}/mjpeg")
async def mjpeg_stream_camara(
    id_camara: int,
    token: str = Query(..., description="JWT de acceso"),
    db: AsyncSession = Depends(get_db),
):
    """
    Proxy MJPEG: streaming continuo de frames JPEG desde la cámara.
    Si el detector de IA tiene frames con cajas anotadas, los envía preferentemente.
    Si no, obtiene el snapshot directo de la cámara usando Digest Auth.
    """
    await _get_user_from_token_query(token, db)

    camara = await db.get(Camara, id_camara)
    if not camara or not camara.activa:
        raise HTTPException(status_code=404, detail="Cámara no encontrada o inactiva")
    if not camara.stream_url:
        raise HTTPException(status_code=404, detail="Esta cámara no tiene stream_url configurado")

    snapshot_url, user, password = _parse_rtsp_url(camara.stream_url, camara.ip)
    auth = httpx.DigestAuth(user, password) if user else None

    async def frame_generator():
        boundary = b"--frame"
        while True:
            # 1. Priorizar frame anotado por el detector IA si está disponible
            frame_ia = detector_service.get_frame_anotado()
            if frame_ia:
                yield boundary + b"\r\nContent-Type: image/jpeg\r\n\r\n" + frame_ia + b"\r\n"
                await asyncio.sleep(0.1)  # ~10 FPS fluido
                continue

            # 2. Fallback: snapshot directo por HTTP ISAPI
            try:
                async with httpx.AsyncClient(timeout=4.0, auth=auth) as client:
                    resp = await client.get(snapshot_url)
                    if resp.status_code == 200:
                        frame = resp.content
                        yield boundary + b"\r\nContent-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
            except Exception:
                pass
            await asyncio.sleep(0.3)

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-store"},
    )


@router.post("/evento", response_model=EventoAccesoRead, status_code=201)
async def registrar_evento(
    data: EventoAccesoCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    camara = await db.get(Camara, data.camara_id)
    if not camara or not camara.activa:
        raise HTTPException(status_code=404, detail="Camara no encontrada o inactiva")

    resultado = evaluar_acceso(data.confianza_ia, data.tipo_evento)

    evento = EventoAcceso(
        camara_id=data.camara_id,
        persona_id=data.persona_id,
        tipo_evento=data.tipo_evento,
        imagen_url=data.imagen_url,
        confianza_ia=data.confianza_ia,
        resultado=resultado,
    )
    db.add(evento)
    await db.commit()
    await db.refresh(evento)
    return evento


@router.get("/eventos", response_model=list[EventoAccesoRead])
async def listar_eventos(
    camara_id: int | None = Query(None),
    tipo_evento: str | None = Query(None),
    resultado: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(EventoAcceso).order_by(EventoAcceso.timestamp.desc())
    if camara_id is not None:
        query = query.where(EventoAcceso.camara_id == camara_id)
    if tipo_evento:
        query = query.where(EventoAcceso.tipo_evento == tipo_evento)
    if resultado:
        query = query.where(EventoAcceso.resultado == resultado)
    result = await db.execute(query)
    return result.scalars().all()
