from pydantic import BaseModel
from typing import Optional


class StudentCreate(BaseModel):
    student_code: str
    full_name: str
    department: Optional[str] = None
    face_embedding_id: Optional[str] = None


class StudentOut(StudentCreate):
    id: int

    class Config:
        from_attributes = True
