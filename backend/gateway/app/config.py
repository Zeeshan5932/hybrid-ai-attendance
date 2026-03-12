from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    AUTH_SERVICE_URL: str
    STUDENT_SERVICE_URL: str
    RECOGNITION_SERVICE_URL: str
    ATTENDANCE_SERVICE_URL: str
    PORT: int = 8000

    class Config:
        env_file = ".env"


settings = Settings()
