from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from core.db import Base


class AttendanceSession(Base):
    """
    A teacher-created class session for a specific subject.
    Attendance events are only accepted while status == 'active'.
    """
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)             # friendly display name

    # Academic context (denormalised for query convenience)
    subject_code = Column(String, nullable=True, index=True)
    subject_name = Column(String, nullable=True)
    department = Column(String, nullable=True)
    semester = Column(String, nullable=True)
    section = Column(String, nullable=True)

    status = Column(String, default="active")         # "active" | "ended"
    created_by = Column(String, nullable=True)        # teacher username
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

