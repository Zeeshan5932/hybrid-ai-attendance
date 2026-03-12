from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.db import get_db
from models.attendance import AttendanceEvent, AttendanceRecord
from schemas.attendance import DetectionEventIn
from services.attendance_rules import apply_physical_attendance_rule

router = APIRouter()


@router.post("/detect")
def create_detection_event(payload: DetectionEventIn, db: Session = Depends(get_db)):
    event = AttendanceEvent(
        session_id=payload.session_id,
        student_id=payload.student_id,
        detected_at=payload.detected_at or datetime.utcnow(),
    )
    db.add(event)
    db.commit()

    return apply_physical_attendance_rule(db, payload.session_id, payload.student_id)


@router.get("/records/{session_id}")
def get_records(session_id: str, db: Session = Depends(get_db)):
    rows = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id).all()
    return [
        {
            "session_id": row.session_id,
            "student_id": row.student_id,
            "status": row.status,
            "marked_at": row.marked_at.isoformat(),
        }
        for row in rows
    ]
