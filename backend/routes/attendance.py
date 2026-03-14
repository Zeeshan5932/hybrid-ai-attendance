from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.db import get_db
from core.security import require_teacher, get_current_user
from models.attendance import AttendanceEvent, AttendanceRecord
from models.session import AttendanceSession
from models.student import Student
from schemas.attendance import DetectionEventIn
from services.attendance_rules import apply_physical_attendance_rule

router = APIRouter()


def _enrich_records(rows: list, db: Session) -> list:
    """
    Batch-load sessions and students so every returned record has the full set
    of denormalized fields even for rows created before those columns existed.
    """
    if not rows:
        return []

    session_ids = {r.session_id for r in rows}
    student_ids = {r.student_id for r in rows}

    sessions = {
        s.session_id: s
        for s in db.query(AttendanceSession)
        .filter(AttendanceSession.session_id.in_(session_ids))
        .all()
    }
    students = {
        s.student_code: s
        for s in db.query(Student)
        .filter(Student.student_code.in_(student_ids))
        .all()
    }

    result = []
    for r in rows:
        sess = sessions.get(r.session_id)
        stu = students.get(r.student_id)
        result.append({
            "id": r.id,
            "session_id": r.session_id,
            "student_id": r.student_id,
            "subject_code": r.subject_code or (sess.subject_code if sess else None),
            "subject_name": r.subject_name or (sess.subject_name if sess else None),
            "department":   r.department   or (sess.department   if sess else None),
            "semester":     r.semester     or (sess.semester     if sess else None),
            "section":      r.section      or (sess.section      if sess else None),
            "student_name": r.student_name or (stu.full_name     if stu  else r.student_id),
            "father_name":  r.father_name  or (stu.father_name   if stu  else None),
            "status":       r.status,
            "marked_at":    r.marked_at.isoformat() if r.marked_at else None,
        })
    return result


@router.post("/detect")
def create_detection_event(
    payload: DetectionEventIn,
    db: Session = Depends(get_db),
    _t: dict = Depends(require_teacher),
):
    session = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.session_id == payload.session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{payload.session_id}' not found.")
    if session.status != "active":
        raise HTTPException(status_code=409, detail=f"Session '{payload.session_id}' has ended.")

    student = (
        db.query(Student)
        .filter(Student.student_code == payload.student_id)
        .first()
    )

    return apply_physical_attendance_rule(
        db,
        session_id=payload.session_id,
        student_id=payload.student_id,
        subject_code=session.subject_code,
        subject_name=session.subject_name,
        department=session.department,
        semester=session.semester,
        section=session.section,
        student_name=student.full_name if student else payload.student_id,
        father_name=student.father_name if student else None,
    )


@router.get("/sessions")
def list_sessions_for_dropdown(
    db: Session = Depends(get_db),
    _u: dict = Depends(get_current_user),
):
    rows = (
        db.query(AttendanceSession)
        .order_by(AttendanceSession.created_at.desc())
        .limit(200)
        .all()
    )
    return [
        {
            "session_id":  r.session_id,
            "name":        r.name,
            "subject_code": r.subject_code,
            "subject_name": r.subject_name,
            "department":  r.department,
            "semester":    r.semester,
            "section":     r.section,
            "status":      r.status,
            "created_at":  r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.get("/records/{session_id}")
def get_records(
    session_id: str,
    db: Session = Depends(get_db),
    _u: dict = Depends(get_current_user),
):
    rows = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.session_id == session_id)
        .order_by(AttendanceRecord.marked_at.desc())
        .all()
    )
    return _enrich_records(rows, db)


@router.get("/by-subject/{subject_code}")
def get_records_by_subject(
    subject_code: str,
    db: Session = Depends(get_db),
    _u: dict = Depends(get_current_user),
):
    rows = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.subject_code == subject_code)
        .order_by(AttendanceRecord.marked_at.desc())
        .all()
    )
    return _enrich_records(rows, db)


@router.get("/by-student/{student_code}")
def get_records_by_student(
    student_code: str,
    db: Session = Depends(get_db),
    _u: dict = Depends(get_current_user),
):
    rows = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.student_id == student_code)
        .order_by(AttendanceRecord.marked_at.desc())
        .all()
    )
    return _enrich_records(rows, db)


@router.get("/my-records")
def my_records(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    username = user.get("sub", "")
    rows = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.student_id == username)
        .order_by(AttendanceRecord.marked_at.desc())
        .all()
    )
    return _enrich_records(rows, db)


@router.get("/stats")
def attendance_stats(
    db: Session = Depends(get_db),
    _t: dict = Depends(require_teacher),
):
    total = db.query(AttendanceRecord).count()
    present = db.query(AttendanceRecord).filter(AttendanceRecord.status == "present").count()
    pending = db.query(AttendanceRecord).filter(AttendanceRecord.status == "pending").count()
    student_count = db.query(Student).count()
    return {
        "total_records": total,
        "present": present,
        "pending": pending,
        "absent": total - present - pending,
        "total_students": student_count,
    }
