import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from datetime import date

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.alumno import Alumno
from app.models.computadoras import Computadoras
from app.models.rfid_evento import RfidEvento

router = APIRouter(prefix="/api/qr", tags=["QR Events"])

class DynamicQRResponse(BaseModel):
    qr_token: str
    expires_in: int = 60

class ValidateDualQRRequest(BaseModel):
    qr_fisico: str
    qr_dinamico: str

class ValidateDualQRResponse(BaseModel):
    status: str
    message: str
    alumno_nombre: str | None = None
    computadora_tag: str | None = None
    evento_tipo: str

@router.get("/dynamic", response_model=DynamicQRResponse)
async def generate_dynamic_qr(current_user: User = Depends(get_current_user)):
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="Solo preceptores y admins pueden generar QR dinámico")
        
    # Generate token valid for 60 seconds
    token_data = {
        "sub": str(current_user.id),
        "type": "dynamic_qr",
        "exp": int(time.time()) + 60
    }
    
    from jose import jwt
    from app.core.config import settings
    
    encoded_jwt = jwt.encode(token_data, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    
    return DynamicQRResponse(qr_token=encoded_jwt)


@router.post("/validar", response_model=ValidateDualQRResponse)
async def validar_retiro_devolucion(
    data: ValidateDualQRRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.rol != "alumno":
        raise HTTPException(status_code=403, detail="Solo los alumnos pueden validar el retiro/devolución")
        
    # 1. Verify Dynamic QR (Preceptor's token)
    from jose import jwt, JWTError
    from app.core.config import settings
    try:
        payload = jwt.decode(data.qr_dinamico, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        if payload.get("type") != "dynamic_qr":
            raise HTTPException(status_code=400, detail="Token QR inválido")
            
    except JWTError:
        raise HTTPException(status_code=400, detail="QR dinámico inválido o expirado")
        
    preceptor_id = int(payload.get("sub"))
    
    # 2. Get Alumno (current user)
    if not current_user.id_persona:
        raise HTTPException(status_code=404, detail="Usuario alumno no tiene perfil de persona")
        
    res_alumno = await db.execute(
        select(Alumno)
        .options(selectinload(Alumno.persona))
        .where(Alumno.id_persona == current_user.id_persona)
    )
    alumno = res_alumno.scalar_one_or_none()
    if not alumno:
        raise HTTPException(status_code=404, detail="Registro de alumno no encontrado")
        
    # 3. Get Computadora from Physical QR
    res_pc = await db.execute(select(Computadoras).where(Computadoras.tag_rfid == data.qr_fisico))
    computadora = res_pc.scalar_one_or_none()
    
    if not computadora:
        raise HTTPException(status_code=404, detail="Computadora no registrada")
        
    # 4. Check if assigned
    if alumno.id_computadoras != computadora.id_computadoras:
        raise HTTPException(status_code=400, detail="Esta computadora no está asignada a este alumno")
        
    # 5. Determine Event (Retiro or Devolucion)
    # We could check the last event or computer status. Let's toggle status for simplicity.
    tipo = "RETIRO_PC"
    if computadora.estado == "EN_USO":
        tipo = "DEVOLUCION_PC"
        computadora.estado = "DISPONIBLE"
    else:
        computadora.estado = "EN_USO"
        
    # 6. Log Event
    evento = RfidEvento(
        tag_rfid=computadora.tag_rfid,
        tipo_evento=tipo,
        detalles={"alumno_id": alumno.id_alumnos, "preceptor_id": preceptor_id}
    )
    db.add(evento)
    
    await db.commit()
    
    nombre_completo = f"{alumno.persona.nombre} {alumno.persona.apellido}" if alumno.persona else "Desconocido"
    
    return ValidateDualQRResponse(
        status="success",
        message=f"Validación exitosa: {tipo}",
        alumno_nombre=nombre_completo,
        computadora_tag=computadora.tag_rfid,
        evento_tipo=tipo
    )


class RegistroHoyResponse(BaseModel):
    id: int
    timestamp: str
    tipo_evento: str
    tag_rfid: str
    alumno_nombre: str
    alumno_apellido: str
    alumno_dni: str
    computadora_marca: str
    computadora_modelo: str
    computadora_nro_serie: str
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
            "computadora_marca": alumno.computadora.marca if alumno and alumno.computadora else "",
            "computadora_modelo": alumno.computadora.modelo if alumno and alumno.computadora else "",
            "computadora_nro_serie": alumno.computadora.nro_serie if alumno and alumno.computadora else "N/A",
            "tipo_qr": evt.detalles.get("tipo_qr", "Dual (Físico + Dinámico)") if evt.detalles else "Dual (Físico + Dinámico)"
        })
        
    return resultados
