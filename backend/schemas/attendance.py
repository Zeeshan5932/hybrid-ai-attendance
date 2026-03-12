from pydantic import BaseModel
from datetime import datetime


class DetectionEventIn(BaseModel):
    session_id: str
    student_id: str
    detected_at: datetime | None = None
