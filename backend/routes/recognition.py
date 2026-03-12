from fastapi import APIRouter
from pydantic import BaseModel
from core.config import settings
from services.matcher import match_embedding
from services.embedding_store import save_embedding, fake_embedding_from_input

router = APIRouter()


class RegisterEmbeddingRequest(BaseModel):
    student_id: str
    seed_text: str


class MatchRequest(BaseModel):
    vector: list[float]


@router.post("/register-embedding")
def register_embedding(payload: RegisterEmbeddingRequest):
    vector = fake_embedding_from_input(payload.seed_text)
    save_embedding(payload.student_id, vector)
    return {"student_id": payload.student_id, "vector_size": len(vector)}


@router.post("/match")
def match(payload: MatchRequest):
    return match_embedding(payload.vector, settings.MATCH_THRESHOLD)
