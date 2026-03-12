from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from core.db import Base


class Subject(Base):
    """Courses / subjects managed by teachers."""
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)   # e.g. "CS301"
    name = Column(String, nullable=False)                             # e.g. "Data Structures"
    department = Column(String, nullable=True)
    semester = Column(String, nullable=True)                          # e.g. "4th"
    credit_hours = Column(String, nullable=True)                      # e.g. "3"
    created_by = Column(String, nullable=True)                        # teacher username
    created_at = Column(DateTime, default=datetime.utcnow)
