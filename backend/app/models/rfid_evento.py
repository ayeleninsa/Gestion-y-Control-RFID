from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RfidEvento(Base):
    __tablename__ = "rfid_eventos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tag_rfid: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    lector_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("rfid_lectores.id"), nullable=True
    )
    tipo_evento: Mapped[str] = mapped_column(String(50), nullable=False)
    detalles: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
