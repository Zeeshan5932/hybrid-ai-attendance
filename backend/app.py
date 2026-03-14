import sys
import os
from fastapi.middleware.cors import CORSMiddleware
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy import text
from fastapi import FastAPI
from core.db import Base, engine
from routes import auth, students, recognition, attendance
from routes import sessions as sessions_route
from routes import subjects as subjects_route

# Ensure all models are imported before create_all so their tables are created
import models.session   # noqa: F401  registers AttendanceSession with Base
import models.subject   # noqa: F401  registers Subject with Base

Base.metadata.create_all(bind=engine)

# Safe column migration — adds new columns to attendance_records if they don't exist yet.
# This handles databases created before subject_name / department / semester / section were added.
_NEW_COLS = ["subject_name VARCHAR", "department VARCHAR", "semester VARCHAR", "section VARCHAR"]
with engine.connect() as _conn:
    for _col_def in _NEW_COLS:
        _col_name = _col_def.split()[0]
        try:
            _conn.execute(text(
                f"ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS {_col_def}"
            ))
            _conn.commit()
        except Exception:
            _conn.rollback()

app = FastAPI(title="Hybrid AI Attendance System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173" , "https://hybrid-ai-attendance.vercel.app/login"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(students.router, prefix="/students", tags=["students"])
app.include_router(recognition.router, prefix="/recognition", tags=["recognition"])
app.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
app.include_router(sessions_route.router, prefix="/sessions", tags=["sessions"])
app.include_router(subjects_route.router, prefix="/subjects", tags=["subjects"])


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