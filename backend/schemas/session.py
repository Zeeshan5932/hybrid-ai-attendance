from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SessionCreate(BaseModel):
    session_id: str
    name: Optional[str] = None
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[str] = None
    section: Optional[str] = None


class SessionOut(BaseModel):
    session_id: str
    name: Optional[str]
    subject_code: Optional[str]
    subject_name: Optional[str]
    department: Optional[str]
    semester: Optional[str]
    section: Optional[str]
    status: str
    created_by: Optional[str]
    created_at: datetime
    ended_at: Optional[datetime]

    class Config:
        from_attributes = True

