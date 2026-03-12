from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.db import get_db
from core.security import require_teacher, get_current_user
from models.attendance import AttendanceEvent, AttendanceRecord
from schemas.attendance import DetectionEventIn
from services.attendance_rules import apply_physical_attendance_rule

router = APIRouter()


@router.post("/detect")
def create_detection_event(
    payload: DetectionEventIn,
    db: Session = Depends(get_db),
    _t: dict = Depends(require_teacher),
):
    """
    Record a face detection event for a student in a session.
    Teacher-only. Internally calls attendance_rules to decide 'present' or 'pending'.
    Attendance is marked 'present' after MIN_RECOGNITIONS detections within WINDOW_MINUTES.
    """
    event = AttendanceEvent(
        session_id=payload.session_id,
        student_id=payload.student_id,
        detected_at=payload.detected_at or datetime.utcnow(),
    )
    db.add(event)
    db.commit()
    return apply_physical_attendance_rule(db, payload.session_id, payload.student_id)


@router.get("/records/{session_id}")
def get_records(
    session_id: str,
    db: Session = Depends(get_db),
    _u: dict = Depends(get_current_user),
):
    """Get all attendance records for a session. Available to all authenticated users."""
    rows = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.session_id == session_id)
        .order_by(AttendanceRecord.marked_at.desc())
        .all()
    )
    return [
        {
            "session_id": row.session_id,
            "student_id": row.student_id,
            "status": row.status,
            "marked_at": row.marked_at.isoformat(),
        }
        for row in rows
    ]


@router.get("/my-records")
def my_records(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """
    Student endpoint: returns all attendance records where student_id matches
    the logged-in user's username (students register/login with their student_code).
    Students CANNOT mark their own attendance — that is AI + teacher-controlled only.
    """
    username = user.get("sub", "")
    rows = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.student_id == username)
        .order_by(AttendanceRecord.marked_at.desc())
        .all()
    )
    return [
        {
            "session_id": row.session_id,
            "student_id": row.student_id,
            "status": row.status,
            "marked_at": row.marked_at.isoformat(),
        }
        for row in rows
    ]


@router.get("/sessions")
def list_sessions(
    db: Session = Depends(get_db),
    _t: dict = Depends(require_teacher),
):
    """Teacher-only: list all distinct session IDs that have records."""
    sessions = db.query(AttendanceRecord.session_id).distinct().all()
    return [s[0] for s in sessions]


@router.get("/stats")
def attendance_stats(
    db: Session = Depends(get_db),
    _t: dict = Depends(require_teacher),
):
    """Teacher-only: quick stats for the dashboard overview cards."""
    total = db.query(AttendanceRecord).count()
    present = db.query(AttendanceRecord).filter(AttendanceRecord.status == "present").count()
    pending = db.query(AttendanceRecord).filter(AttendanceRecord.status == "pending").count()
    from models.student import Student
    student_count = db.query(Student).count()
    return {
        "total_records": total,
        "present": present,
        "pending": pending,
        "absent": total - present - pending,
        "total_students": student_count,
    }

