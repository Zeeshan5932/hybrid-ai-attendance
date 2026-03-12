from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import httpx
from .config import settings

app = FastAPI(title="Gateway Service")

SERVICE_MAP = {
    "auth": settings.AUTH_SERVICE_URL,
    "students": settings.STUDENT_SERVICE_URL,
    "recognition": settings.RECOGNITION_SERVICE_URL,
    "attendance": settings.ATTENDANCE_SERVICE_URL,
}


@app.get("/")
def root():
    return {"message": "Hybrid AI Attendance Gateway Running"}


@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy(service: str, path: str, request: Request):
    if service not in SERVICE_MAP:
        return JSONResponse(status_code=404, content={"error": "Unknown service"})

    target_url = f"{SERVICE_MAP[service]}/{path}"
    body = await request.body()

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.request(
            method=request.method,
            url=target_url,
            headers={k: v for k, v in request.headers.items() if k.lower() != "host"},
            params=request.query_params,
            content=body,
        )

    return JSONResponse(status_code=resp.status_code, content=resp.json())
