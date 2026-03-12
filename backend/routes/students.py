from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db import get_db
from core.security import require_teacher, get_current_user
from models.student import Student
from schemas.student import StudentCreate, StudentOut

router = APIRouter()


def _student_dict(s: Student) -> dict:
    return {
        "id": s.id,
        "student_code": s.student_code,
        "full_name": s.full_name,
        "department": s.department,
        "face_embedding_id": s.face_embedding_id,
        # Convenience flag: True when a face embedding has been stored
        "has_face": bool(s.face_embedding_id),
    }


@router.post("/", response_model=StudentOut)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    _t: dict = Depends(require_teacher),
):
    existing = db.query(Student).filter(Student.student_code == payload.student_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student already exists")
    student = Student(**payload.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.get("/")
def list_students(
    db: Session = Depends(get_db),
    _u: dict = Depends(get_current_user),
):
    """Any authenticated user can list students."""
    return [_student_dict(s) for s in db.query(Student).all()]


@router.get("/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    _u: dict = Depends(get_current_user),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return _student_dict(student)


@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    _t: dict = Depends(require_teacher),
):
    """Teacher-only: remove a student record."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()
    return {"message": "Student deleted"}

