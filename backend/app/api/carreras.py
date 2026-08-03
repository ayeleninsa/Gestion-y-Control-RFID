from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.carrera import Carrera
from app.schemas.carrera import CarreraCreate, CarreraRead, CarreraUpdate

router = APIRouter(prefix="/api/carreras", tags=["Carreras"])

@router.get("/", response_model=list[CarreraRead])
async def listar_carreras(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Carrera).order_by(Carrera.id_carrera))
    return result.scalars().all()

@router.get("/{id}", response_model=CarreraRead)
async def obtener_carrera(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(Carrera).where(Carrera.id_carrera == id))
    carrera = result.scalar_one_or_none()
    if not carrera:
        raise HTTPException(status_code=404, detail="Carrera no encontrada")
    return carrera

@router.post("/", response_model=CarreraRead, status_code=201)
async def crear_carrera(
    data: CarreraCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="No autorizado")

    carrera = Carrera(**data.model_dump())
    db.add(carrera)
    await db.commit()
    await db.refresh(carrera)
    return carrera

@router.put("/{id}", response_model=CarreraRead)
async def actualizar_carrera(
    id: int,
    data: CarreraUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="No autorizado")

    result = await db.execute(select(Carrera).where(Carrera.id_carrera == id))
    carrera = result.scalar_one_or_none()
    if not carrera:
        raise HTTPException(status_code=404, detail="Carrera no encontrada")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(carrera, field, value)

    await db.commit()
    await db.refresh(carrera)
    return carrera

@router.delete("/{id}", status_code=204)
async def eliminar_carrera(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="No autorizado")

    result = await db.execute(select(Carrera).where(Carrera.id_carrera == id))
    carrera = result.scalar_one_or_none()
    if not carrera:
        raise HTTPException(status_code=404, detail="Carrera no encontrada")

    db.delete(carrera)
    await db.commit()
