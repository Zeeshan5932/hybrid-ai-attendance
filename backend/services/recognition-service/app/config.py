from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    REDIS_HOST: str
    REDIS_PORT: int
    MATCH_THRESHOLD: float = 0.75
    PORT: int = 8003

    class Config:
        env_file = ".env"


settings = Settings()
