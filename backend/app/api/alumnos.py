import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.security import hash_password
from app.models.alumno import Alumno
from app.models.persona import Persona
from app.models.user import User
from app.models.carrera import Carrera
from app.models.computadoras import Computadoras
from app.schemas.alumno import AlumnoCreate, AlumnoRead, AlumnoUpdate
import pandas as pd

router = APIRouter(prefix="/api/alumnos", tags=["Alumnos"])

def _to_read_schema(alumno: Alumno) -> AlumnoRead:
    return AlumnoRead(
        id_alumnos=alumno.id_alumnos,
        id_persona=alumno.id_persona,
        nombre=alumno.persona.nombre if alumno.persona else None,
        apellido=alumno.persona.apellido if alumno.persona else None,
        dni=alumno.persona.dni if alumno.persona else None,
        correo=alumno.persona.correo if alumno.persona else None,
        anio_en_curso=alumno.anio_en_curso,
        id_carrera=alumno.id_carrera,
        carrera_nombre=alumno.carrera.nombre if alumno.carrera else None,
        id_computadora=alumno.id_computadoras,
        computadora_tag=alumno.computadora.tag_rfid if alumno.computadora else None,
    )

@router.get("/", response_model=list[AlumnoRead])
async def get_alumnos(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="Acceso denegado")
        
    result = await db.execute(
        select(Alumno).options(
            selectinload(Alumno.persona),
            selectinload(Alumno.carrera),
            selectinload(Alumno.computadora)
        )
    )
    alumnos = result.scalars().all()
    return [_to_read_schema(a) for a in alumnos]

@router.post("/", response_model=AlumnoRead, status_code=201)
async def create_alumno(data: AlumnoCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="Acceso denegado")

    # Check if persona exists by DNI or Email
    result = await db.execute(select(Persona).where((Persona.dni == data.dni) | (Persona.correo == data.correo)))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="DNI o Correo ya registrado en Persona")

    # Check if carrera exists
    if data.id_carrera is not None:
        carrera_res = await db.execute(select(Carrera).where(Carrera.id_carrera == data.id_carrera))
        if not carrera_res.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"La carrera seleccionada (ID: {data.id_carrera}) no existe")

    persona = Persona(
        nombre=data.nombre,
        apellido=data.apellido,
        dni=data.dni,
        correo=data.correo
    )
    db.add(persona)
    await db.flush() # get persona.id_persona

    raw_password = data.password if data.password else data.dni
    user = User(
        email=data.correo,
        username=data.correo.split("@")[0] + "_" + data.dni[-4:],
        password_hash=hash_password(raw_password),
        rol="alumno",
        id_persona=persona.id_persona,
        must_change_password=True
    )
    db.add(user)

    alumno = Alumno(
        id_persona=persona.id_persona,
        id_carrera=data.id_carrera,
        anio_en_curso=data.anio_en_curso,
        id_computadoras=data.id_computadora
    )
    db.add(alumno)
    await db.commit()
    
    # Reload with relations
    result = await db.execute(
        select(Alumno).options(
            selectinload(Alumno.persona),
            selectinload(Alumno.carrera),
            selectinload(Alumno.computadora)
        ).where(Alumno.id_alumnos == alumno.id_alumnos)
    )
    return _to_read_schema(result.scalar_one())

@router.post("/import")
async def import_alumnos(file: UploadFile = File(...), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="Acceso denegado")
        
    contents = await file.read()
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
            
        # Expected columns: nombre, apellido, dni, correo, anio_en_curso, id_carrera
        required_cols = ["nombre", "apellido", "dni", "correo", "anio_en_curso", "id_carrera"]
        for col in required_cols:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"Columna faltante: {col}")
                
        imported_count = 0
        for _, row in df.iterrows():
            dni = str(row['dni'])
            correo = str(row['correo'])
            
            # Skip existing
            res = await db.execute(select(Persona).where((Persona.dni == dni) | (Persona.correo == correo)))
            if res.scalar_one_or_none():
                continue
                
            persona = Persona(
                nombre=str(row['nombre']),
                apellido=str(row['apellido']),
                dni=dni,
                correo=correo
            )
            db.add(persona)
            await db.flush()
            
            user = User(
                email=correo,
                username=correo.split("@")[0] + "_" + dni[-4:],
                password_hash=hash_password(dni),
                rol="alumno",
                id_persona=persona.id_persona,
                must_change_password=True
            )
            db.add(user)
            
            carrera_id = int(row['id_carrera'])
            carrera_res = await db.execute(select(Carrera).where(Carrera.id_carrera == carrera_id))
            if not carrera_res.scalar_one_or_none():
                raise HTTPException(status_code=400, detail=f"La carrera (ID: {carrera_id}) para el alumno {dni} no existe")

            alumno = Alumno(
                id_persona=persona.id_persona,
                id_carrera=carrera_id,
                anio_en_curso=int(row['anio_en_curso']),
                id_computadoras=None
            )
            db.add(alumno)
            imported_count += 1
            
        await db.commit()
        return {"message": f"Se importaron {imported_count} alumnos correctamente"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error procesando archivo: {str(e)}")

@router.delete("/{id}")
async def delete_alumno(id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="Acceso denegado")
        
    result = await db.execute(select(Alumno).where(Alumno.id_alumnos == id))
    alumno = result.scalar_one_or_none()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
        
    persona_id = alumno.id_persona
        
    # Delete user if exists
    if persona_id:
        await db.execute(delete(User).where(User.id_persona == persona_id))
        
    # Delete alumno
    await db.execute(delete(Alumno).where(Alumno.id_alumnos == id))
    
    # Delete persona
    if persona_id:
        await db.execute(delete(Persona).where(Persona.id_persona == persona_id))
        
    await db.commit()
    return {"message": "Alumno eliminado"}

@router.put("/{id}", response_model=AlumnoRead)
async def update_alumno(id: int, data: AlumnoUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.rol not in ("admin", "preceptor"):
        raise HTTPException(status_code=403, detail="Acceso denegado")
        
    result = await db.execute(select(Alumno).options(selectinload(Alumno.persona)).where(Alumno.id_alumnos == id))
    alumno = result.scalar_one_or_none()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
        
    if data.anio_en_curso is not None:
        alumno.anio_en_curso = data.anio_en_curso
    if data.id_carrera is not None:
        alumno.id_carrera = data.id_carrera
    if data.id_computadora is not None:
        alumno.id_computadoras = data.id_computadora
        
    if alumno.persona:
        if data.nombre is not None:
            alumno.persona.nombre = data.nombre
        if data.apellido is not None:
            alumno.persona.apellido = data.apellido
        if data.dni is not None:
            alumno.persona.dni = data.dni
        if data.correo is not None:
            alumno.persona.correo = data.correo
            
    await db.commit()
    
    result = await db.execute(
        select(Alumno).options(
            selectinload(Alumno.persona),
            selectinload(Alumno.carrera),
            selectinload(Alumno.computadora)
        ).where(Alumno.id_alumnos == id)
    )
    return _to_read_schema(result.scalar_one())

