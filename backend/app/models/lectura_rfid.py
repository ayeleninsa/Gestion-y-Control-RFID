from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LecturaRFID(Base):
    __tablename__ = "lectura_rfid"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tag_rfid: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    id_computadoras: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("Computadoras.id_computadoras"), nullable=True
    )
    lector_origen: Mapped[str | None] = mapped_column(String(100), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    computadora = relationship("Computadoras", back_populates="lecturas", lazy="joined")
