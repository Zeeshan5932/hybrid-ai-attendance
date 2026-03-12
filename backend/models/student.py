from sqlalchemy import Column, Integer, String
from core.db import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    # Academic identity
    student_code = Column(String, unique=True, nullable=False, index=True)  # roll number
    full_name = Column(String, nullable=False)
    father_name = Column(String, nullable=True)
    department = Column(String, nullable=True)
    semester = Column(String, nullable=True)   # e.g. "4th"
    section = Column(String, nullable=True)    # e.g. "A", "B"
    # Face recognition
    face_embedding_id = Column(String, nullable=True)
