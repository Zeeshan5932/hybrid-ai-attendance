/** Reusable layout shell shared by all teacher pages. */
import Sidebar from "./Sidebar";

export default function Layout({ children, title, subtitle, actions }) {
  return (
    <div
      className="flex min-h-screen"
      style={{ background: "linear-gradient(135deg,#faf5ff 0%,#f0f9ff 45%,#fdf4ff 100%)" }}
    >
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Glassmorphism sticky header */}
        <header
          className="sticky top-0 z-20 px-8 py-4 flex items-center justify-between"
          style={{
            background: "rgba(250,245,255,0.85)",
            backdropFilter: "blur(18px) saturate(1.8)",
            borderBottom: "1px solid rgba(147,51,234,0.10)",
            boxShadow: "0 1px 24px rgba(147,51,234,0.06)",
          }}
        >
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm mt-0.5" style={{ color: "rgba(107,114,128,0.8)" }}>{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>

        {/* Page body with entrance animation */}
        <main className="flex-1 px-8 py-6 animate-fade-up">{children}</main>
      </div>
    </div>
  );
}
