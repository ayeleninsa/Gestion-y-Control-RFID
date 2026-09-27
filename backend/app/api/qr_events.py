import hashlib
import re
import time
import uuid
from datetime import date, datetime, timedelta, timezone
from datetime import time as dtime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import Date, cast, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.alumno import Alumno
from app.models.computadoras import Computadoras
from app.models.lectura_rfid import LecturaRFID
from app.models.prestamo import Prestamo
from app.models.qr_token import QrToken
from app.models.rfid_evento import RfidEvento
from app.models.user import User

router = APIRouter(prefix="/api/qr", tags=["QR Events"])

_TAG_RE = re.compile(r"TAG\s*RFID:\s*(\S+)", re.IGNORECASE)
_DNI_RE = re.compile(r"\bDni:\s*(\S+)", re.IGNORECASE)


def _extraer_tag_rfid(texto: str) -> str:
    """Extrae el tag del QR físico scanneado.

    El QR impreso en la computadora (carpeta qr/) contiene texto multilinea con
    el DNI del alumno ('Dni: 46252642'), que es el valor guardado en tag_rfid.
    Tambien se soporta el formato 'TAG RFID: <valor>'. Si no se encuentra
    ninguna linea, se devuelve el texto limpio (por si es solo el tag).
    """
    texto = texto.strip()
    match = _TAG_RE.search(texto)
    if match:
        return match.group(1)
    match = _DNI_RE.search(texto)
    if match:
        return match.group(1)
    return texto


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _validar_jwt_dinamico(token: str, verify_exp: bool = False) -> int:
    """Valida el JWT del QR dinamico y devuelve el id del preceptor que lo genero."""
    from jose import JWTError, jwt

    from app.core.config import settings

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"verify_exp": verify_exp},
        )
    except JWTError:
        raise HTTPException(status_code=400, detail="QR dinámico inválido")
    if payload.get("type") != "dynamic_qr":
        raise HTTPException(status_code=400, detail="Token QR inválido")
    if payload.get("sub") is None:
        raise HTTPException(status_code=400, detail="Token QR inválido")
    return int(payload["sub"])


async def _get_alumno_de_usuario(db: AsyncSession, current_user: User) -> Alumno:
    if not current_user.id_persona:
        raise HTTPException(status_code=404, detail="Usuario alumno no tiene perfil de persona")

    res = await db.execute(
        select(Alumno).options(selectinload(Alumno.persona)).where(Alumno.id_persona == current_user.id_persona)
    )
    alumno = res.scalar_one_or_none()
    if not alumno:
        raise HTTPException(status_code=404, detail="Registro de alumno no encontrado")
    return alumno

class AlumnoPorDniResponse(BaseModel):
    computadora: dict | None = None
    alumno: dict | None = None
    carrera: str | None = None

@router.get("/alumno-por-dni/{dni}", response_model=AlumnoPorDniResponse)
async def alumno_por_dni(
    dni: str,
    db: AsyncSession = Depends(get_db),
):
    res_pc = await db.execute(select(Computadoras).where(Computadoras.tag_rfid == _extraer_tag_rfid(dni)))
    computadora = res_pc.scalar_one_or_none()
    if not computadora:
        raise HTTPException(status_code=404, detail="No se encontró una computadora registrada para este QR")

    res_al = await db.execute(
        select(Alumno)
        .options(selectinload(Alumno.persona), selectinload(Alumno.carrera))
        .where(Alumno.id_computadoras == computadora.id_computadoras)
    )
    alumno = res_al.scalar_one_or_none()

    return AlumnoPorDniResponse(
        computadora={
            "id_computadoras": computadora.id_computadoras,
            "modelo": computadora.modelo,
            "tag_rfid": computadora.tag_rfid,
            "estado": computadora.estado,
            "activa": computadora.activa,
        },
        alumno={
            "nombre": alumno.persona.nombre if alumno and alumno.persona else None,
            "apellido": alumno.persona.apellido if alumno and alumno.persona else None,
            "dni": alumno.persona.dni if alumno and alumno.persona else None,
        } if alumno else None,
        carrera=alumno.carrera.nombre if alumno and alumno.carrera else None,
    )

class DynamicQRResponse(BaseModel):
    qr_token: str
    expires_in: int = 10

class ValidateDualQRRequest(BaseModel):
    qr_fisico: str
    qr_dinamico: str

