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


def _record_dict(r: AttendanceRecord) -> dict:
    return {
        "id": r.id,
        "session_id": r.session_id,
        "student_id": r.student_id,
        "subject_code": r.subject_code,
        "student_name": r.student_name,
        "father_name": r.father_name,
        "status": r.status,
        "marked_at": r.marked_at.isoformat(),
    }


@router.post("/detect")
def create_detection_event(
    payload: DetectionEventIn,
    db: Session = Depends(get_db),
    _t: dict = Depends(require_teacher),
):
    """
    Record a face-detection event for a student in an active session.
    Enriches the record with student info (name, father name) and subject code
    from the session, then delegates to the rules engine.
    """
    session = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.session_id == payload.session_id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=404,
            detail=f"Session '{payload.session_id}' not found. Create it via POST /sessions/ first.",
        )
    if session.status != "active":
        raise HTTPException(
            status_code=409,
            detail=f"Session '{payload.session_id}' has ended. No further attendance can be recorded.",
        )

    # Resolve student details for denormalized storage
    student = (
        db.query(Student)
        .filter(Student.student_code == payload.student_id)
        .first()
    )

    return apply_physical_attendance_rule(
        db,
        payload.session_id,
        payload.student_id,
        subject_code=session.subject_code,
        student_name=student.full_name if student else payload.student_id,
        father_name=student.father_name if student else None,
    )


@router.get("/sessions")
def list_sessions_for_dropdown(
    db: Session = Depends(get_db),
    _u: dict = Depends(get_current_user),
):
    """Return all sessions as full objects (for the AttendancePage dropdowns)."""
    rows = (
        db.query(AttendanceSession)
        .order_by(AttendanceSession.created_at.desc())
        .limit(200)
        .all()
    )
    return [
        {
            "session_id": r.session_id,
            "name": r.name,
            "subject_code": r.subject_code,
            "subject_name": r.subject_name,
            "department": r.department,
            "semester": r.semester,
            "section": r.section,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.get("/records/{session_id}")
def get_records(
    session_id: str,
    db: Session = Depends(get_db),
    _u: dict = Depends(get_current_user),
):
    """All attendance records for a specific session."""
    rows = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.session_id == session_id)
        .order_by(AttendanceRecord.marked_at.desc())
        .all()
    )
    return [_record_dict(r) for r in rows]


@router.get("/by-subject/{subject_code}")
def get_records_by_subject(
    subject_code: str,
    db: Session = Depends(get_db),
    _u: dict = Depends(get_current_user),
):
    """All attendance records across all sessions for a given subject code."""
    rows = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.subject_code == subject_code)
        .order_by(AttendanceRecord.marked_at.desc())
        .all()
    )
    return [_record_dict(r) for r in rows]


@router.get("/by-student/{student_code}")
def get_records_by_student(
    student_code: str,
    db: Session = Depends(get_db),
    _u: dict = Depends(get_current_user),
):
    """Complete attendance history for a specific student (by roll number)."""
    rows = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.student_id == student_code)
        .order_by(AttendanceRecord.marked_at.desc())
        .all()
    )
    return [_record_dict(r) for r in rows]


@router.get("/my-records")
def my_records(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """
    Student endpoint: returns all attendance records where student_id matches
    the logged-in user's username.
    """
    username = user.get("sub", "")
    rows = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.student_id == username)
        .order_by(AttendanceRecord.marked_at.desc())
        .all()
    )
    return [_record_dict(r) for r in rows]



@router.post("/detect")
def create_detection_event(
    payload: DetectionEventIn,
    db: Session = Depends(get_db),
    _t: dict = Depends(require_teacher),
):
    """
    Record a face detection event for a student in a named session.
    Teacher-only. The session MUST exist and be active.

    Internally delegates to attendance_rules which:
      - skips the call if the student is already PRESENT
      - skips if the same student was seen < 2 s ago (cooldown)
      - otherwise creates an AttendanceEvent and decides 'present' / 'pending'
    """
    # Validate session exists and is still active
    session = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.session_id == payload.session_id)
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=404,
            detail=f"Session '{payload.session_id}' not found. Create it via POST /sessions/ first.",
        )
    if session.status != "active":
        raise HTTPException(
            status_code=409,
            detail=f"Session '{payload.session_id}' has ended. No further attendance can be recorded.",
        )

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

