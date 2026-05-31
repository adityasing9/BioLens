import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "BioLens AI"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    DATABASE_URL: str = "mysql+pymysql://root:root_secure_pass@localhost:3306/biolens_db"
    
    # Security Configuration
    JWT_SECRET_KEY: str = "89c3132049e0c7a52e12e84d436cf97920ab4c10cbfb9d6a5789f2db485d41a0"
    JWT_REFRESH_SECRET_KEY: str = "8fca9938b813cfca84a29a43a0f72ba08cd19e34a6ef249e9cfab81d9f485db1"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # AI Provider configurations (OpenRouter takes priority if set)
    GEMINI_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""

    # File uploads boundaries
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 15

    model_config = ConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8"
    )

settings = Settings()

# Ensure uploads folder is present
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
