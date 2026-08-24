import ssl

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


def _connect_args() -> dict:
    """Argumentos de conexion para proveedores gestionados (Supabase, Render, etc.)."""
    args: dict = {}
    if settings.db_ssl:
        # Equivalente a sslmode=require: canal cifrado sin verificacion de CA.
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        args["ssl"] = ctx
    if settings.db_statement_cache_size is not None:
        # Requerido en poolers en modo transaction (ej. Supabase puerto 6543).
        args["statement_cache_size"] = settings.db_statement_cache_size
    return args


def crear_engine(url: str | None = None):
    """Crea el engine async aplicando SSL/statement cache segun configuracion."""
    return create_async_engine(
        url or settings.database_url,
        echo=False,
        connect_args=_connect_args(),
    )


engine = crear_engine()
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
