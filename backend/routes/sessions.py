"""
Session routes
==============
POST   /sessions/           — create / start a new session (teacher-only)
POST   /sessions/{id}/end   — mark a session as ended (teacher-only)
GET    /sessions/            — list all sessions, newest first (teacher-only)
GET    /sessions/active      — fetch currently-active sessions (authenticated)
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

from core.db import get_db
from core.security import require_teacher, get_current_user
from models.session import AttendanceSession
from schemas.session import SessionCreate, SessionOut

router = APIRouter()


def _session_dict(r: AttendanceSession) -> dict:
    return {
        "session_id": r.session_id,
        "name": r.name,
        "subject_code": r.subject_code,
        "subject_name": r.subject_name,
        "department": r.department,
        "semester": r.semester,
        "section": r.section,
        "status": r.status,
        "created_by": r.created_by,
        "created_at": r.created_at.isoformat(),
        "ended_at": r.ended_at.isoformat() if r.ended_at else None,
    }


@router.post("/", response_model=SessionOut)
def create_session(
    body: SessionCreate,
    db: DbSession = Depends(get_db),
    user: dict = Depends(require_teacher),
):
    """
    Start a new session. Idempotent if the same session_id is active.
    Returns 409 if that ID was already ended.
    """
    existing = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.session_id == body.session_id)
        .first()
    )
    if existing:
        if existing.status == "active":
            return existing
        raise HTTPException(
            status_code=409,
            detail=(
                f"Session '{body.session_id}' already exists and has ended. "
                "Please use a different session ID."
            ),
        )

    session = AttendanceSession(
        session_id=body.session_id,
        name=body.name or body.session_id,
        subject_code=body.subject_code,
        subject_name=body.subject_name,
        department=body.department,
        semester=body.semester,
        section=body.section,
        status="active",
        created_by=user.get("sub"),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/end")
def end_session(
    session_id: str,
    db: DbSession = Depends(get_db),
    _t: dict = Depends(require_teacher),
):
    """Mark a session as ended and clear in-memory cooldown state."""
    sess = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.session_id == session_id)
        .first()
    )
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")
    if sess.status == "ended":
        return {"status": "ended", "session_id": session_id}

    sess.status = "ended"
    sess.ended_at = datetime.utcnow()
    db.commit()

    from services.attendance_rules import clear_session_cooldowns
    clear_session_cooldowns(session_id)

    return {"status": "ended", "session_id": session_id}


@router.get("/active")
def get_active_sessions(
    db: DbSession = Depends(get_db),
    _u: dict = Depends(get_current_user),
):
    """Return all currently-active sessions."""
    rows = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.status == "active")
        .order_by(AttendanceSession.created_at.desc())
        .all()
    )
    return [_session_dict(r) for r in rows]


@router.get("/")
def list_sessions(
    db: DbSession = Depends(get_db),
    _t: dict = Depends(require_teacher),
):
    """List all sessions (teacher-only), newest first."""
    rows = (
        db.query(AttendanceSession)
        .order_by(AttendanceSession.created_at.desc())
        .limit(200)
        .all()
    )
    return [_session_dict(r) for r in rows]



@router.post("/", response_model=SessionOut)
def create_session(
    body: SessionCreate,
    db: DbSession = Depends(get_db),
    user: dict = Depends(require_teacher),
):
    """
    Start a new session. Returns existing active session if the same ID is
    submitted again (idempotent re-connect). Raises 409 if the ID was already
    used for a session that has since ended.
    """
    existing = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.session_id == body.session_id)
        .first()
    )
    if existing:
        if existing.status == "active":
            # Idempotent: teacher refreshed the page / reconnected
            return existing
        raise HTTPException(
            status_code=409,
            detail=(
                f"Session '{body.session_id}' already exists and has ended. "
                "Please use a different session ID."
            ),
        )

    session = AttendanceSession(
        session_id=body.session_id,
        name=body.name or body.session_id,
        status="active",
        created_by=user.get("sub"),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/end")
def end_session(
    session_id: str,
    db: DbSession = Depends(get_db),
    _t: dict = Depends(require_teacher),
):
    """Mark a session as ended and clear in-memory cooldown state."""
    sess = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.session_id == session_id)
        .first()
    )
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found.")
    if sess.status == "ended":
        return {"status": "ended", "session_id": session_id}

    sess.status = "ended"
    sess.ended_at = datetime.utcnow()
    db.commit()

    # Release in-memory cooldown state for this session
    from services.attendance_rules import clear_session_cooldowns
    clear_session_cooldowns(session_id)

    return {"status": "ended", "session_id": session_id}


@router.get("/active")
def get_active_sessions(
    db: DbSession = Depends(get_db),
    _u: dict = Depends(get_current_user),
):
    """Return all currently-active sessions."""
    rows = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.status == "active")
        .order_by(AttendanceSession.created_at.desc())
        .all()
    )
    return [
        {
            "session_id": r.session_id,
            "name": r.name,
            "created_by": r.created_by,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.get("/")
def list_sessions(
    db: DbSession = Depends(get_db),
    _t: dict = Depends(require_teacher),
):
    """List all sessions (teacher-only), newest first."""
    rows = (
        db.query(AttendanceSession)
        .order_by(AttendanceSession.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "session_id": r.session_id,
            "name": r.name,
            "status": r.status,
            "created_by": r.created_by,
            "created_at": r.created_at.isoformat(),
            "ended_at": r.ended_at.isoformat() if r.ended_at else None,
        }
        for r in rows
    ]
