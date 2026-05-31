from datetime import datetime

from pydantic import BaseModel


class ComputadoraRead(BaseModel):
    id_computadoras: int
    modelo: str | None
    estado: str | None
    tag_rfid: str | None
    activa: bool
    id_detalle_mant: int | None

    model_config = {"from_attributes": True}


class ComputadoraCreate(BaseModel):
    modelo: str | None = None
    estado: str | None = None
    tag_rfid: str | None = None
    id_detalle_mant: int | None = None


class ComputadoraUpdate(BaseModel):
    modelo: str | None = None
    estado: str | None = None
    tag_rfid: str | None = None
    activa: bool | None = None
    id_detalle_mant: int | None = None


class LecturaRFIDRead(BaseModel):
    id: int
    tag_rfid: str
    id_computadoras: int | None
    lector_origen: str | None
    timestamp: datetime

    model_config = {"from_attributes": True}


class LecturaRFIDCreate(BaseModel):
    tag_rfid: str
    lector_origen: str | None = None
