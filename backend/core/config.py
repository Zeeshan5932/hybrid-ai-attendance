from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    MATCH_THRESHOLD: float = 0.75

    class Config:
        # In Docker: env vars come from docker-compose env_file.
        # Locally: running from backend/ so ../.env is the root .env.
        env_file = ("../.env", ".env")
        extra = "ignore"


settings = Settings()
