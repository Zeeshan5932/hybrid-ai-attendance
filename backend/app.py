import sys
import os
from fastapi.middleware.cors import CORSMiddleware
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy import text
from fastapi import FastAPI
from core.db import Base, engine
from routes import auth, students, recognition, attendance

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hybrid AI Attendance System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/db-check")
def db_check():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        value = result.scalar()
    return {"database_connected": value == 1}