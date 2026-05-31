from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DetalleMant(Base):
    __tablename__ = "detalle_mant"

    id_detalle_mant: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    descripcion: Mapped[str | None] = mapped_column(String(200), nullable=True)
