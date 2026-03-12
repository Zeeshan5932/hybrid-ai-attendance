import { useEffect, useState } from "react";
import api from "./api";
import Navbar from "./components/Navbar";
import HealthCards from "./components/HealthCards";
import StudentForm from "./components/StudentForm";
import AttendancePanel from "./components/AttendancePanel";

export default function App() {
  const [students, setStudents] = useState([]);

  const loadStudents = async () => {
    const response = await api.get("/students/");
    setStudents(response.data);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#f3f4f6", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: "20px auto", padding: 16 }}>
        <HealthCards />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <StudentForm onCreated={loadStudents} />
          <AttendancePanel />
        </div>

        <div style={{ marginTop: 16, background: "white", padding: 16, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <h3>Students</h3>
          {students.map((student) => (
            <div key={student.id} style={{ padding: 10, borderBottom: "1px solid #eee" }}>
              <strong>{student.full_name}</strong> ({student.student_code}) - {student.department}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
