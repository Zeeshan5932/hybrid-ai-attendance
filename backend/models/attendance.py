from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from core.db import Base


class AttendanceEvent(Base):
    __tablename__ = "attendance_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, nullable=False, index=True)
    student_id = Column(String, nullable=False, index=True)
    detected_at = Column(DateTime, default=datetime.utcnow)


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, nullable=False, index=True)
    student_id = Column(String, nullable=False, index=True)
    # Denormalized for instant display without joins
    subject_code = Column(String, nullable=True, index=True)
    student_name = Column(String, nullable=True)
    father_name = Column(String, nullable=True)
    status = Column(String, default="pending")
    marked_at = Column(DateTime, default=datetime.utcnow)