class ValidateDualQRResponse(BaseModel):
    status: str
    message: str
    alumno_nombre: str | None = None
    computadora_tag: str | None = None
    computadora_modelo: str | None = None
    evento_tipo: str
    numero_operacion_hoy: int = 1
    timestamp: str | None = None
    hora: str | None = None

@router.get("/dynamic", response_model=DynamicQRResponse)
async def generate_dynamic_qr(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="Solo preceptores y admins pueden generar QR dinámico")

    # Generate token valid for 60 seconds
    token_data = {
        "sub": str(current_user.id),
        "type": "dynamic_qr",
        "exp": int(time.time()) + 60,
        "jti": uuid.uuid4().hex,
    }

    from jose import jwt

    from app.core.config import settings

    encoded_jwt = jwt.encode(token_data, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

    expires_at = datetime.now(timezone.utc) + timedelta(seconds=60)
    db.add(QrToken(token_hash=_hash_token(encoded_jwt), preceptor_id=current_user.id, expires_at=expires_at))
    await db.commit()

    return DynamicQRResponse(qr_token=encoded_jwt, expires_in=60)


class ReclamarQRRequest(BaseModel):
    qr_dinamico: str


class ReclamarQRResponse(BaseModel):
    status: str
    message: str
    alumno_nombre: str | None = None


@router.post("/reclamar", response_model=ReclamarQRResponse)
async def reclamar_qr_dinamico(
    data: ReclamarQRRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """El alumno reclama (consume) el QR dinamico apenas lo escanea (paso 1)."""
    if current_user.rol != "alumno":
        raise HTTPException(status_code=403, detail="Solo los alumnos pueden escanear el QR dinámico")

    _validar_jwt_dinamico(data.qr_dinamico, verify_exp=False)

    token_hash = _hash_token(data.qr_dinamico)
    res = await db.execute(select(QrToken).where(QrToken.token_hash == token_hash))
    registro = res.scalar_one_or_none()

    if not registro:
        raise HTTPException(status_code=400, detail="QR dinámico inválido o no encontrado")

    if registro.used_at is not None:
        raise HTTPException(status_code=400, detail="QR dinámico ya utilizado. Pedí al preceptor que genere uno nuevo")

    now = datetime.now(timezone.utc)
    if now > registro.expires_at + timedelta(seconds=2):
        raise HTTPException(status_code=400, detail="QR dinámico caducado. Pedí al preceptor que genere uno nuevo")

    alumno = await _get_alumno_de_usuario(db, current_user)

    registro.used_at = now
    registro.alumno_id = alumno.id_alumnos
    await db.commit()

    nombre = f"{alumno.persona.nombre} {alumno.persona.apellido}" if alumno.persona else current_user.username
    return ReclamarQRResponse(status="ok", message="QR dinámico validado", alumno_nombre=nombre)


class EstadoDynamicQRRequest(BaseModel):
    qr_dinamico: str


class EstadoDynamicQRResponse(BaseModel):
    usado: bool
    alumno_nombre: str | None = None
    expira_en: int = 0


@router.post("/dynamic/estado", response_model=EstadoDynamicQRResponse)
async def estado_dynamic_qr(
    data: EstadoDynamicQRRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Consulta (polling del preceptor) si el QR dinamico generado ya fue usado por un alumno."""
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="Solo preceptores y admins pueden consultar el estado del QR dinámico")

    _validar_jwt_dinamico(data.qr_dinamico, verify_exp=False)

    token_hash = _hash_token(data.qr_dinamico)
    res = await db.execute(select(QrToken).where(QrToken.token_hash == token_hash))
    registro = res.scalar_one_or_none()

    if not registro:
        return EstadoDynamicQRResponse(usado=False, expira_en=0)

    ahora = datetime.now(timezone.utc)
    if registro.used_at is not None:
        nombre = None
        if registro.alumno_id:
            res_al = await db.execute(
                select(Alumno).options(selectinload(Alumno.persona)).where(Alumno.id_alumnos == registro.alumno_id)
            )
            al = res_al.scalar_one_or_none()
            if al and al.persona:
                nombre = f"{al.persona.nombre} {al.persona.apellido}"
        return EstadoDynamicQRResponse(usado=True, alumno_nombre=nombre)

    return EstadoDynamicQRResponse(usado=False, expira_en=max(0, int((registro.expires_at - ahora).total_seconds())))


@router.post("/validar", response_model=ValidateDualQRResponse)
async def validar_retiro_devolucion(
    data: ValidateDualQRRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.rol != "alumno":
        raise HTTPException(status_code=403, detail="Solo los alumnos pueden validar el retiro/devolución")

    # 1. Verify Dynamic QR (Preceptor's token)
    preceptor_id = _validar_jwt_dinamico(data.qr_dinamico, verify_exp=False)

    token_hash = _hash_token(data.qr_dinamico)
    res_token = await db.execute(select(QrToken).where(QrToken.token_hash == token_hash))
    registro_token = res_token.scalar_one_or_none()

    if not registro_token:
        raise HTTPException(status_code=400, detail="QR dinámico inválido")

    # 2. Get Alumno (current user)
    alumno = await _get_alumno_de_usuario(db, current_user)

    now = datetime.now(timezone.utc)
    if registro_token.used_at is not None:
        # El token ya fue reclamado: solo puede completar la operacion el mismo alumno que lo escaneo
        if registro_token.alumno_id != alumno.id_alumnos:
            raise HTTPException(status_code=400, detail="QR dinámico ya utilizado por otro alumno. Pedí al preceptor que genere uno nuevo")
        # Tiempo de gracia de 10 minutos para escanear el tag físico
        if (now - registro_token.used_at) > timedelta(minutes=10):
            raise HTTPException(status_code=400, detail="Tiempo para escanear la computadora agotado. Escanea el QR dinámico de nuevo.")
    else:
        # Flujos directos sin reclamo previo
        if now > registro_token.expires_at:
            raise HTTPException(status_code=400, detail="QR dinámico caducado. Pedí al preceptor que genere uno nuevo")
        registro_token.used_at = now
        registro_token.alumno_id = alumno.id_alumnos

    # 3. Get Computadora from Physical QR (required)
    tag_limpio = _extraer_tag_rfid(data.qr_fisico)
    res_pc = await db.execute(select(Computadoras).where(Computadoras.tag_rfid == tag_limpio))
    computadora = res_pc.scalar_one_or_none()

    if not computadora:
        raise HTTPException(status_code=404, detail=f"Computadora con tag '{tag_limpio}' no registrada")

    if alumno.id_computadoras != computadora.id_computadoras:
        raise HTTPException(status_code=400, detail="Esta computadora no coincide con la asignada a tu perfil")

    # 4. Check today's events for this student to determine RETIRO vs DEVOLUCION
    hoy = date.today()
    inicio_hoy = datetime.combine(hoy, dtime.min)
    fin_hoy = datetime.combine(hoy, dtime.max)

    res_ev_hoy = await db.execute(
        select(RfidEvento)
        .where(
            RfidEvento.timestamp >= inicio_hoy,
            RfidEvento.timestamp <= fin_hoy,
            RfidEvento.tipo_evento.in_(["RETIRO_PC", "DEVOLUCION_PC"]),
        )
        .order_by(RfidEvento.timestamp.asc())
    )
    eventos_alumno_hoy = [
        e for e in res_ev_hoy.scalars().all()
        if e.detalles and e.detalles.get("alumno_id") == alumno.id_alumnos
    ]

    # Determinación: 1er escaneo del día = RETIRO, 2do escaneo del día = DEVOLUCION
    if not eventos_alumno_hoy:
        tipo = "RETIRO_PC"
        numero_operacion = 1
        mensaje = "¡Retiro registrado con éxito! Has retirado tu computadora para la jornada."
        computadora.estado = "EN_USO"
    else:
        ultimo_tipo = eventos_alumno_hoy[-1].tipo_evento
        if ultimo_tipo == "RETIRO_PC":
            tipo = "DEVOLUCION_PC"
            numero_operacion = len(eventos_alumno_hoy) + 1
            mensaje = "¡Devolución registrada con éxito! Has devuelto tu computadora correctamente."
            computadora.estado = "DISPONIBLE"
        else:
            tipo = "RETIRO_PC"
            numero_operacion = len(eventos_alumno_hoy) + 1
            mensaje = "¡Retiro registrado con éxito! Has vuelto a retirar la computadora."
            computadora.estado = "EN_USO"

    # 5. Log Event
    evento = RfidEvento(
        tag_rfid=computadora.tag_rfid,
        tipo_evento=tipo,
        detalles={
            "alumno_id": alumno.id_alumnos,
            "preceptor_id": preceptor_id,
            "tipo_qr": "Fisico + Dinamico",
            "qr_dinamico_hash": token_hash,
            "numero_operacion_hoy": numero_operacion,
        },
    )
    db.add(evento)

    await db.commit()

    nombre_completo = f"{alumno.persona.nombre} {alumno.persona.apellido}" if alumno.persona else current_user.username

    # Hora local (Argentina UTC-3)
    zona_ar = timezone(timedelta(hours=-3))
    ahora_local = now.astimezone(zona_ar)
    hora_str = ahora_local.strftime("%H:%M:%S")

    return ValidateDualQRResponse(
        status="success",
        message=mensaje,
        alumno_nombre=nombre_completo,
        computadora_tag=computadora.tag_rfid,
        computadora_modelo=computadora.modelo,
        evento_tipo=tipo,
        numero_operacion_hoy=numero_operacion,
        timestamp=now.isoformat(),
        hora=hora_str,
    )


class RegistroHoyResponse(BaseModel):
    id: int
    timestamp: str
    tipo_evento: str
    tag_rfid: str
    alumno_nombre: str
    alumno_apellido: str
    alumno_dni: str
    computadora_modelo: str
    tipo_qr: str

@router.get("/registros-hoy", response_model=list[RegistroHoyResponse])
async def obtener_registros_hoy(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    hoy = date.today()
    res = await db.execute(
        select(RfidEvento).where(
            cast(RfidEvento.timestamp, Date) == hoy,
            RfidEvento.tipo_evento.in_(["RETIRO_PC", "DEVOLUCION_PC"])
        ).order_by(RfidEvento.timestamp.desc())
    )
    eventos = res.scalars().all()

    alumno_ids = [e.detalles.get("alumno_id") for e in eventos if e.detalles and "alumno_id" in e.detalles]

    alumnos_map = {}
    if alumno_ids:
        res_alumnos = await db.execute(
            select(Alumno).options(selectinload(Alumno.persona), selectinload(Alumno.computadora)).where(Alumno.id_alumnos.in_(alumno_ids))
        )
        alumnos = res_alumnos.scalars().all()
        for al in alumnos:
            alumnos_map[al.id_alumnos] = al

    resultados = []
    for evt in eventos:
        al_id = evt.detalles.get("alumno_id") if evt.detalles else None
        alumno = alumnos_map.get(al_id)

        resultados.append({
            "id": evt.id,
            "timestamp": evt.timestamp.isoformat(),
            "tipo_evento": evt.tipo_evento,
            "tag_rfid": evt.tag_rfid,
            "alumno_nombre": alumno.persona.nombre if alumno and alumno.persona else "Desconocido",
            "alumno_apellido": alumno.persona.apellido if alumno and alumno.persona else "",
            "alumno_dni": alumno.persona.dni if alumno and alumno.persona else "N/A",
            "computadora_modelo": alumno.computadora.modelo if alumno and alumno.computadora else "",
            "tipo_qr": evt.detalles.get("tipo_qr", "Fisico + Dinamico") if evt.detalles else "Fisico + Dinamico"
        })

    return resultados


class EstadoEscaneoResponse(BaseModel):
    id_alumno: int | None
    alumno: str
    dni: str | None
    carrera: str | None
    computadora_tag: str | None
    computadora_modelo: str | None
    completo_hoy: bool
    reclamo_hoy: bool
    paso_por_antena_hoy: bool
    estado: str  # AMBOS | FALTA_QRFISICO | NO_ESCANEO_NINGUN_QR | SIN_ACTIVIDAD


@router.get("/estado-escaneo", response_model=list[EstadoEscaneoResponse])
async def obtener_estado_escaneo(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Estado de escaneo por alumno: quie analizo si completo el flujo de QR de hoy."""
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="Solo administradores y preceptores pueden ver el estado de escaneo")

    hoy = date.today()
    inicio = datetime.combine(hoy, dtime.min)
    fin = datetime.combine(hoy, dtime.max)

    # 1. Todos los alumnos con computadora
    res_al = await db.execute(
        select(Alumno)
        .options(
            selectinload(Alumno.persona),
            selectinload(Alumno.computadora),
            selectinload(Alumno.carrera),
        )
    )
    alumnos = res_al.scalars().all()

    # 2. Eventos completos de hoy (RETIRO/DEVOLUCION) -> escanearon ambos QR
    res_ev = await db.execute(
        select(RfidEvento).where(
            RfidEvento.timestamp >= inicio,
            RfidEvento.tipo_evento.in_(["RETIRO_PC", "DEVOLUCION_PC"]),
        )
    )
    completos = set()
    for e in res_ev.scalars().all():
        if e.detalles and e.detalles.get("alumno_id") is not None:
            completos.add(e.detalles["alumno_id"])

    # 3. QrToken reclamados hoy (escanearon el QR dinamico)
    else:
        # Flujos directos sin reclamo previo
        if now > registro_token.expires_at:
            raise HTTPException(status_code=400, detail="QR dinámico caducado. Pedí al preceptor que genere uno nuevo")
        registro_token.used_at = now
        registro_token.alumno_id = alumno.id_alumnos

    # 3. Get Computadora from Physical QR (required)
    tag_limpio = _extraer_tag_rfid(data.qr_fisico)
    res_pc = await db.execute(select(Computadoras).where(Computadoras.tag_rfid == tag_limpio))
    computadora = res_pc.scalar_one_or_none()

    if not computadora:
        raise HTTPException(status_code=404, detail=f"Computadora con tag '{tag_limpio}' no registrada")

    if alumno.id_computadoras != computadora.id_computadoras:
        raise HTTPException(status_code=400, detail="Esta computadora no coincide con la asignada a tu perfil")

    # 4. Check today's events for this student to determine RETIRO vs DEVOLUCION
    hoy = date.today()
    inicio_hoy = datetime.combine(hoy, dtime.min)
    fin_hoy = datetime.combine(hoy, dtime.max)

    res_ev_hoy = await db.execute(
        select(RfidEvento)
        .where(
            RfidEvento.timestamp >= inicio_hoy,
            RfidEvento.timestamp <= fin_hoy,
            RfidEvento.tipo_evento.in_(["RETIRO_PC", "DEVOLUCION_PC"]),
        )
        .order_by(RfidEvento.timestamp.asc())
    )
    eventos_alumno_hoy = [
        e for e in res_ev_hoy.scalars().all()
        if e.detalles and e.detalles.get("alumno_id") == alumno.id_alumnos
    ]

    # Determinación: 1er escaneo del día = RETIRO, 2do escaneo del día = DEVOLUCION
    if not eventos_alumno_hoy:
        tipo = "RETIRO_PC"
        numero_operacion = 1
        mensaje = "¡Retiro registrado con éxito! Has retirado tu computadora para la jornada."
        computadora.estado = "EN_USO"
    else:
        ultimo_tipo = eventos_alumno_hoy[-1].tipo_evento
        if ultimo_tipo == "RETIRO_PC":
            tipo = "DEVOLUCION_PC"
            numero_operacion = len(eventos_alumno_hoy) + 1
            mensaje = "¡Devolución registrada con éxito! Has devuelto tu computadora correctamente."
            computadora.estado = "DISPONIBLE"
        else:
            tipo = "RETIRO_PC"
            numero_operacion = len(eventos_alumno_hoy) + 1
            mensaje = "¡Retiro registrado con éxito! Has vuelto a retirar la computadora."
            computadora.estado = "EN_USO"

    # 5. Log Event
    evento = RfidEvento(
        tag_rfid=computadora.tag_rfid,
        tipo_evento=tipo,
        detalles={
            "alumno_id": alumno.id_alumnos,
            "preceptor_id": preceptor_id,
            "tipo_qr": "Fisico + Dinamico",
            "qr_dinamico_hash": token_hash,
            "numero_operacion_hoy": numero_operacion,
        },
    )
    db.add(evento)

    await db.commit()

    nombre_completo = f"{alumno.persona.nombre} {alumno.persona.apellido}" if alumno.persona else current_user.username

    # Hora local (Argentina UTC-3)
    zona_ar = timezone(timedelta(hours=-3))
    ahora_local = now.astimezone(zona_ar)
    hora_str = ahora_local.strftime("%H:%M:%S")

    return ValidateDualQRResponse(
        status="success",
        message=mensaje,
        alumno_nombre=nombre_completo,
        computadora_tag=computadora.tag_rfid,
        computadora_modelo=computadora.modelo,
        evento_tipo=tipo,
        numero_operacion_hoy=numero_operacion,
        timestamp=now.isoformat(),
        hora=hora_str,
    )


class RegistroHoyResponse(BaseModel):
    id: int
    timestamp: str
    tipo_evento: str
    tag_rfid: str
    alumno_nombre: str
    alumno_apellido: str
    alumno_dni: str
    computadora_modelo: str
    tipo_qr: str

@router.get("/registros-hoy", response_model=list[RegistroHoyResponse])
async def obtener_registros_hoy(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    hoy = date.today()
    res = await db.execute(
        select(RfidEvento).where(
            cast(RfidEvento.timestamp, Date) == hoy,
            RfidEvento.tipo_evento.in_(["RETIRO_PC", "DEVOLUCION_PC"])
        ).order_by(RfidEvento.timestamp.desc())
    )
    eventos = res.scalars().all()

    alumno_ids = [e.detalles.get("alumno_id") for e in eventos if e.detalles and "alumno_id" in e.detalles]

    alumnos_map = {}
    if alumno_ids:
        res_alumnos = await db.execute(
            select(Alumno).options(selectinload(Alumno.persona), selectinload(Alumno.computadora)).where(Alumno.id_alumnos.in_(alumno_ids))
        )
        alumnos = res_alumnos.scalars().all()
        for al in alumnos:
            alumnos_map[al.id_alumnos] = al

    resultados = []
    for evt in eventos:
        al_id = evt.detalles.get("alumno_id") if evt.detalles else None
        alumno = alumnos_map.get(al_id)

        resultados.append({
            "id": evt.id,
            "timestamp": evt.timestamp.isoformat(),
            "tipo_evento": evt.tipo_evento,
            "tag_rfid": evt.tag_rfid,
            "alumno_nombre": alumno.persona.nombre if alumno and alumno.persona else "Desconocido",
            "alumno_apellido": alumno.persona.apellido if alumno and alumno.persona else "",
            "alumno_dni": alumno.persona.dni if alumno and alumno.persona else "N/A",
            "computadora_modelo": alumno.computadora.modelo if alumno and alumno.computadora else "",
            "tipo_qr": evt.detalles.get("tipo_qr", "Fisico + Dinamico") if evt.detalles else "Fisico + Dinamico"
        })

    return resultados


class EstadoEscaneoResponse(BaseModel):
    id_alumno: int | None
    alumno: str
    dni: str | None
    carrera: str | None
    computadora_tag: str | None
    computadora_modelo: str | None
    completo_hoy: bool
    reclamo_hoy: bool
    paso_por_antena_hoy: bool
    estado: str  # AMBOS | FALTA_QRFISICO | NO_ESCANEO_NINGUN_QR | SIN_ACTIVIDAD


@router.get("/estado-escaneo", response_model=list[EstadoEscaneoResponse])
async def obtener_estado_escaneo(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Estado de escaneo por alumno: quie analizo si completo el flujo de QR de hoy."""
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="Solo administradores y preceptores pueden ver el estado de escaneo")

    hoy = date.today()
    inicio = datetime.combine(hoy, dtime.min)
    fin = datetime.combine(hoy, dtime.max)

    # 1. Todos los alumnos con computadora
    res_al = await db.execute(
        select(Alumno)
        .options(
            selectinload(Alumno.persona),
            selectinload(Alumno.computadora),
            selectinload(Alumno.carrera),
        )
    )
    alumnos = res_al.scalars().all()

    # 2. Eventos completos de hoy (RETIRO/DEVOLUCION) -> escanearon ambos QR
    res_ev = await db.execute(
        select(RfidEvento).where(
            RfidEvento.timestamp >= inicio,
            RfidEvento.tipo_evento.in_(["RETIRO_PC", "DEVOLUCION_PC"]),
        )
    )
    completos = set()
    for e in res_ev.scalars().all():
        if e.detalles and e.detalles.get("alumno_id") is not None:
            completos.add(e.detalles["alumno_id"])

    # 3. QrToken reclamados hoy (escanearon el QR dinamico)
    res_tk = await db.execute(select(QrToken).where(QrToken.used_at >= inicio, QrToken.used_at <= fin))
    reclamados = {t.alumno_id for t in res_tk.scalars().all() if t.used_at is not None}

    # 4. Lecturas RFID de hoy (pasaron por la antena de la puerta)
    res_lect = await db.execute(select(LecturaRFID).where(LecturaRFID.timestamp >= inicio))
    lecturas_hoy = {l.tag_rfid for l in res_lect.scalars().all()}

    resultados = []
    for al in alumnos:
        tag = al.computadora.tag_rfid if al.computadora else None
        completo = al.id_alumnos in completos
        reclamo = al.id_alumnos in reclamados
        antena = bool(tag and tag in lecturas_hoy)

        if completo:
            estado = "AMBOS"
        elif reclamo:
            estado = "FALTA_QRFISICO"
        elif antena:
            estado = "NO_ESCANEO_NINGUN_QR"
        else:
            estado = "SIN_ACTIVIDAD"

        resultados.append(
            {
                "id_alumno": al.id_alumnos,
                "alumno": f"{al.persona.nombre} {al.persona.apellido}" if al.persona else "Desconocido",
                "dni": al.persona.dni if al.persona else None,
                "carrera": al.carrera.nombre if al.carrera else None,
                "computadora_tag": tag,
                "computadora_modelo": al.computadora.modelo if al.computadora else None,
                "completo_hoy": completo,
                "reclamo_hoy": reclamo,
                "paso_por_antena_hoy": antena,
                "estado": estado,
            }
        )

    resultados.sort(key=lambda x: (x["estado"] != "NO_ESCANEO_NINGUN_QR", x["alumno"]))
    return resultados


class RegistroQrDinamico(BaseModel):
    id: int
    hora_generacion: str
    hora_uso: str | None = None
    estado: str  # USADO
    alumno_nombre: str | None = None
    preceptor_usuario: str | None = None
    qr_fisico_escaneado: bool = False
    tipo_operacion: str | None = None  # RETIRO | DEVOLUCION | PENDIENTE
    computadora: str | None = None


class RegistroFisicoAlumno(BaseModel):
    id_alumno: int
    alumno: str
    dni: str | None = None
    computadora_modelo: str | None = None
    computadora_tag: str | None = None
    estado: str  # RETIRO_OK | DEVOLUCION_OK | FALTA_QRFISICO | NO_ESCANEO_NINGUN_QR | SIN_ACTIVIDAD
    tipo_operacion: str | None = None  # RETIRO | DEVOLUCION | PENDIENTE | None
    qr_fisico_escaneado: bool = False
    hora_ultimo_evento: str | None = None


class RegistrosQRResponse(BaseModel):
    dinamicos: list[RegistroQrDinamico]
    fisicos: list[RegistroFisicoAlumno]


@router.get("/registros-qr", response_model=RegistrosQRResponse)
async def obtener_registros_qr(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Estado de hoy de los QRs dinamicos y fisicos por alumno."""
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="Solo administradores y preceptores pueden ver los registros QR")

    hoy = date.today()
    inicio = datetime.combine(hoy, dtime.min)
    fin = datetime.combine(hoy, dtime.max)

    # 1. Eventos RFID de hoy para mapear QRs dinámicos y físicos
    res_ev = await db.execute(
        select(RfidEvento).where(
            RfidEvento.timestamp >= inicio,
            RfidEvento.tipo_evento.in_(["RETIRO_PC", "DEVOLUCION_PC"]),
        ).order_by(RfidEvento.timestamp.asc())
    )
    eventos = res_ev.scalars().all()
    
    # Mapeo de eventos por hash de QR dinámico y por alumno
    eventos_por_hash = {}
    ultimo_evento_alumno = {}
    for e in eventos:
        al_id = e.detalles.get("alumno_id") if e.detalles else None
        token_h = e.detalles.get("qr_dinamico_hash") if e.detalles else None
        if token_h:
            eventos_por_hash[token_h] = e
        if al_id is not None:
            ultimo_evento_alumno[al_id] = e

    # --- QRs dinamicos de hoy (SOLO ESCANEADOS POR ALUMNOS) ---
    res_tokens = await db.execute(
        select(QrToken)
        .where(
            QrToken.created_at >= inicio,
            QrToken.created_at <= fin,
            QrToken.used_at.is_not(None),  # Solo QRs que fueron escaneados
        )
        .order_by(QrToken.used_at.desc())
    )
    tokens = res_tokens.scalars().all()

    preceptor_ids = {t.preceptor_id for t in tokens if t.preceptor_id is not None}
    preceptores_map = {}
    if preceptor_ids:
        res_prec = await db.execute(select(User).where(User.id.in_(preceptor_ids)))
        for p in res_prec.scalars().all():
            preceptores_map[p.id] = p.username

    alumno_ids = {t.alumno_id for t in tokens if t.alumno_id is not None}
    alumnos_map = {}
    if alumno_ids:
        res_alumnos = await db.execute(
            select(Alumno)
            .options(selectinload(Alumno.persona), selectinload(Alumno.computadora))
            .where(Alumno.id_alumnos.in_(alumno_ids))
        )
        for a in res_alumnos.scalars().all():
            alumnos_map[a.id_alumnos] = a

    dinamicos = []
    for t in tokens:
        al = alumnos_map.get(t.alumno_id)
        al_nombre = f"{al.persona.nombre} {al.persona.apellido}" if al and al.persona else "Desconocido"
        
        # Buscar si completó el escaneo físico
        evento_asoc = eventos_por_hash.get(t.token_hash)
        if not evento_asoc and t.alumno_id:
            ev_al = ultimo_evento_alumno.get(t.alumno_id)
            if ev_al and ev_al.timestamp >= t.used_at:
                evento_asoc = ev_al

        qr_fisico_ok = bool(evento_asoc)
        tipo_op = "RETIRO" if evento_asoc and evento_asoc.tipo_evento == "RETIRO_PC" else \
                  "DEVOLUCION" if evento_asoc and evento_asoc.tipo_evento == "DEVOLUCION_PC" else \
                  "PENDIENTE"
        
        pc_info = None
        if evento_asoc:
            pc_info = f"{evento_asoc.tag_rfid}"
            if al and al.computadora and al.computadora.modelo:
                pc_info = f"{al.computadora.modelo} ({evento_asoc.tag_rfid})"
        elif al and al.computadora:
            pc_info = f"{al.computadora.modelo or 'Notebook'} ({al.computadora.tag_rfid or 'S/N'})"

        dinamicos.append(
            RegistroQrDinamico(
                id=t.id,
                hora_generacion=t.created_at.isoformat(),
                hora_uso=t.used_at.isoformat() if t.used_at else None,
                estado="USADO",
                alumno_nombre=al_nombre,
                preceptor_usuario=preceptores_map.get(t.preceptor_id),
                qr_fisico_escaneado=qr_fisico_ok,
                tipo_operacion=tipo_op,
                computadora=pc_info,
            )
        )

    # --- Estado fisico por alumno ---
    res_al = await db.execute(
        select(Alumno)
        .options(
            selectinload(Alumno.persona),
            selectinload(Alumno.computadora),
            selectinload(Alumno.carrera),
        )
    )
    alumnos = res_al.scalars().all()

    res_tk = await db.execute(select(QrToken).where(QrToken.used_at >= inicio, QrToken.used_at <= fin))
    reclamados = {t.alumno_id for t in res_tk.scalars().all() if t.used_at is not None}

    res_lect = await db.execute(select(LecturaRFID).where(LecturaRFID.timestamp >= inicio))
    lecturas_hoy = {lect.tag_rfid for lect in res_lect.scalars().all()}

    fisicos = []
    for al in alumnos:
        tag = al.computadora.tag_rfid if al.computadora else None
        ev_reciente = ultimo_evento_alumno.get(al.id_alumnos)
        reclamo = al.id_alumnos in reclamados
        antena = bool(tag and tag in lecturas_hoy)

        if ev_reciente:
            estado = "DEVOLUCION_OK" if ev_reciente.tipo_evento == "DEVOLUCION_PC" else "RETIRO_OK"
            tipo_op = "DEVOLUCION" if ev_reciente.tipo_evento == "DEVOLUCION_PC" else "RETIRO"
            qr_fisico_ok = True
        elif reclamo:
            estado = "FALTA_QRFISICO"
            tipo_op = "PENDIENTE"
            qr_fisico_ok = False
        elif antena:
            estado = "NO_ESCANEO_NINGUN_QR"
            tipo_op = None
            qr_fisico_ok = False
        else:
            estado = "SIN_ACTIVIDAD"
            tipo_op = None
            qr_fisico_ok = False

        ultimo_time = ev_reciente.timestamp if ev_reciente else None
        fisicos.append(
            RegistroFisicoAlumno(
                id_alumno=al.id_alumnos,
                alumno=f"{al.persona.nombre} {al.persona.apellido}" if al.persona else "Desconocido",
                dni=al.persona.dni if al.persona else None,
                computadora_modelo=al.computadora.modelo if al.computadora else None,
                computadora_tag=tag,
                estado=estado,
                tipo_operacion=tipo_op,
                qr_fisico_escaneado=qr_fisico_ok,
                hora_ultimo_evento=ultimo_time.isoformat() if ultimo_time else None,
            )
        )

    fisicos.sort(key=lambda x: (x.estado != "NO_ESCANEO_NINGUN_QR", x.alumno))
    return RegistrosQRResponse(dinamicos=dinamicos, fisicos=fisicos)
