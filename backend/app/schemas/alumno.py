from pydantic import BaseModel, EmailStr
from typing import Optional

class AlumnoCreate(BaseModel):
    nombre: str
    apellido: str
    dni: str
    correo: EmailStr
    password: Optional[str] = None
    anio_en_curso: int
    id_carrera: int
    id_computadora: Optional[int] = None

class AlumnoUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    dni: Optional[str] = None
    correo: Optional[EmailStr] = None
    anio_en_curso: Optional[int] = None
    id_carrera: Optional[int] = None
    id_computadora: Optional[int] = None

class AlumnoRead(BaseModel):
    id_alumnos: int
    id_persona: int
    nombre: str | None = None
    apellido: str | None = None
    dni: str | None = None
    correo: str | None = None
    anio_en_curso: int | None = None
    id_carrera: int | None = None
    carrera_nombre: str | None = None
    id_computadora: int | None = None
    computadora_tag: str | None = None

    model_config = {"from_attributes": True}
