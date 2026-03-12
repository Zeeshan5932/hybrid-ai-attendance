import { useEffect, useRef, useState, useCallback } from "react";
import api from "../api";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";

/**
 * LiveSessionPage
 * ---------------
 * Teacher starts a named session and opens their webcam.
 * Every SCAN_INTERVAL_MS the app captures a frame, sends it to
 * POST /recognition/recognize-frame (face detection + embedding match),
 * and on a confident match calls POST /attendance/detect.
 *
 * The attendance_rules backend requires MIN_RECOGNITIONS detections within
 * WINDOW_MINUTES to mark a student 'present' — preventing single-frame noise.
 */

const SCAN_INTERVAL_MS = 2500; // capture a frame every 2.5 seconds

export default function LiveSessionPage() {
  const [sessionId, setSessionId] = useState(
    () => `session-${new Date().toISOString().slice(0, 10)}`
  );
  const [running, setRunning] = useState(false);
  const [records, setRecords] = useState([]);
  const [detections, setDetections] = useState([]); // live feed log
  const [toast, setToast] = useState(null);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  // ── Camera helpers ──────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      return true;
    } catch (err) {
      const msg =
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access and try again."
          : "Could not open camera. Please check your device.";
      setCameraError(msg);
      return false;
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // ── Frame capture → recognition → attendance ────────────────────
  const captureAndRecognize = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    if (!blob) return;

    const fd = new FormData();
    fd.append("image", blob, "frame.jpg");

    let recResult;
    try {
      const res = await api.post("/recognition/recognize-frame", fd);
      recResult = res.data;
    } catch {
      // network/server errors — log quietly, don't crash the loop
      return;
    }

    const logEntry = {
      time: new Date().toLocaleTimeString(),
      code: recResult.code,
      student_id: recResult.student_id || null,
      confidence: recResult.confidence ?? recResult.best_score ?? null,
      message: recResult.message,
    };
    setDetections((prev) => [logEntry, ...prev.slice(0, 49)]); // keep last 50

    // On a confident match, record the detection event
    if (recResult.matched && recResult.student_id) {
      try {
        const attendRes = await api.post("/attendance/detect", {
          session_id: sessionId,
          student_id: recResult.student_id,
        });
        // Refresh records table when status changes
        setRecords((prev) => {
          const idx = prev.findIndex(
            (r) => r.student_id === attendRes.data.student_id
          );
          const updated = { ...attendRes.data, marked_at: new Date().toISOString() };
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = updated;
            return copy;
          }
          return [updated, ...prev];
        });
      } catch {
        // attendance endpoint error — silently continue
      }
    }
  }, [sessionId]);

  // ── Session start / stop ────────────────────────────────────────
  const handleStart = async () => {
    if (!sessionId.trim()) {
      setToast({ message: "Please enter a session ID.", type: "warning" });
      return;
    }
    const ok = await startCamera();
    if (!ok) return;
    setRunning(true);
    setDetections([]);
    setRecords([]);
    intervalRef.current = setInterval(captureAndRecognize, SCAN_INTERVAL_MS);
  };

  const handleStop = () => {
    clearInterval(intervalRef.current);
    stopCamera();
    setRunning(false);
    // Final fetch of records for this session
    api.get(`/attendance/records/${sessionId}`)
      .then((r) => setRecords(r.data))
      .catch(() => {});
  };

  // Cleanup on unmount
  useEffect(() => () => { clearInterval(intervalRef.current); stopCamera(); }, []);

  // ── Helpers ─────────────────────────────────────────────────────
  const detectionColor = (code) => {
    if (code === "recognized") return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (code === "no_face_detected") return "text-gray-500 bg-gray-50 border-gray-200";
    if (code === "low_confidence_match") return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <Layout
      title="Live Session"
      subtitle="AI-controlled face recognition attendance"
      actions={
        running ? (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Stop Session
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
            Start Session
          </button>
        )
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: webcam + session config */}
        <div className="space-y-4">
          {/* Session ID input */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Session ID</label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              disabled={running}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 font-mono"
              placeholder="e.g. class-cs-2025-01"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Use a unique ID per class/date combination, e.g. <code>CS101-2026-03-12</code>
            </p>
          </div>

          {/* Camera feed */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Camera Feed</h3>
              {running && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <div className="relative bg-slate-800">
              {cameraError ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                  <svg className="w-10 h-10 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-red-300">{cameraError}</p>
                </div>
              ) : !running ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                  <svg className="w-10 h-10 text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-slate-400">Camera will start when you begin a session.</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-72 object-cover"
                />
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Scan info */}
          {running && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-xl px-4 py-2.5">
              <svg className="w-4 h-4 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scanning every {SCAN_INTERVAL_MS / 1000}s — student marked 'present' after 3 positive detections within 10 min.
            </div>
          )}
        </div>

        {/* Right: detection log + attendance table */}
        <div className="space-y-4">
          {/* Live detection log */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Detection Log</h3>
              <span className="text-xs text-gray-400">{detections.length} events</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
              {detections.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Detections will appear here once scanning starts.
                </p>
              ) : detections.map((d, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-2.5 border-l-[3px] ${detectionColor(d.code)}`}>
                  <span className="text-xs text-gray-400 font-mono w-16 flex-shrink-0 mt-0.5">{d.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {d.code === "recognized"
                        ? `✓ Student ${d.student_id} — ${(d.confidence * 100).toFixed(1)}%`
                        : d.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance results table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Session Attendance</h3>
              <span className="text-xs text-gray-400">{records.length} record{records.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {records.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Attendance records will appear here once students are detected.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                      <th className="px-4 py-2.5 font-medium">Student</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{r.student_id}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-2.5 text-xs text-gray-400">
                          {r.marked_at ? new Date(r.marked_at).toLocaleTimeString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}
