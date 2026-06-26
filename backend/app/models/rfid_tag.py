from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RfidTag(Base):
    __tablename__ = "rfid_tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tag_rfid: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False, default="computadora")
    estado: Mapped[str] = mapped_column(String(50), nullable=False, default="disponible")
    id_computadoras: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("Computadoras.id_computadoras"), nullable=True
    )
    fecha_asignacion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    fecha_baja: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notas: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
