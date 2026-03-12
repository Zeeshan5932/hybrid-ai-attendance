import { useEffect, useState } from "react";
import api from "../api";

export default function HealthCards() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get("/health");
        setStatus(response.data.status);
      } catch {
        setStatus("down");
      }
    }
    load();
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      {["Auth", "Students", "Recognition", "Attendance"].map((name) => (
        <div key={name} style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: 700 }}>{name}</div>
          <div>{status}</div>
        </div>
      ))}
    </div>
  );
}
