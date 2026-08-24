from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/rfid_db"
    db_ssl: bool = False
    db_statement_cache_size: int | None = None
    jwt_secret_key: str = "changeme_secret_key_32chars_min"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = "http://localhost:5173"
    log_level: str = "INFO"
    simulador_enabled: bool = True

    @field_validator("database_url", mode="before")
    @classmethod
    def _forzar_driver_asyncpg(cls, v: str) -> str:
        """Normaliza URLs de proveedores (Render, Supabase) al driver asyncpg."""
        if not isinstance(v, str):
            return v
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v


settings = Settings()
