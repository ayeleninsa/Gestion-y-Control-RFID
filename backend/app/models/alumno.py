from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Alumno(Base):
    __tablename__ = "alumnos"
    __table_args__ = {'extend_existing': True}

    id_alumnos: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_computadoras: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("Computadoras.id_computadoras"), nullable=True
    )
    id_persona: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("Persona.id_persona"), nullable=True
    )
    id_carrera: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("carreras.id_carrera"), nullable=True
    )
    anio_en_curso: Mapped[int | None] = mapped_column(Integer, nullable=True)

    computadora = relationship("Computadoras", lazy="selectin")
    persona = relationship("Persona", lazy="selectin")
    carrera = relationship("Carrera", back_populates="alumnos", lazy="selectin")
