from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.alumno import Alumno
from app.models.computadoras import Computadoras
from app.models.prestamo import Prestamo
from app.models.user import User

router = APIRouter(prefix="/api/prestamos", tags=["Prestamos"])

ESTADOS_VALIDOS = ("Prestado", "Devuelto", "No devuelto")


class PrestamoResponse(BaseModel):
    id_prestamo: int
    alumno_nombre: str | None = None
    alumno_apellido: str | None = None
    alumno_dni: str | None = None
    computadora_modelo: str | None = None
    tag_rfid: str | None = None
    carrera_nombre: str | None = None
    anio_en_curso: int | None = None
    estado: str
    fecha_prestamo: str
    fecha_devolucion: str | None = None


class UpdateEstadoRequest(BaseModel):
    estado: str | None = None
    fecha_prestamo: datetime | None = None


class CreatePrestamoRequest(BaseModel):
    id_alumnos: int
    id_computadoras: int | None = None
    fecha_prestamo: datetime | None = None


def serialize_prestamo(p: Prestamo) -> dict:
    persona = p.alumno.persona if p.alumno else None
    return {
        "id_prestamo": p.id_prestamo,
        "alumno_nombre": persona.nombre if persona else None,
        "alumno_apellido": persona.apellido if persona else None,
        "alumno_dni": persona.dni if persona else None,
        "computadora_modelo": p.computadora.modelo if p.computadora else None,
        "tag_rfid": p.computadora.tag_rfid if p.computadora else None,
        "carrera_nombre": p.alumno.carrera.nombre if p.alumno and p.alumno.carrera else None,
        "anio_en_curso": p.alumno.anio_en_curso if p.alumno else None,
        "estado": p.estado,
        "fecha_prestamo": p.fecha_prestamo.isoformat(),
        "fecha_devolucion": p.fecha_devolucion.isoformat() if p.fecha_devolucion else None,
    }


@router.get("", response_model=list[PrestamoResponse])
async def listar_prestamos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="Solo preceptores y admins pueden ver prestamos")

    res = await db.execute(
        select(Prestamo)
        .options(
            selectinload(Prestamo.alumno).selectinload(Alumno.persona),
            selectinload(Prestamo.alumno).selectinload(Alumno.carrera),
            selectinload(Prestamo.computadora),
        )
        .order_by(Prestamo.fecha_prestamo.desc())
    )
    prestamos = res.scalars().all()
    return [serialize_prestamo(p) for p in prestamos]


@router.post("", response_model=PrestamoResponse, status_code=201)
async def crear_prestamo(
    data: CreatePrestamoRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="Solo preceptores y admins pueden crear prestamos")

    res_al = await db.execute(select(Alumno).where(Alumno.id_alumnos == data.id_alumnos))
    alumno = res_al.scalar_one_or_none()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    id_computadoras = data.id_computadoras or alumno.id_computadoras
    if not id_computadoras:
        raise HTTPException(status_code=400, detail="El alumno no tiene una computadora asignada. Seleccione una computadora.")

    res_pc = await db.execute(select(Computadoras).where(Computadoras.id_computadoras == id_computadoras))
    if not res_pc.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Computadora no encontrada")

    prestamo = Prestamo(
        id_alumnos=alumno.id_alumnos,
        id_computadoras=id_computadoras,
        estado="Prestado",
        fecha_prestamo=data.fecha_prestamo or datetime.now(timezone.utc),
    )
    db.add(prestamo)
    await db.commit()

    res = await db.execute(
        select(Prestamo)
        .options(
            selectinload(Prestamo.alumno).selectinload(Alumno.persona),
            selectinload(Prestamo.alumno).selectinload(Alumno.carrera),
            selectinload(Prestamo.computadora),
        )
        .where(Prestamo.id_prestamo == prestamo.id_prestamo)
    )
    return serialize_prestamo(res.scalar_one())


@router.patch("/{prestamo_id}", response_model=PrestamoResponse)
async def actualizar_estado(
    prestamo_id: int,
    data: UpdateEstadoRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="Solo preceptores y admins pueden actualizar prestamos")

    if data.estado is not None and data.estado not in ESTADOS_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Debe ser uno de: {', '.join(ESTADOS_VALIDOS)}")

    if data.estado is None and data.fecha_prestamo is None:
        raise HTTPException(status_code=400, detail="Debe enviar al menos un campo a actualizar")

    res = await db.execute(
        select(Prestamo)
        .options(
            selectinload(Prestamo.alumno).selectinload(Alumno.persona),
            selectinload(Prestamo.alumno).selectinload(Alumno.carrera),
            selectinload(Prestamo.computadora),
        )
        .where(Prestamo.id_prestamo == prestamo_id)
    )
    prestamo = res.scalar_one_or_none()
    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")

    if data.estado is not None:
        prestamo.estado = data.estado
        if data.estado == "Devuelto" and not prestamo.fecha_devolucion:
            prestamo.fecha_devolucion = datetime.now(timezone.utc)

    if data.fecha_prestamo is not None:
        prestamo.fecha_prestamo = data.fecha_prestamo

    await db.commit()
    return serialize_prestamo(prestamo)


@router.delete("/{prestamo_id}")
async def eliminar_prestamo(
    prestamo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="Solo preceptores y admins pueden eliminar prestamos")

    res = await db.execute(select(Prestamo).where(Prestamo.id_prestamo == prestamo_id))
    prestamo = res.scalar_one_or_none()
    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")

    await db.delete(prestamo)
    await db.commit()
    return {"message": "Préstamo eliminado"}