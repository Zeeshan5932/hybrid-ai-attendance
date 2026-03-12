from fastapi import FastAPI
from core.db import Base, engine
from routes import auth, students, recognition, attendance

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hybrid AI Attendance System")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(students.router, prefix="/students", tags=["students"])
app.include_router(recognition.router, prefix="/recognition", tags=["recognition"])
app.include_router(attendance.router, prefix="/attendance", tags=["attendance"])


@app.get("/")
def root():
    return {"message": "Hybrid AI Attendance System Running"}


@app.get("/health")
def health():
    return {"status": "ok"}
