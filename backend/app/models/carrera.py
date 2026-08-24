from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Carrera(Base):
    __tablename__ = "carreras"
    __table_args__ = {'extend_existing': True}

    id_carrera: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str | None] = mapped_column(String(100), nullable=True)
    año: Mapped[str | None] = mapped_column(String(255), nullable=True)

    alumnos = relationship("Alumno", back_populates="carrera", lazy="selectin")
