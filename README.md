# Hybrid AI Attendance System

## Run project
```bash
docker compose up --build
```

## Open frontend

* http://localhost:5173

## Open gateway

* http://localhost:8000

## Health checks

```bash
curl http://localhost:8000/
curl http://localhost:8000/auth/health
curl http://localhost:8000/students/health
curl http://localhost:8000/recognition/health
curl http://localhost:8000/attendance/health
```

## Register user

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher1","password":"123456","role":"teacher"}'
```

## Add student

```bash
curl -X POST http://localhost:8000/students/students \
  -H "Content-Type: application/json" \
  -d '{"student_code":"ST001","full_name":"Ali Raza","department":"CS","face_embedding_id":"1"}'
```

## Register sample embedding

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

After 3 detections within 10 minutes, student becomes `present`.
