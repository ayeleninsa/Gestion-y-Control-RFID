from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/rfid_db"
    jwt_secret_key: str = "changeme_secret_key_32chars_min"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = "http://localhost:5173"
    log_level: str = "INFO"


settings = Settings()
