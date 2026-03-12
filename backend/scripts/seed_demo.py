import requests

GATEWAY = "http://localhost:8000"

students = [
    {"student_code": "ST001", "full_name": "Ali Raza", "department": "CS", "face_embedding_id": "1"},
    {"student_code": "ST002", "full_name": "Ayesha Khan", "department": "CS", "face_embedding_id": "2"},
]

for student in students:
    response = requests.post(f"{GATEWAY}/students/", json=student, timeout=30)
    print("student:", response.status_code, response.text)

for emb in [
    {"student_id": "1", "seed_text": "Ali Raza sample face"},
    {"student_id": "2", "seed_text": "Ayesha Khan sample face"},
]:
    response = requests.post(f"{GATEWAY}/recognition/register-embedding", json=emb, timeout=30)
    print("embedding:", response.status_code, response.text)
