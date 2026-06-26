from datetime import datetime

from pydantic import BaseModel


class RfidLectorRead(BaseModel):
    id: int
    nombre: str
    ubicacion: str
    ip: str | None
    activo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RfidLectorCreate(BaseModel):
    nombre: str
    ubicacion: str
    ip: str | None = None


class RfidLectorUpdate(BaseModel):
    nombre: str | None = None
    ubicacion: str | None = None
    ip: str | None = None
    activo: bool | None = None


class RfidTagRead(BaseModel):
    id: int
    tag_rfid: str
    tipo: str
    estado: str
    id_computadoras: int | None
    fecha_asignacion: datetime | None
    fecha_baja: datetime | None
    notas: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class RfidTagCreate(BaseModel):
    tag_rfid: str
    tipo: str = "computadora"
    estado: str = "disponible"
    id_computadoras: int | None = None
    fecha_asignacion: datetime | None = None
    notas: str | None = None


class RfidTagUpdate(BaseModel):
    tipo: str | None = None
    estado: str | None = None
    id_computadoras: int | None = None
    fecha_asignacion: datetime | None = None
    fecha_baja: datetime | None = None
    notas: str | None = None


class RfidEventoRead(BaseModel):
    id: int
    tag_rfid: str
    lector_id: int | None
    tipo_evento: str
    detalles: dict | None
    timestamp: datetime

    model_config = {"from_attributes": True}


class RfidEventoCreate(BaseModel):
    tag_rfid: str
    lector_id: int | None = None
    tipo_evento: str
    detalles: dict | None = None
