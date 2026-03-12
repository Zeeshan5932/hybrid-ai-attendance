"""
Subject routes
==============
POST   /subjects/         — create subject (teacher-only)
GET    /subjects/         — list all subjects (authenticated)
PUT    /subjects/{id}     — update subject (teacher-only)
DELETE /subjects/{id}     — delete subject (teacher-only)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

from core.db import get_db
from core.security import require_teacher, get_current_user
from models.subject import Subject
from schemas.subject import SubjectCreate, SubjectOut

router = APIRouter()


def _dict(s: Subject) -> dict:
    return {
        "id": s.id,
        "code": s.code,
        "name": s.name,
        "department": s.department,
        "semester": s.semester,
        "credit_hours": s.credit_hours,
        "created_by": s.created_by,
        "created_at": s.created_at.isoformat(),
    }


@router.post("/", response_model=SubjectOut)
def create_subject(
    body: SubjectCreate,
    db: DbSession = Depends(get_db),
    user: dict = Depends(require_teacher),
):
    if db.query(Subject).filter(Subject.code == body.code).first():
        raise HTTPException(status_code=400, detail=f"Subject with code '{body.code}' already exists.")
    subj = Subject(**body.model_dump(), created_by=user.get("sub"))
    db.add(subj)
    db.commit()
    db.refresh(subj)
    return _dict(subj)


@router.get("/")
def list_subjects(
    db: DbSession = Depends(get_db),
    _u: dict = Depends(get_current_user),
):
    return [_dict(s) for s in db.query(Subject).order_by(Subject.code).all()]


@router.put("/{subject_id}")
def update_subject(
    subject_id: int,
    body: SubjectCreate,
    db: DbSession = Depends(get_db),
    _t: dict = Depends(require_teacher),
):
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(subj, field, value)
    db.commit()
    db.refresh(subj)
    return _dict(subj)


@router.delete("/{subject_id}")
def delete_subject(
    subject_id: int,
    db: DbSession = Depends(get_db),
    _t: dict = Depends(require_teacher),
):
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found.")
    db.delete(subj)
    db.commit()
    return {"message": "Subject deleted."}
