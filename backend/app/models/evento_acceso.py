from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EventoAcceso(Base):
    __tablename__ = "eventos_acceso"

    id_evento: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    camara_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("camaras.id_camara"), nullable=False
    )
    persona_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("Persona.id_persona"), nullable=True
    )
    tipo_evento: Mapped[str] = mapped_column(String(50), nullable=False)
    imagen_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    confianza_ia: Mapped[float | None] = mapped_column(Float, nullable=True)
    resultado: Mapped[str] = mapped_column(String(20), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    camara = relationship("Camara", lazy="joined")
