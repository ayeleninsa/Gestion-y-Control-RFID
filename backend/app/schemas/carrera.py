from pydantic import BaseModel, ConfigDict

class CarreraBase(BaseModel):
    nombre: str | None = None
    año: str | None = None

class CarreraCreate(CarreraBase):
    pass

class CarreraUpdate(CarreraBase):
    pass

class CarreraRead(CarreraBase):
    id_carrera: int

    model_config = ConfigDict(from_attributes=True)
