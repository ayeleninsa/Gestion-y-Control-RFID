from datetime import date, datetime
from datetime import time as dtime

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.alumno import Alumno
from app.models.computadoras import Computadoras
from app.models.prestamo import Prestamo
from app.models.rfid_evento import RfidEvento
from app.models.user import User
from app.services.simulador import simulador

router = APIRouter(prefix="/api/simulacion", tags=["Simulacion"])


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retorna las estadísticas reales del sistema para las tarjetas del Dashboard."""
    # 1. Préstamos activos
    res_pres = await db.execute(
        select(func.count(Prestamo.id_prestamo)).where(Prestamo.estado == "Prestado")
    )
    prestamos_activos = res_pres.scalar() or 0

    # 2. Computadoras disponibles:
    # Computadoras activas con estado DISPONIBLE que no estén actualmente en préstamo activo
    subq_prestadas = select(Prestamo.id_computadoras).where(
        Prestamo.estado == "Prestado", Prestamo.id_computadoras.is_not(None)
    )
    res_disp = await db.execute(
        select(func.count(Computadoras.id_computadoras)).where(
            Computadoras.activa.is_(True),
            func.upper(Computadoras.estado) == "DISPONIBLE",
            Computadoras.id_computadoras.not_in(subq_prestadas),
        )
    )
    computadoras_disponibles = res_disp.scalar() or 0

    # 3. Alumnos registrados
    res_al = await db.execute(select(func.count(Alumno.id_alumnos)))
    alumnos_registrados = res_al.scalar() or 0

    # 4. Preceptores y administradores autorizados activos
    res_prec = await db.execute(
        select(func.count(User.id)).where(
            User.rol.in_(["preceptor", "admin"]),
            User.activo.is_(True),
        )
    )
    preceptores_autorizados = res_prec.scalar() or 0

    # 5. Eventos registrados hoy
    hoy = date.today()
    inicio_hoy = datetime.combine(hoy, dtime.min)
    res_evt = await db.execute(
        select(func.count(RfidEvento.id)).where(RfidEvento.timestamp >= inicio_hoy)
    )
    eventos_hoy = res_evt.scalar() or 0

    # 6. Alertas pendientes
    alertas_pendientes = len([a for a in simulador.alertas if not a.get("leida")])

    return {
        "computadoras_disponibles": computadoras_disponibles,
        "prestamos_activos": prestamos_activos,
        "alumnos_registrados": alumnos_registrados,
        "preceptores_autorizados": preceptores_autorizados,
        "eventos_hoy": eventos_hoy,
        "alertas_pendientes": alertas_pendientes,
    }


@router.get("/actividad")
async def get_actividad(limite: int = 10, current_user=Depends(get_current_user)):
    return simulador.get_actividad(limite)


@router.get("/alertas")
async def get_alertas(limite: int = 20, current_user=Depends(get_current_user)):
    return simulador.get_alertas(limite)


@router.get("/eventos-qr")
async def get_eventos_qr(limite: int = 20, current_user=Depends(get_current_user)):
    return simulador.get_eventos_qr(limite)


@router.get("/lecturas-antenna")
async def get_lecturas_antenna(limite: int = 20, current_user=Depends(get_current_user)):
    return simulador.get_lecturas_antenna(limite)


@router.get("/qr-fisico")
async def get_qr_fisico(current_user=Depends(get_current_user)):
    return simulador.get_qr_fisico()


@router.get("/qr-dinamico")
async def get_qr_dinamico(current_user=Depends(get_current_user)):
    return simulador.get_qr_dinamico()


@router.get("/prestamos")
async def get_prestamos(
    limite: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retorna préstamos activos reales para la tabla del Dashboard."""
    res = await db.execute(
        select(Prestamo)
        .options(
            selectinload(Prestamo.alumno).selectinload(Alumno.persona),
            selectinload(Prestamo.computadora),
        )
        .where(Prestamo.estado == "Prestado")
        .order_by(Prestamo.fecha_prestamo.desc())
        .limit(limite)
    )
    prestamos_db = res.scalars().all()
    if not prestamos_db:
        return []

    out = []
    for p in prestamos_db:
        nombre = f"{p.alumno.persona.nombre} {p.alumno.persona.apellido}" if p.alumno and p.alumno.persona else "Alumno"
        iniciales = f"{p.alumno.persona.nombre[:1]}{p.alumno.persona.apellido[:1]}" if p.alumno and p.alumno.persona else "AL"
        notebook = p.computadora.modelo if p.computadora else "Notebook"
        fecha = p.fecha_prestamo.strftime("%d/%m/%Y") if p.fecha_prestamo else "-"
        out.append({
            "name": nombre,
            "initials": iniciales,
            "notebook": notebook,
            "date": fecha,
            "preceptor": "Preceptor",
            "estado": p.estado,
        })
    return out


@router.get("/camaras")
async def get_camaras(current_user=Depends(get_current_user)):
    return simulador.get_camaras()


@router.get("/grafico-prestamos")
async def get_grafico_prestamos(current_user=Depends(get_current_user)):
    return simulador.get_grafico_prestamos()

