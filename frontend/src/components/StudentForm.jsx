import { useState } from "react";
import api from "../api";

export default function StudentForm({ onCreated }) {
  const [form, setForm] = useState({
    student_code: "",
    full_name: "",
    department: "",
    face_embedding_id: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/students/", form);
    setForm({ student_code: "", full_name: "", department: "", face_embedding_id: "" });
    onCreated();
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: "white", padding: 16, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <h3>Add Student</h3>
      <input name="student_code" placeholder="Student Code" value={form.student_code} onChange={handleChange} style={{ width: "100%", marginBottom: 8, padding: 10 }} />
      <input name="full_name" placeholder="Full Name" value={form.full_name} onChange={handleChange} style={{ width: "100%", marginBottom: 8, padding: 10 }} />
      <input name="department" placeholder="Department" value={form.department} onChange={handleChange} style={{ width: "100%", marginBottom: 8, padding: 10 }} />
      <input name="face_embedding_id" placeholder="Face Embedding ID" value={form.face_embedding_id} onChange={handleChange} style={{ width: "100%", marginBottom: 8, padding: 10 }} />
      <button type="submit" style={{ padding: "10px 16px" }}>Save Student</button>
    </form>
  );
}
