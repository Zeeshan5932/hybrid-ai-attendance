import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/attendance/my-records")
      .then((r) => setRecords(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Aggregate stats
  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  // Class-wise grouping
  const bySession = records.reduce((acc, r) => {
    if (!acc[r.session_id]) acc[r.session_id] = { present: 0, total: 0 };
    acc[r.session_id].total++;
    if (r.status === "present") acc[r.session_id].present++;
    return acc;
  }, {});

  const pctColor =
    percentage >= 75 ? "text-emerald-600" :
    percentage >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">AI Attendance</p>
            <p className="text-xs text-gray-400">Student Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Welcome, <span className="font-medium">{user?.username}</span>
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 transition px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Info banner: students cannot self-mark */}
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-blue-800 text-sm">
          <svg className="w-5 h-5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Attendance is marked automatically by the AI recognition system. You cannot mark your own attendance.
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
            <p className="text-4xl font-bold mt-1" style={{ color: percentage >= 75 ? "#059669" : percentage >= 50 ? "#d97706" : "#dc2626" }}>
              {percentage}%
            </p>
            <p className="text-sm text-gray-500 mt-1">Attendance Rate</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
            <p className="text-4xl font-bold text-emerald-600 mt-1">{present}</p>
            <p className="text-sm text-gray-500 mt-1">Sessions Present</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
            <p className="text-4xl font-bold text-gray-900 mt-1">{total}</p>
            <p className="text-sm text-gray-500 mt-1">Total Records</p>
          </div>
        </div>

        {/* Session-wise summary */}
        {Object.keys(bySession).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Session Summary</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {Object.entries(bySession).map(([sid, data]) => {
                const pct = Math.round((data.present / data.total) * 100);
                return (
                  <div key={sid} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sid}</p>
                      <p className="text-xs text-gray-400">{data.total} record{data.total !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct >= 75 ? "#059669" : pct >= 50 ? "#d97706" : "#dc2626"
                          }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${pctColor}`}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full attendance history */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Attendance History</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No attendance records found yet.</p>
              <p className="text-xs text-gray-400 mt-1">Records appear here once a teacher runs a session.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                    <th className="px-5 py-3 font-medium">Session</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Marked At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-medium text-gray-800">{r.session_id}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3 text-gray-500">
                        {new Date(r.marked_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
