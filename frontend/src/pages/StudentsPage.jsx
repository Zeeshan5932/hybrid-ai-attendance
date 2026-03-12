import { useEffect, useRef, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";

// ── Add Student Modal ─────────────────────────────────────────────
function AddStudentModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    student_code: "",
    full_name: "",
    father_name: "",
    department: "",
    semester: "",
    section: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_code.trim() || !form.full_name.trim()) {
      setError("Roll number and full name are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/students/", form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add student.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Add New Student" onClose={onClose}>
      {error && <ErrorBanner message={error} />}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Roll Number *" name="student_code" value={form.student_code}
            onChange={set("student_code")} placeholder="e.g. BS-CS-F21-001" required />
          <Field label="Full Name *" name="full_name" value={form.full_name}
            onChange={set("full_name")} placeholder="e.g. Ali Raza" required />
        </div>
        <Field label="Father's Name" name="father_name" value={form.father_name}
          onChange={set("father_name")} placeholder="e.g. Muhammad Raza" />
        <Field label="Department" name="department" value={form.department}
          onChange={set("department")} placeholder="e.g. Computer Science" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Semester" name="semester" value={form.semester}
            onChange={set("semester")} placeholder="e.g. 5" />
          <Field label="Section" name="section" value={form.section}
            onChange={set("section")} placeholder="e.g. A" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60">
            {loading ? "Saving…" : "Add Student"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Face Registration Modal ───────────────────────────────────────
function RegisterFaceModal({ student, onClose, onDone }) {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Webcam capture state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const streamRef = useRef(null);

  // Assign srcObject AFTER the video element is visible in the DOM.
  // We keep the <video> always mounted (hidden/shown via CSS) so the ref
  // is never null, but we still wait for the state flush before assigning.
  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOpen]);

  const openCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      setCameraOpen(true); // triggers the useEffect above
    } catch (err) {
      const msg =
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser."
          : "Could not open camera. Make sure no other app is using it.";
      setError(msg);
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      setImageFile(file);
      setPreview(URL.createObjectURL(blob));
      closeCamera();
    }, "image/jpeg", 0.92);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const handleSubmit = async () => {
    if (!imageFile) { setError("Please choose or capture an image."); return; }
    setError("");
    setLoading(true);
    const fd = new FormData();
    fd.append("student_id", String(student.id));
    fd.append("image", imageFile);
    try {
      const res = await api.post("/recognition/register-face", fd);
      setResult(res.data);
      onDone();
    } catch (err) {
      setError(err.response?.data?.detail || "Face registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title={`Register Face — ${student.full_name}`} onClose={() => { closeCamera(); onClose(); }}>
      <p className="text-xs text-gray-500 mb-4">
        Upload or capture a clear frontal photo. The image must contain exactly one face.
      </p>

      {error && <ErrorBanner message={error} />}

      {result ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-semibold text-gray-800">Face Registered Successfully</p>
          <p className="text-xs text-gray-500 mt-1">Embedding size: {result.embedding_size} dims</p>
          <button onClick={onClose}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition">
            Done
          </button>
        </div>
      ) : (
        <>
          {/*
            <video> and <canvas> are ALWAYS in the DOM so refs are never null.
            Visibility is toggled with CSS — assigning srcObject requires the
            element to already exist, hence the useEffect approach in openCamera.
          */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`w-full rounded-lg mb-1 bg-black ${cameraOpen ? "block" : "hidden"}`}
            style={{ maxHeight: 240 }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Capture / cancel — visible only while camera is live */}
          {cameraOpen && (
            <div className="flex gap-3 mb-4 mt-2">
              <button
                onClick={captureFromCamera}
                className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                📸 Capture Photo
              </button>
              <button
                onClick={closeCamera}
                className="flex-1 py-2.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Image preview after upload or capture */}
          {preview && !cameraOpen && (
            <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
              <img src={preview} alt="Preview" className="w-full object-cover max-h-56" />
            </div>
          )}

          {/* Upload / camera buttons — when camera is closed */}
          {!cameraOpen && (
            <div className="flex gap-2 mb-4">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition text-sm text-gray-600 hover:text-indigo-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Photo
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFileChange} />
              </label>
              <button onClick={openCamera}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition text-sm text-gray-600 hover:text-indigo-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Use Camera
              </button>
            </div>
          )}

          {!cameraOpen && (
            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-2.5 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={loading || !imageFile}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60">
                {loading ? "Registering…" : "Register Face"}
              </button>
            </div>
          )}
        </>
      )}
    </ModalShell>
  );
}

// ── Shared tiny components ────────────────────────────────────────
function ModalShell({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [registerTarget, setRegisterTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const loadStudents = async () => {
    try {
      const res = await api.get("/students/");
      setStudents(res.data);
    } catch {
      setToast({ message: "Failed to load students.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStudents(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/students/${id}`);
      setToast({ message: `${name} deleted.`, type: "success" });
      loadStudents();
    } catch {
      setToast({ message: "Failed to delete student.", type: "error" });
    }
  };

  const filtered = students.filter((s) =>
    !search ||
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_code.toLowerCase().includes(search.toLowerCase()) ||
    (s.father_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.department || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.semester || "").toString().includes(search) ||
    (s.section || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout
      title="Students"
      subtitle={`${students.length} registered student${students.length !== 1 ? "s" : ""}`}
      actions={
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </button>
      }
    >
      {/* Search bar */}
      <div className="mb-4 relative">
        <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, code or department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">
              {search ? "No students match your search." : "No students yet."}
            </p>
            {!search && (
              <button onClick={() => setShowAdd(true)}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Add your first student →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Roll No.</th>
                  <th className="px-5 py-3 font-medium">Father's Name</th>
                  <th className="px-5 py-3 font-medium">Dept / Sem / Sec</th>
                  <th className="px-5 py-3 font-medium">Face</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                          {s.full_name[0]}
                        </div>
                        <span className="font-medium text-gray-900">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600 font-mono text-xs">{s.student_code}</td>
                    <td className="px-5 py-3 text-gray-600">{s.father_name || "—"}</td>
                    <td className="px-5 py-3 text-gray-600">
                      <span>{s.department || "—"}</span>
                      {(s.semester || s.section) && (
                        <span className="ml-1 text-xs text-gray-400">
                          {s.semester ? `· Sem ${s.semester}` : ""}
                          {s.section ? ` · Sec ${s.section}` : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={s.has_face ? "registered" : "no_face"} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setRegisterTarget(s)}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                        >
                          {s.has_face ? "Update Face" : "Register Face"}
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.full_name)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddStudentModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { loadStudents(); setToast({ message: "Student added successfully.", type: "success" }); }}
        />
      )}
      {registerTarget && (
        <RegisterFaceModal
          student={registerTarget}
          onClose={() => setRegisterTarget(null)}
          onDone={() => { loadStudents(); setToast({ message: "Face registered successfully.", type: "success" }); }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}
