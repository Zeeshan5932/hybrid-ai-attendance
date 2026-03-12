from sqlalchemy import Column, Integer, String
from .db import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_code = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    department = Column(String, nullable=True)
    face_embedding_id = Column(String, nullable=True)
