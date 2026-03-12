import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

/** SVG donut chart for attendance distribution. */
function AttendanceRing({ present, pending, absent }) {
  const r = 40, size = 108, cx = 54, cy = 54;
  const C = 2 * Math.PI * r;
  const total = Math.max(present + pending + absent, 1);
  const segs = [
    { val: present, color: "#10b981" },
    { val: pending, color: "#f59e0b" },
    { val: absent,  color: "#e5e7eb" },
  ];
  let cum = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {segs.map((s, i) => {
          const len = (s.val / total) * C;
          const off = cum;
          cum += len;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth={15}
              strokeDasharray={`${len} ${C}`}
              strokeDashoffset={-off}
            />
          );
        })}
      </g>
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={17} fontWeight={700} fill="#111827">
        {Math.round((present / total) * 100)}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fill="#6b7280">present</text>
    </svg>
  );
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, studentsRes] = await Promise.all([
          api.get("/attendance/stats"),
          api.get("/students/"),
        ]);
        setStats(statsRes.data);
        setStudents(studentsRes.data.slice(0, 5));

        // Load records for the most recent session if available
        const sessionsRes = await api.get("/attendance/sessions");
        if (sessionsRes.data.length > 0) {
          const latest = sessionsRes.data[0];
          const recRes = await api.get(`/attendance/records/${latest.session_id}`);
          setRecentRecords(recRes.data.slice(0, 8));
        }
      } catch {
        // silently fail — individual cards will show fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    {
      label: "Total Students",
      value: stats?.total_students,
      color: "indigo",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: "Present Today",
      value: stats?.present,
      color: "emerald",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      label: "Pending",
      value: stats?.pending,
      color: "amber",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Total Records",
      value: stats?.total_records,
      color: "blue",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
  ];

  return (
    <Layout
      title="Dashboard"
      subtitle="Overview of your AI attendance system"
      actions={
        <Link to="/live"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start Live Session
        </Link>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <svg className="animate-spin w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map((c) => (
              <StatCard key={c.label} {...c} />
            ))}
          </div>

          {/* Attendance distribution chart */}
          {stats && (stats.present > 0 || stats.pending > 0 || stats.absent > 0) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Attendance Distribution</h2>
              <div className="flex items-center gap-8">
                <AttendanceRing
                  present={stats.present || 0}
                  pending={stats.pending || 0}
                  absent={stats.absent  || 0}
                />
                <div className="flex-1 space-y-3">
                  {[
                    { label: "Present", value: stats.present || 0, dot: "bg-emerald-500" },
                    { label: "Pending", value: stats.pending || 0, dot: "bg-amber-400"   },
                    { label: "Other",   value: stats.absent  || 0, dot: "bg-gray-300"    },
                  ].map((item) => {
                    const pct = Math.round((item.value / Math.max(stats.total_records, 1)) * 100);
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                            {item.label}
                          </span>
                          <span className="font-medium text-gray-700">{item.value} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${item.dot}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent students */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Recent Students</h2>
                <Link to="/students"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {students.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-gray-400">No students yet.</p>
                    <Link to="/students"
                      className="mt-2 inline-block text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                      Add your first student →
                    </Link>
                  </div>
                ) : students.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                        {s.full_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.full_name}</p>
                        <p className="text-xs text-gray-400">{s.student_code} · {s.department}</p>
                      </div>
                    </div>
                    <StatusBadge status={s.has_face ? "registered" : "no_face"} />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent attendance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Recent Attendance</h2>
                <Link to="/attendance"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recentRecords.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-gray-400">No attendance records yet.</p>
                    <Link to="/live"
                      className="mt-2 inline-block text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                      Start a live session →
                    </Link>
                  </div>
                ) : recentRecords.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.student_id}</p>
                      <p className="text-xs text-gray-400">{r.session_id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={r.status} />
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {new Date(r.marked_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { to: "/students", label: "Add Student", icon: "👤" },
                { to: "/live",     label: "Run Session", icon: "📹" },
                { to: "/attendance", label: "View Records", icon: "📋" },
                { to: "/students", label: "Register Face", icon: "🔍" },
              ].map((a) => (
                <Link
                  key={a.to + a.label}
                  to={a.to}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition group"
                >
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-xs font-medium text-gray-600 group-hover:text-indigo-700">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
