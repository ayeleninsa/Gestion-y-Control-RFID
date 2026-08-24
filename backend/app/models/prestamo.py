from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Prestamo(Base):
    __tablename__ = "prestamos"

    id_prestamo: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_alumnos: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("alumnos.id_alumnos"), nullable=True
    )
    id_computadoras: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("Computadoras.id_computadoras"), nullable=True
    )
    fecha_prestamo: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    fecha_devolucion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="Prestado", nullable=False)

    alumno = relationship("Alumno", lazy="selectin")
    computadora = relationship("Computadoras", lazy="selectin")