from pydantic import BaseModel


class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "teacher"


class LoginRequest(BaseModel):
    username: str
    password: str
