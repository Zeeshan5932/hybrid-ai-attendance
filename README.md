# Hybrid AI Attendance System

Monorepo with one FastAPI backend and one React/Vite frontend.

## Structure

```
hybrid-ai-attendance/
├── .env
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app.py
│   ├── core/        (config, db, security)
│   ├── models/      (user, student, attendance)
│   ├── schemas/     (auth, student, attendance)
│   ├── routes/      (auth, students, recognition, attendance)
│   ├── services/    (matcher, embedding_store, attendance_rules)
│   └── scripts/     (seed_demo.py)
└── frontend/
    ├── Dockerfile
    └── src/
```

## Run

```bash
docker compose up --build
```

## URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Health check

```bash
curl http://localhost:8000/health
```

## Register user

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher1","password":"123456","role":"teacher"}'
```

## Add student

```bash
curl -X POST http://localhost:8000/students/ \
  -H "Content-Type: application/json" \
  -d '{"student_code":"ST001","full_name":"Ali Raza","department":"CS","face_embedding_id":"1"}'
```

## Register face embedding

```bash
curl -X POST http://localhost:8000/recognition/register-embedding \
  -H "Content-Type: application/json" \
  -d '{"student_id":"1","seed_text":"Ali Raza sample face"}'
```

## Simulate attendance

```bash
curl -X POST http://localhost:8000/attendance/detect \
  -H "Content-Type: application/json" \
  -d '{"session_id":"class-001","student_id":"1"}'
```

After **3 detections within 10 minutes**, the student becomes `present`.

## Seed demo data

```bash
python backend/scripts/seed_demo.py
```
