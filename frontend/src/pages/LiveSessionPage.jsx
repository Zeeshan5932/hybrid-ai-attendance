import { useEffect, useRef, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";

/**
 * LiveSessionPage
 * ---------------
 * Teacher picks a subject â†’ sets an optional section â†’ starts a session â†’
 * camera opens â†’ live face recognition runs every 2.5 s.
 *
 * Session context (subject, department, semester, section) is stored on the
 * backend alongside each attendance record so every detection is fully linked.
 */

const SCAN_INTERVAL_MS = 2500;

function defaultSessionId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5).replace(":", "");
  return `Session-${date}-${time}`;
}

export default function LiveSessionPage() {
  const [sessionId, setSessionId] = useState(defaultSessionId);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [section, setSection] = useState("");

  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [records, setRecords] = useState([]);
  const [detections, setDetections] = useState([]);
  const [toast, setToast] = useState(null);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const sessionIdRef = useRef(sessionId);
  const studentMapRef = useRef({});
  const markedPresentRef = useRef(new Set());
  const handleStopRef = useRef(null);

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // Load subjects and student map once on mount
  useEffect(() => {
    api.get("/subjects/").then((r) => setSubjects(r.data)).catch(() => {});
    api.get("/students/").then((r) => {
      const m = {};
      r.data.forEach((s) => { m[s.student_code] = s; });
      studentMapRef.current = m;
    }).catch(() => {});
  }, []);

  // When subject dropdown changes, auto-set department/semester hint
  const handleSubjectChange = (e) => {
    const code = e.target.value;
    const subj = subjects.find((s) => s.code === code) || null;
    setSelectedSubject(subj);
  };

  // Assign stream to <video> once it becomes visible
  useEffect(() => {
    if (running && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [running]);

  // â”€â”€ Camera helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      return true;
    } catch (err) {
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Allow camera access and try again."
          : "Could not open camera. Make sure no other app is using it."
      );
      return false;
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  // â”€â”€ Frame capture â†’ recognition â†’ attendance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const captureAndRecognize = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    if (!blob) return;

    const fd = new FormData();
    fd.append("image", blob, "frame.jpg");

    let recResult;
    try {
      const res = await api.post("/recognition/recognize-frame", fd);
      recResult = res.data;
    } catch { return; }

    const sid = sessionIdRef.current;
    const sMap = studentMapRef.current;
    const studentObj = recResult.student_id ? sMap[recResult.student_id] : null;
    const studentName = studentObj?.full_name || recResult.student_id || null;

    const logEntry = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      code: recResult.code,
      student_id: recResult.student_id || null,
      student_name: studentName,
      confidence: recResult.confidence ?? recResult.best_score ?? null,
      message: recResult.message,
    };
    setDetections((prev) => [logEntry, ...prev.slice(0, 49)]);

    if (recResult.matched && recResult.student_id) {
      // Skip API call entirely for students already confirmed present this session
      if (markedPresentRef.current.has(recResult.student_id)) return;
      try {
        const attendRes = await api.post("/attendance/detect", {
          session_id: sid,
          student_id: recResult.student_id,
        });
        const data = attendRes.data;
        if (!data.skipped) {
          if (data.status === "present") {
            markedPresentRef.current.add(data.student_id);
            setToast({ message: `✓ ${studentName || data.student_id} marked Present! Camera stopping…`, type: "success" });
            setTimeout(() => handleStopRef.current?.(), 2000);
          }
          setRecords((prev) => {
            const idx = prev.findIndex((r) => r.student_id === data.student_id);
            const updated = { ...data, student_name: studentName };
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = updated;
              return copy;
            }
            return [updated, ...prev];
          });
        }
      } catch { /* continue scanning */ }
    }
  };

  const captureAndRecognizeRef = useRef(captureAndRecognize);
  captureAndRecognizeRef.current = captureAndRecognize;

  // â”€â”€ Session lifecycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleStart = async () => {
    const sid = sessionId.trim();
    if (!sid) {
      setToast({ message: "Please enter a session ID before starting.", type: "warning" });
      return;
    }
    setStarting(true);

    try {
      await api.post("/sessions/", {
        session_id: sid,
        name: selectedSubject
          ? `${selectedSubject.name}${section ? " - Sec " + section : ""}`
          : sid,
        subject_code: selectedSubject?.code || null,
        subject_name: selectedSubject?.name || null,
        department: selectedSubject?.department || null,
        semester: selectedSubject?.semester || null,
        section: section || null,
      });
    } catch (err) {
      const detail = err.response?.data?.detail || "Could not create session.";
      setToast({ message: detail, type: "error" });
      setStarting(false);
      return;
    }

    const cameraOk = await startCamera();
    if (!cameraOk) {
      api.post(`/sessions/${sid}/end`).catch(() => {});
      setStarting(false);
      return;
    }

    setRunning(true);
    setDetections([]);
    setRecords([]);
    markedPresentRef.current = new Set();
    setStarting(false);
    intervalRef.current = setInterval(() => captureAndRecognizeRef.current(), SCAN_INTERVAL_MS);
  };

  const handleStop = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    stopCamera();
    setRunning(false);

    const sid = sessionIdRef.current;
    api.post(`/sessions/${sid}/end`).catch(() => {});
    api.get(`/attendance/records/${sid}`)
      .then((r) => {
        const sMap = studentMapRef.current;
        setRecords(r.data.map((rec) => ({
          ...rec,
          student_name: sMap[rec.student_id]?.full_name || rec.student_name || rec.student_id,
        })));
      })
      .catch(() => {});
  };

  handleStopRef.current = handleStop;

  useEffect(
    () => () => { clearInterval(intervalRef.current); stopCamera(); },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // â”€â”€ Detection log colour â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const detectionColor = (code) => {
    if (code === "recognized") return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (code === "no_face_detected") return "text-gray-500 bg-gray-50 border-gray-200";
    if (code === "low_confidence_match") return "text-red-700 bg-red-50 border-red-300";
    return "text-slate-500 bg-slate-50 border-slate-200";
  };

  const presentCount = records.filter((r) => r.status === "present").length;
  const pendingCount = records.filter((r) => r.status === "pending").length;

  // â”€â”€ JSX â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <Layout
      title="Live Session"
      subtitle="AI-powered automatic face recognition attendance"
      actions={
        running ? (
          <button onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Stop Session
          </button>
        ) : (
          <button onClick={handleStart} disabled={starting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition shadow-sm">
            {starting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Starting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Session
              </>
            )}
          </button>
        )
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* â”€â”€ Left column â”€â”€ */}
        <div className="space-y-4">
          {/* Session config card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            {/* Subject selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
              <select
                disabled={running || starting}
                onChange={handleSubjectChange}
                defaultValue=""
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">— Select a subject (optional) —</option>
                {subjects.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.name}
                    {s.department ? ` (${s.department})` : ""}
                  </option>
                ))}
              </select>
              {selectedSubject && (
                <p className="text-xs text-gray-400 mt-1">
                  {selectedSubject.department ? `Dept: ${selectedSubject.department}` : ""}
                  {selectedSubject.semester ? ` · Sem ${selectedSubject.semester}` : ""}
                  {selectedSubject.credit_hours ? ` · ${selectedSubject.credit_hours} cr` : ""}
                </p>
              )}
            </div>

            {/* Section + Session ID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Section</label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  disabled={running || starting}
                  placeholder="e.g. A"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Session ID</label>
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  disabled={running || starting}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 font-mono"
                  placeholder="e.g. CS101-2026-03-12"
                />
              </div>
            </div>

            {/* Active session info banner */}
            {running && selectedSubject && (
              <div className="flex flex-wrap gap-2 pt-1">
                <InfoChip label="Subject" value={`${selectedSubject.code} — ${selectedSubject.name}`} />
                {selectedSubject.department && <InfoChip label="Dept" value={selectedSubject.department} />}
                {selectedSubject.semester && <InfoChip label="Sem" value={selectedSubject.semester} />}
                {section && <InfoChip label="Section" value={section} />}
              </div>
            )}
          </div>

          {/* Camera feed */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Camera Feed</h3>
              {running && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <div className="relative bg-slate-900">
              <video ref={videoRef} autoPlay playsInline muted
                className={`w-full object-cover transition-all ${running ? "max-h-72 opacity-100" : "max-h-0 opacity-0"}`}
              />
              {!running && (
                <div className="flex flex-col items-center justify-center h-52 text-center px-6">
                  {cameraError ? (
                    <>
                      <svg className="w-10 h-10 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <p className="text-sm text-red-300 max-w-xs">{cameraError}</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-10 h-10 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-slate-500">Camera starts automatically when the session begins.</p>
                    </>
                  )}
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Scanning info bar */}
          {running && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-xl px-4 py-2.5">
              <svg className="w-4 h-4 text-indigo-500 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scanning every {SCAN_INTERVAL_MS / 1000}s — <strong>PRESENT</strong> after 3 detections within 10 min.
            </div>
          )}

          {/* Quick stats */}
          {records.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Detected", value: records.length, color: "text-gray-800" },
                { label: "Present", value: presentCount, color: "text-emerald-700" },
                { label: "Pending", value: pendingCount, color: "text-amber-700" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* â”€â”€ Right column: detection log + attendance table â”€â”€ */}
        <div className="space-y-4">
          {/* Live detection log */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Detection Log</h3>
              <span className="text-xs text-gray-400">{detections.length} events</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {detections.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Detections will appear here once scanning starts.
                </p>
              ) : (
                detections.map((d) => (
                  <div key={d.id}
                    className={`flex items-start gap-3 px-4 py-2.5 border-l-[3px] ${detectionColor(d.code)}`}>
                    <span className="text-xs text-gray-400 font-mono w-16 flex-shrink-0 mt-0.5">{d.time}</span>
                    <div className="flex-1 min-w-0">
                      {d.code === "recognized" ? (
                        <p className="text-xs font-semibold text-emerald-800 truncate">
                          ✓ {d.student_name}
                          {d.confidence != null && (
                            <span className="ml-2 font-normal text-emerald-600">
                              {(d.confidence * 100).toFixed(1)}%
                            </span>
                          )}
                        </p>
                      ) : d.code === "low_confidence_match" ? (
                        <p className="text-xs font-semibold text-red-800 truncate">
                          ? Unknown face — not in database
                        </p>
                      ) : (
                        <p className="text-xs truncate">{d.message}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Attendance results table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Session Attendance</h3>
              <span className="text-xs text-gray-400">{records.length} student{records.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {records.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Attendance records appear once students are detected.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                      <th className="px-4 py-2.5 font-medium">Name</th>
                      <th className="px-4 py-2.5 font-medium">Roll No.</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map((r) => (
                      <tr key={r.student_id}
                        className={`hover:bg-gray-50 transition-colors ${r.status === "present" ? "bg-emerald-50/40" : ""}`}>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-800 text-xs">{r.student_name || r.student_id}</p>
                          {r.father_name && (
                            <p className="text-xs text-gray-400">{r.father_name}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">{r.student_id}</td>
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

// Small helper chip for session info banner
function InfoChip({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-0.5">
      <span className="font-medium">{label}:</span> {value}
    </span>
  );
}

