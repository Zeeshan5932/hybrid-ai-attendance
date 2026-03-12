/**
 * StatusBadge — displays attendance/face status with colour-coded pill.
 * Usage: <StatusBadge status="present" />
 */
const VARIANTS = {
  present:   "bg-emerald-100 text-emerald-800 border border-emerald-200",
  pending:   "bg-amber-100  text-amber-800  border border-amber-200",
  absent:    "bg-red-100    text-red-800    border border-red-200",
  recognized:"bg-blue-100   text-blue-800   border border-blue-200",
  registered:"bg-indigo-100 text-indigo-800 border border-indigo-200",
  low_confidence: "bg-orange-100 text-orange-800 border border-orange-200",
  no_face:   "bg-gray-100   text-gray-600   border border-gray-200",
  error:     "bg-red-100    text-red-800    border border-red-200",
  active:    "bg-green-100  text-green-700  border border-green-200",
  inactive:  "bg-gray-100   text-gray-500   border border-gray-200",
};

const LABELS = {
  present:   "Present",
  pending:   "Pending",
  absent:    "Absent",
  recognized:"Recognized",
  registered:"Face Registered",
  low_confidence: "Low Confidence",
  no_face:   "No Face",
  error:     "Error",
  active:    "Active",
  inactive:  "Inactive",
};

export default function StatusBadge({ status }) {
  const cls = VARIANTS[status] || "bg-gray-100 text-gray-600 border border-gray-200";
  const label = LABELS[status] || status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
