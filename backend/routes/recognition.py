"""
Recognition routes
==================
POST /recognition/register-face  — upload image + student_id, store face embedding
POST /recognition/recognize       — upload image, return best matching student
POST /recognition/recognize-frame — alias of /recognize for live webcam frames
POST /recognition/match           — legacy: match a pre-computed vector (kept for compat.)
"""
import logging
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from core.config import settings
from core.security import require_teacher
from services.face_service import register_student_face, recognize_student_from_frame
from services.matcher import match_embedding

router = APIRouter()
logger = logging.getLogger(__name__)

_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _check_content_type(img: UploadFile) -> None:
    if img.content_type not in _ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG / PNG / WebP images are accepted.")


# ── Face registration ──────────────────────────────────────────────
@router.post("/register-face")
async def register_face(
    student_id: str = Form(...),
    image: UploadFile = File(...),
    _t: dict = Depends(require_teacher),
):
    """
    Register a student's face from an uploaded image.
    Teacher-only. Image must contain exactly one clear frontal face.
    Stores a real pixel-based embedding in Redis.
    """
    _check_content_type(image)
    image_bytes = await image.read()
    result = register_student_face(image_bytes, student_id)
    if not result["success"]:
        raise HTTPException(status_code=422, detail=result["message"])
    return result


# ── Single image recognition ──────────────────────────────────────
@router.post("/recognize")
async def recognize(
    image: UploadFile = File(...),
    _t: dict = Depends(require_teacher),
):
    """
    Identify a student from an uploaded photo.
    Returns match result with confidence score.
    On a positive match the frontend should call POST /attendance/detect.
    """
    _check_content_type(image)
    image_bytes = await image.read()
    return recognize_student_from_frame(image_bytes, threshold=settings.MATCH_THRESHOLD)


# ── Webcam frame recognition (alias) ─────────────────────────────
@router.post("/recognize-frame")
async def recognize_frame(
    image: UploadFile = File(...),
    _t: dict = Depends(require_teacher),
):
    """
    Intended for periodic webcam frame submissions during a live session.
    Returns the same structured result as /recognize.
    Frontend calls POST /attendance/detect on a confirmed match.
    """
    _check_content_type(image)
    image_bytes = await image.read()
    return recognize_student_from_frame(image_bytes, threshold=settings.MATCH_THRESHOLD)


# ── Legacy vector-match endpoint (backward compat.) ───────────────
class MatchRequest(BaseModel):
    vector: list[float]


@router.post("/match")
def match(payload: MatchRequest, _t: dict = Depends(require_teacher)):
    """Legacy: match a pre-computed embedding vector. Kept for backward compatibility."""
    return match_embedding(payload.vector, settings.MATCH_THRESHOLD)

