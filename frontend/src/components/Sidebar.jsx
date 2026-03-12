import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Dashboard",
    exact: true,
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: "/students",
    label: "Students",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    to: "/subjects",
    label: "Subjects",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    to: "/attendance",
    label: "Attendance",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    to: "/live",
    label: "Live Session",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className="fixed top-0 left-0 h-full w-64 flex flex-col z-30 overflow-hidden"
      style={{ background: "linear-gradient(180deg,#080616 0%,#0d0920 55%,#06111e 100%)" }}
    >
      {/* Top ambient glow */}
      <div
        className="absolute -top-10 left-1/2 -translate-x-1/2 w-56 h-40 rounded-full pointer-events-none"
        style={{ background: "rgba(147,51,234,0.18)", filter: "blur(60px)" }}
      />

      {/* Brand header */}
      <div className="px-5 py-5 border-b border-white/[0.06] relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: "linear-gradient(135deg,#9333ea,#06b6d4)" }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight tracking-tight">AI Attendance</p>
            <p className="text-xs mt-0.5 capitalize" style={{ color: "rgba(192,132,252,0.65)" }}>
              {user?.role} Portal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5 relative z-10">
        <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.4)" }}>
          Navigation
        </p>
        {NAV_ITEMS.map((item, i) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                isActive ? "nav-active text-purple-200" : "text-slate-400 hover:text-slate-100"
              }`
            }
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {({ isActive }) => (
              <>
                <span
                  className={`transition-colors duration-200 ${isActive ? "text-purple-400" : "text-slate-500 group-hover:text-slate-300"}`}
                >
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#c084fc,#22d3ee)", boxShadow: "0 0 6px rgba(192,132,252,0.8)" }}
                  />
                )}
                {!isActive && (
                  <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: "rgba(255,255,255,0.04)" }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom glow */}
      <div
        className="absolute bottom-24 left-1/2 -translate-x-1/2 w-40 h-24 rounded-full pointer-events-none"
        style={{ background: "rgba(6,182,212,0.1)", filter: "blur(40px)" }}
      />

      {/* User + Logout */}
      <div className="px-3 pb-4 pt-3 border-t border-white/[0.06] relative z-10">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#9333ea,#06b6d4)" }}
          >
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.username}</p>
            <p className="text-[11px] capitalize" style={{ color: "rgba(148,163,184,0.55)" }}>{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
          style={{ color: "rgba(148,163,184,0.7)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(148,163,184,0.7)"; e.currentTarget.style.background = "transparent"; }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
