from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.computadoras import Computadoras
from app.models.lectura_rfid import LecturaRFID
from app.schemas.inventario import (
    ComputadoraCreate,
    ComputadoraRead,
    ComputadoraUpdate,
    LecturaRFIDCreate,
    LecturaRFIDRead,
)

router = APIRouter(prefix="/api/inventario", tags=["Inventario"])


@router.get("/computadoras", response_model=list[ComputadoraRead])
async def listar_computadoras(
    estado: str | None = Query(None),
    modelo: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(Computadoras).where(Computadoras.activa)
    if estado:
        query = query.where(Computadoras.estado == estado)
    if modelo:
        query = query.where(Computadoras.modelo.ilike(f"%{modelo}%"))
    query = query.order_by(Computadoras.id_computadoras)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/computadoras/{id}", response_model=ComputadoraRead)
async def obtener_computadora(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Computadoras)
        .where(Computadoras.id_computadoras == id, Computadoras.activa)
    )
    pc = result.scalar_one_or_none()
    if not pc:
        raise HTTPException(status_code=404, detail="Computadora no encontrada")
    return pc


@router.post("/computadoras", response_model=ComputadoraRead, status_code=201)
async def crear_computadora(
    data: ComputadoraCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if data.tag_rfid:
        existente = await db.execute(
            select(Computadoras).where(Computadoras.tag_rfid == data.tag_rfid)
        )
        if existente.scalar_one_or_none():
            raise HTTPException(
                status_code=400, detail="El tag RFID ya esta asignado a otra computadora"
            )

    pc = Computadoras(**data.model_dump())
    db.add(pc)
    await db.commit()
    await db.refresh(pc)
    return pc


@router.put("/computadoras/{id}", response_model=ComputadoraRead)
async def actualizar_computadora(
    id: int,
    data: ComputadoraUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Computadoras).where(Computadoras.id_computadoras == id)
    )
    pc = result.scalar_one_or_none()
    if not pc:
        raise HTTPException(status_code=404, detail="Computadora no encontrada")

    if data.tag_rfid and data.tag_rfid != pc.tag_rfid:
        existente = await db.execute(
            select(Computadoras).where(Computadoras.tag_rfid == data.tag_rfid)
        )
        if existente.scalar_one_or_none():
            raise HTTPException(
                status_code=400, detail="El tag RFID ya esta asignado a otra computadora"
            )

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pc, field, value)

    await db.commit()
    await db.refresh(pc)
    return pc


@router.delete("/computadoras/{id}", status_code=204)
async def eliminar_computadora(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Computadoras).where(Computadoras.id_computadoras == id)
    )
    pc = result.scalar_one_or_none()
    if not pc:
        raise HTTPException(status_code=404, detail="Computadora no encontrada")

    pc.activa = False
    await db.commit()


@router.post("/leer", response_model=LecturaRFIDRead, status_code=201)
async def leer_tag_rfid(
    data: LecturaRFIDCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    pc = await db.execute(
        select(Computadoras).where(
            Computadoras.tag_rfid == data.tag_rfid, Computadoras.activa
        )
    )
    computadora = pc.scalar_one_or_none()

    lectura = LecturaRFID(
        tag_rfid=data.tag_rfid,
        id_computadoras=computadora.id_computadoras if computadora else None,
        lector_origen=data.lector_origen,
    )
    db.add(lectura)
    await db.commit()
    await db.refresh(lectura)
    return lectura


@router.get("/lecturas", response_model=list[LecturaRFIDRead])
async def listar_lecturas(
    tag_rfid: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(LecturaRFID).order_by(LecturaRFID.timestamp.desc())
    if tag_rfid:
        query = query.where(LecturaRFID.tag_rfid == tag_rfid)
    result = await db.execute(query)
    return result.scalars().all()
