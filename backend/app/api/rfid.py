from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.rfid_evento import RfidEvento
from app.models.rfid_lector import RfidLector
from app.models.rfid_tag import RfidTag
from app.schemas.rfid import (
    RfidEventoCreate,
    RfidEventoRead,
    RfidLectorCreate,
    RfidLectorRead,
    RfidLectorUpdate,
    RfidTagCreate,
    RfidTagRead,
    RfidTagUpdate,
)

router = APIRouter(prefix="/api/rfid", tags=["RFID"])


@router.get("/lectores", response_model=list[RfidLectorRead])
async def listar_lectores(
    activo: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(RfidLector)
    if activo is not None:
        query = query.where(RfidLector.activo == activo)
    query = query.order_by(RfidLector.id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/lectores", response_model=RfidLectorRead, status_code=201)
async def crear_lector(
    data: RfidLectorCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    lector = RfidLector(**data.model_dump())
    db.add(lector)
    await db.commit()
    await db.refresh(lector)
    return lector


@router.put("/lectores/{id}", response_model=RfidLectorRead)
async def actualizar_lector(
    id: int,
    data: RfidLectorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(RfidLector).where(RfidLector.id == id))
    lector = result.scalar_one_or_none()
    if not lector:
        raise HTTPException(status_code=404, detail="Lector no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lector, field, value)

    await db.commit()
    await db.refresh(lector)
    return lector


@router.delete("/lectores/{id}", status_code=204)
async def eliminar_lector(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(RfidLector).where(RfidLector.id == id))
    lector = result.scalar_one_or_none()
    if not lector:
        raise HTTPException(status_code=404, detail="Lector no encontrado")

    lector.activo = False
    await db.commit()


@router.get("/tags", response_model=list[RfidTagRead])
async def listar_tags(
    estado: str | None = Query(None),
    tipo: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(RfidTag)
    if estado:
        query = query.where(RfidTag.estado == estado)
    if tipo:
        query = query.where(RfidTag.tipo == tipo)
    query = query.order_by(RfidTag.id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/tags", response_model=RfidTagRead, status_code=201)
async def crear_tag(
    data: RfidTagCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existente = await db.execute(
        select(RfidTag).where(RfidTag.tag_rfid == data.tag_rfid)
    )
    if existente.scalar_one_or_none():
        raise HTTPException(
            status_code=400, detail="El tag RFID ya esta registrado"
        )

    tag = RfidTag(**data.model_dump())
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag


@router.put("/tags/{id}", response_model=RfidTagRead)
async def actualizar_tag(
    id: int,
    data: RfidTagUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(RfidTag).where(RfidTag.id == id))
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag RFID no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tag, field, value)

    await db.commit()
    await db.refresh(tag)
    return tag


@router.get("/tags/{id}", response_model=RfidTagRead)
async def obtener_tag(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(RfidTag).where(RfidTag.id == id))
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag RFID no encontrado")
    return tag


@router.get("/eventos", response_model=list[RfidEventoRead])
async def listar_eventos(
    tag_rfid: str | None = Query(None),
    tipo_evento: str | None = Query(None),
    lector_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(RfidEvento).order_by(RfidEvento.timestamp.desc())
    if tag_rfid:
        query = query.where(RfidEvento.tag_rfid == tag_rfid)
    if tipo_evento:
        query = query.where(RfidEvento.tipo_evento == tipo_evento)
    if lector_id is not None:
        query = query.where(RfidEvento.lector_id == lector_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/eventos", response_model=RfidEventoRead, status_code=201)
async def crear_evento(
    data: RfidEventoCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    evento = RfidEvento(**data.model_dump())
    db.add(evento)
    await db.commit()
    await db.refresh(evento)
    return evento
