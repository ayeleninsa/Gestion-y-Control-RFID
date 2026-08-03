from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Persona(Base):
    __tablename__ = "Persona"

    id_persona: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str | None] = mapped_column(String(100), nullable=True)
    apellido: Mapped[str | None] = mapped_column(String(100), nullable=True)
    dni: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    correo: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
