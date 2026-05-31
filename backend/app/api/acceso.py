from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.camara import Camara
from app.models.evento_acceso import EventoAcceso
from app.schemas.acceso import (
    CamaraCreate,
    CamaraRead,
    CamaraUpdate,
    EventoAccesoCreate,
    EventoAccesoRead,
)
from app.services.evaluacion_acceso import evaluar_acceso

router = APIRouter(prefix="/api/acceso", tags=["Control de Acceso"])


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
