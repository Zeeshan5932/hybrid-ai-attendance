from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db import get_db
from models.student import Student
from schemas.student import StudentCreate, StudentOut

router = APIRouter()


@router.post("/", response_model=StudentOut)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.student_code == payload.student_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student already exists")

    student = Student(**payload.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.get("/")
def list_students(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    return [
        {
            "id": s.id,
            "student_code": s.student_code,
            "full_name": s.full_name,
            "department": s.department,
            "face_embedding_id": s.face_embedding_id,
        }
        for s in students
    ]


@router.get("/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {
        "id": student.id,
        "student_code": student.student_code,
        "full_name": student.full_name,
        "department": student.department,
        "face_embedding_id": student.face_embedding_id,
    }
