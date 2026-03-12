from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SubjectCreate(BaseModel):
    code: str
    name: str
    department: Optional[str] = None
    semester: Optional[str] = None
    credit_hours: Optional[str] = None


class SubjectOut(SubjectCreate):
    id: int
    created_by: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
