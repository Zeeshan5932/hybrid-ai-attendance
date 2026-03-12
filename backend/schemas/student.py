from pydantic import BaseModel
from typing import Optional


class StudentCreate(BaseModel):
    student_code: str          # roll number
    full_name: str
    father_name: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[str] = None
    section: Optional[str] = None
    face_embedding_id: Optional[str] = None


class StudentOut(StudentCreate):
    id: int
    has_face: bool = False

    class Config:
        from_attributes = True
