import { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";

export default function AttendancePage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | present | pending
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  // Load all sessions on mount
  useEffect(() => {
    api.get("/attendance/sessions")
      .then((r) => {
        setSessions(r.data);
        if (r.data.length > 0) setSelectedSession(r.data[0]);
      })
      .catch(() => setToast({ message: "Failed to load sessions.", type: "error" }))
      .finally(() => setSessionLoading(false));
  }, []);

  // Load records when session selection changes
  useEffect(() => {
    if (!selectedSession) { setRecords([]); return; }
    setLoading(true);
    api.get(`/attendance/records/${selectedSession}`)
      .then((r) => setRecords(r.data))
      .catch(() => setToast({ message: "Failed to load records.", type: "error" }))
      .finally(() => setLoading(false));
  }, [selectedSession]);

  const filtered = records.filter((r) => {
    const matchStatus = filter === "all" || r.status === filter;
    const matchSearch =
      !search ||
      r.student_id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === "present").length,
    pending: records.filter((r) => r.status === "pending").length,
  };

  // Simple CSV export
  const handleExport = () => {
    if (records.length === 0) return;
    const rows = [
      ["Session", "Student ID", "Status", "Marked At"],
      ...records.map((r) => [r.session_id, r.student_id, r.status, r.marked_at]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${selectedSession}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout
      title="Attendance Records"
      subtitle="Review, filter and export attendance data"
      actions={
        <button
          onClick={handleExport}
          disabled={records.length === 0}
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
        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Session selector */}
          <div className="flex-shrink-0">
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              {sessionLoading ? (
                <option>Loading…</option>
              ) : sessions.length === 0 ? (
                <option>No sessions yet</option>
              ) : (
                sessions.map((s) => <option key={s} value={s}>{s}</option>)
              )}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            {["all", "present", "pending"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${
                  filter === f
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 min-w-48 relative">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by student ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Mini stat pills */}
        <div className="flex gap-3 flex-wrap">
          {[
            { label: "Total", value: stats.total, color: "gray" },
            { label: "Present", value: stats.present, color: "emerald" },
            { label: "Pending", value: stats.pending, color: "amber" },
          ].map((s) => (
            <div key={s.label}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-${s.color}-50 text-${s.color}-700 border border-${s.color}-200`}
              style={{
                backgroundColor:
                  s.color === "gray" ? "#f9fafb" :
                  s.color === "emerald" ? "#ecfdf5" : "#fffbeb",
                color:
                  s.color === "gray" ? "#374151" :
                  s.color === "emerald" ? "#065f46" : "#92400e",
                borderColor:
                  s.color === "gray" ? "#e5e7eb" :
                  s.color === "emerald" ? "#a7f3d0" : "#fde68a",
              }}
            >
              <span>{s.label}</span>
              <span className="font-bold">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Table */}
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">
                {sessions.length === 0
                  ? "No sessions found. Start a live session first."
                  : "No records match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                    <th className="px-5 py-3 font-medium">Session</th>
                    <th className="px-5 py-3 font-medium">Student ID</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Marked At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-medium text-gray-800 font-mono text-xs">{r.session_id}</td>
                      <td className="px-5 py-3 font-medium text-gray-800">{r.student_id}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3 text-gray-500">{new Date(r.marked_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}
