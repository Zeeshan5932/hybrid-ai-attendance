import json
import redis
from .config import settings

redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    decode_responses=True,
)


def save_embedding(student_id: str, vector: list[float]):
    redis_client.set(f"embedding:{student_id}", json.dumps(vector))


def get_all_embeddings():
    data = {}
    for key in redis_client.keys("embedding:*"):
        student_id = key.split(":", 1)[1]
        data[student_id] = json.loads(redis_client.get(key))
    return data
