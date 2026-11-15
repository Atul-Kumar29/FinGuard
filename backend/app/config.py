from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_SQLITE_DB = BASE_DIR / "app.db"

class Settings(BaseSettings):
    database_url: str = f"sqlite:///{DEFAULT_SQLITE_DB.as_posix()}"
    cors_origins: str = "http://localhost:3000"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def origins(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

settings = Settings()
