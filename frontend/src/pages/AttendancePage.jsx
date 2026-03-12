import { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";

// â”€â”€ Shared table component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RecordsTable({ records, loading, emptyText }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <svg className="animate-spin w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }
  if (records.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
            <th className="px-5 py-3 font-medium">Student</th>
            <th className="px-5 py-3 font-medium">Roll No.</th>
            <th className="px-5 py-3 font-medium">Father's Name</th>
            <th className="px-5 py-3 font-medium">Subject</th>
            <th className="px-5 py-3 font-medium">Session</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {records.map((r, i) => (
            <tr key={r.id ?? i} className="hover:bg-gray-50 transition">
              <td className="px-5 py-3 font-medium text-gray-900">{r.student_name || r.student_id}</td>
              <td className="px-5 py-3 font-mono text-xs text-gray-500">{r.student_id}</td>
              <td className="px-5 py-3 text-gray-500">{r.father_name || "—"}</td>
              <td className="px-5 py-3 text-gray-600 font-mono text-xs">{r.subject_code || "—"}</td>
              <td className="px-5 py-3 text-gray-500 font-mono text-xs truncate max-w-[10rem]">{r.session_id}</td>
              <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                {new Date(r.marked_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// â”€â”€ Stat pills â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StatPills({ records }) {
  const present = records.filter((r) => r.status === "present").length;
  const pending = records.filter((r) => r.status === "pending").length;
  return (
    <div className="flex gap-3 flex-wrap">
      {[
        { label: "Total", value: records.length, bg: "#f9fafb", color: "#374151", border: "#e5e7eb" },
        { label: "Present", value: present, bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
        { label: "Pending", value: pending, bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
      ].map((s) => (
        <div key={s.label}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}
        >
          <span>{s.label}</span>
          <span className="font-bold">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

// â”€â”€ Session info chips (extracted to avoid IIFE-in-JSX) â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SessionInfoChips({ sessions, selectedSession }) {
  const s = sessions.find((x) => x.session_id === selectedSession);
  if (!s) return null;
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {s.subject_name && <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-0.5">{s.subject_name}</span>}
      {s.department && <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5">{s.department}</span>}
      {s.semester && <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5">Sem {s.semester}</span>}
      {s.section && <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5">Sec {s.section}</span>}
    </div>
  );
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AttendancePage() {
  const [tab, setTab] = useState("session"); // "session" | "subject" | "student"
  const [toast, setToast] = useState(null);

  // -- By Session --
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [sessionRecords, setSessionRecords] = useState([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // -- By Subject --
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectRecords, setSubjectRecords] = useState([]);
  const [subjectLoading, setSubjectLoading] = useState(false);

  // -- By Student --
  const [studentSearch, setStudentSearch] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [studentRecords, setStudentRecords] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);

  // Load sessions and subjects on mount
  useEffect(() => {
    api.get("/attendance/sessions")
      .then((r) => {
        setSessions(r.data);
        if (r.data.length > 0) setSelectedSession(r.data[0].session_id);
      })
      .catch(() => setToast({ message: "Failed to load sessions.", type: "error" }))
      .finally(() => setSessionsLoading(false));

    api.get("/subjects/")
      .then((r) => {
        setSubjects(r.data);
        if (r.data.length > 0) setSelectedSubject(r.data[0].code);
      })
      .catch(() => {});
  }, []);

  // Load session records when selection changes
  useEffect(() => {
    if (!selectedSession) { setSessionRecords([]); return; }
    setSessionLoading(true);
    api.get(`/attendance/records/${selectedSession}`)
      .then((r) => setSessionRecords(r.data))
      .catch(() => setToast({ message: "Failed to load session records.", type: "error" }))
      .finally(() => setSessionLoading(false));
  }, [selectedSession]);

  // Load subject records when subject selection changes
  useEffect(() => {
    if (!selectedSubject) { setSubjectRecords([]); return; }
    setSubjectLoading(true);
    api.get(`/attendance/by-subject/${selectedSubject}`)
      .then((r) => setSubjectRecords(r.data))
      .catch(() => setToast({ message: "Failed to load subject records.", type: "error" }))
      .finally(() => setSubjectLoading(false));
  }, [selectedSubject]);

  const handleStudentSearch = (e) => {
    e.preventDefault();
    const code = studentSearch.trim();
    if (!code) return;
    setStudentCode(code);
    setStudentLoading(true);
    api.get(`/attendance/by-student/${code}`)
      .then((r) => setStudentRecords(r.data))
      .catch(() => setToast({ message: "Failed to load student records.", type: "error" }))
      .finally(() => setStudentLoading(false));
  };

  // CSV export for current tab's active records
  const getActiveRecords = () => {
    if (tab === "session") return sessionRecords;
    if (tab === "subject") return subjectRecords;
    return studentRecords;
  };

  const handleExport = () => {
    const data = getActiveRecords();
    if (data.length === 0) return;
    const rows = [
      ["Student Name", "Roll No.", "Father's Name", "Subject", "Session", "Status", "Marked At"],
      ...data.map((r) => [
        r.student_name || r.student_id,
        r.student_id,
        r.father_name || "",
        r.subject_code || "",
        r.session_id,
        r.status,
        r.marked_at,
      ]),
    ];
    const csv = rows.map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${tab}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const TABS = [
    { key: "session", label: "By Session" },
    { key: "subject", label: "By Subject" },
    { key: "student", label: "By Student" },
  ];

  return (
    <Layout
      title="Attendance Records"
      subtitle="Review, filter and export attendance data"
      actions={
        <button
          onClick={handleExport}
          disabled={getActiveRecords().length === 0}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      }
    >
      <div className="space-y-4">
        {/* Tab bar */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                tab === t.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* â”€â”€ By Session â”€â”€ */}
        {tab === "session" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                {sessionsLoading ? (
                  <option>Loading...</option>
                ) : sessions.length === 0 ? (
                  <option>No sessions yet</option>
                ) : (
                  sessions.map((s) => (
                    <option key={s.session_id} value={s.session_id}>
                      {s.session_id}
                      {s.subject_code ? ` — ${s.subject_code}` : ""}
                      {s.status === "active" ? " (active)" : ""}
                    </option>
                  ))
                )}
              </select>
              <SessionInfoChips sessions={sessions} selectedSession={selectedSession} />
            </div>
            <StatPills records={sessionRecords} />
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <RecordsTable
                records={sessionRecords}
                loading={sessionLoading}
                emptyText={sessions.length === 0 ? "No sessions found. Start a live session first." : "No records for this session."}
              />
            </div>
          </div>
        )}

        {/* â”€â”€ By Subject â”€â”€ */}
        {tab === "subject" && (
          <div className="space-y-3">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              {subjects.length === 0 ? (
                <option>No subjects added yet</option>
              ) : (
                subjects.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.name}
                  </option>
                ))
              )}
            </select>
            <StatPills records={subjectRecords} />
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <RecordsTable
                records={subjectRecords}
                loading={subjectLoading}
                emptyText={subjects.length === 0
                  ? "Add subjects first via the Subjects page."
                  : "No attendance records found for this subject."}
              />
            </div>
          </div>
        )}

        {/* â”€â”€ By Student â”€â”€ */}
        {tab === "student" && (
          <div className="space-y-3">
            <form onSubmit={handleStudentSearch} className="flex gap-2">
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Enter student roll number (e.g. BS-CS-F21-001)"
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <button type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
                Search
              </button>
            </form>
            {studentCode && <p className="text-xs text-gray-500">Showing results for <span className="font-mono font-semibold">{studentCode}</span></p>}
            <StatPills records={studentRecords} />
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <RecordsTable
                records={studentRecords}
                loading={studentLoading}
                emptyText={studentCode ? "No attendance records found for this student." : "Enter a roll number above and click Search."}
              />
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}
