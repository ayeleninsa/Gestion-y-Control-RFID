from datetime import datetime

from pydantic import BaseModel


class CamaraRead(BaseModel):
    id_camara: int
    nombre: str
    ubicacion: str
    ip: str
    stream_url: str | None
    activa: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CamaraCreate(BaseModel):
    nombre: str
    ubicacion: str
    ip: str
    stream_url: str | None = None


class CamaraUpdate(BaseModel):
    nombre: str | None = None
    ubicacion: str | None = None
    ip: str | None = None
    stream_url: str | None = None
    activa: bool | None = None


class EventoAccesoRead(BaseModel):
    id_evento: int
    camara_id: int
    persona_id: int | None
    tipo_evento: str
    imagen_url: str | None
    confianza_ia: float | None
    resultado: str
    timestamp: datetime

    model_config = {"from_attributes": True}


class EventoAccesoCreate(BaseModel):
    camara_id: int
    persona_id: int | None = None
    tipo_evento: str
    imagen_url: str | None = None
    confianza_ia: float | None = None
