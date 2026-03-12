/** Stat card with gradient icon and hover lift animation. */
export default function StatCard({ label, value, icon, color = "indigo", trend }) {
  const gradients = {
    indigo:  "linear-gradient(135deg,#9333ea,#7e22ce)",
    emerald: "linear-gradient(135deg,#10b981,#059669)",
    amber:   "linear-gradient(135deg,#f59e0b,#d97706)",
    red:     "linear-gradient(135deg,#f43f5e,#e11d48)",
    blue:    "linear-gradient(135deg,#06b6d4,#0891b2)",
  };
  const shadows = {
    indigo:  "0 8px 24px rgba(147,51,234,0.28)",
    emerald: "0 8px 24px rgba(16,185,129,0.28)",
    amber:   "0 8px 24px rgba(245,158,11,0.28)",
    red:     "0 8px 24px rgba(244,63,94,0.28)",
    blue:    "0 8px 24px rgba(6,182,212,0.28)",
  };

  return (
    <div
      className="card-hover glass-card rounded-2xl p-5 flex items-center gap-4"
      style={{ borderRadius: "16px" }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
        style={{ background: gradients[color] || gradients.indigo, boxShadow: shadows[color] || shadows.indigo }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 tracking-tight">{value ?? "—"}</p>
        {trend && <p className="text-xs text-gray-400 mt-0.5">{trend}</p>}
      </div>
    </div>
  );
}
