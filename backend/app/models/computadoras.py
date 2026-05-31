from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Computadoras(Base):
    __tablename__ = "Computadoras"

    id_computadoras: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    modelo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    estado: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tag_rfid: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    activa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    id_detalle_mant: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("detalle_mant.id_detalle_mant"), nullable=True
    )

    detalle_mant = relationship("DetalleMant", lazy="joined")
    lecturas = relationship("LecturaRFID", back_populates="computadora", lazy="selectin")
