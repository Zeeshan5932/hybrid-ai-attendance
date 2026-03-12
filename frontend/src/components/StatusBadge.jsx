/**
 * StatusBadge — animated pill with dot indicator.
 * Usage: <StatusBadge status="present" />
 */
const VARIANTS = {
  present:        { bg: "rgba(16,185,129,0.12)",  text: "#065f46", dot: "#10b981",  border: "rgba(16,185,129,0.3)"  },
  pending:        { bg: "rgba(245,158,11,0.12)",  text: "#92400e", dot: "#f59e0b",  border: "rgba(245,158,11,0.3)"  },
  absent:         { bg: "rgba(244,63,94,0.11)",   text: "#9f1239", dot: "#f43f5e",  border: "rgba(244,63,94,0.25)"  },
  recognized:     { bg: "rgba(6,182,212,0.12)",   text: "#164e63", dot: "#06b6d4",  border: "rgba(6,182,212,0.3)"   },
  registered:     { bg: "rgba(147,51,234,0.12)",  text: "#4c1d95", dot: "#9333ea",  border: "rgba(147,51,234,0.3)"  },
  low_confidence: { bg: "rgba(249,115,22,0.12)",  text: "#7c2d12", dot: "#f97316",  border: "rgba(249,115,22,0.3)"  },
  no_face:        { bg: "rgba(148,163,184,0.12)", text: "#475569", dot: "#94a3b8",  border: "rgba(148,163,184,0.3)" },
  error:          { bg: "rgba(244,63,94,0.11)",   text: "#9f1239", dot: "#f43f5e",  border: "rgba(244,63,94,0.25)"  },
  active:         { bg: "rgba(16,185,129,0.12)",  text: "#065f46", dot: "#10b981",  border: "rgba(16,185,129,0.3)"  },
  inactive:       { bg: "rgba(148,163,184,0.12)", text: "#475569", dot: "#94a3b8",  border: "rgba(148,163,184,0.3)" },
};

const LABELS = {
  present:        "Present",
  pending:        "Pending",
  absent:         "Absent",
  recognized:     "Recognized",
  registered:     "Registered",
  low_confidence: "Low Conf.",
  no_face:        "No Face",
  error:          "Error",
  active:         "Active",
  inactive:       "Inactive",
};

export default function StatusBadge({ status }) {
  const v = VARIANTS[status] || VARIANTS.inactive;
  const label = LABELS[status] || status;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: v.bg, color: v.text, border: `1px solid ${v.border}` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: v.dot, boxShadow: `0 0 5px ${v.dot}` }}
      />
      {label}
    </span>
  );
}
