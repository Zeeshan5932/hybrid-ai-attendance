import { useState } from "react";
import api from "../api";

export default function AttendancePanel() {
  const [sessionId, setSessionId] = useState("class-001");
  const [studentId, setStudentId] = useState("1");
  const [records, setRecords] = useState([]);

  const sendDetection = async () => {
    await api.post("/attendance/detect", {
      session_id: sessionId,
      student_id: studentId,
    });
    await fetchRecords();
  };

  const fetchRecords = async () => {
    const response = await api.get(`/attendance/records/${sessionId}`);
    setRecords(response.data);
  };

  return (
    <div style={{ background: "white", padding: 16, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <h3>Attendance Simulation</h3>
      <input value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Session ID" style={{ width: "100%", marginBottom: 8, padding: 10 }} />
      <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Student ID" style={{ width: "100%", marginBottom: 8, padding: 10 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={sendDetection}>Send Detection</button>
        <button onClick={fetchRecords}>Load Records</button>
      </div>

      <div style={{ marginTop: 16 }}>
        {records.map((record, index) => (
          <div key={index} style={{ padding: 10, borderBottom: "1px solid #eee" }}>
            <strong>{record.student_id}</strong> - {record.status}
          </div>
        ))}
      </div>
    </div>
  );
}
