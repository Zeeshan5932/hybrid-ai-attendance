import { useEffect, useState } from "react";
import api from "../api";
import Layout from "../components/Layout";
import Toast from "../components/Toast";

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

function Field({ label, name, value, onChange, placeholder, required, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
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

const EMPTY_FORM = { code: "", name: "", department: "", semester: "", credit_hours: "" };

// ── Add / Edit Subject Modal ───────────────────────────────────────
function SubjectModal({ subject, onClose, onSaved }) {
  const isEdit = Boolean(subject);
  const [form, setForm] = useState(
    isEdit
      ? {
          code: subject.code,
          name: subject.name,
          department: subject.department || "",
          semester: subject.semester || "",
          credit_hours: subject.credit_hours || "",
        }
      : { ...EMPTY_FORM }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      setError("Subject code and name are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        semester: form.semester || null,
        credit_hours: form.credit_hours ? String(form.credit_hours) : null,
      };
      if (isEdit) {
        await api.put(`/subjects/${subject.id}`, payload);
      } else {
        await api.post("/subjects/", payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save subject.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title={isEdit ? "Edit Subject" : "Add New Subject"} onClose={onClose}>
      {error && <ErrorBanner message={error} />}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Subject Code *" name="code" value={form.code}
            onChange={set("code")} placeholder="e.g. CS301" required
            // Prevent changing code during edit (it's the unique identifier)
          />
          <Field label="Credit Hours" name="credit_hours" value={form.credit_hours}
            onChange={set("credit_hours")} placeholder="e.g. 3" type="number" />
        </div>
        <Field label="Subject Name *" name="name" value={form.name}
          onChange={set("name")} placeholder="e.g. Data Structures" required />
        <Field label="Department" name="department" value={form.department}
          onChange={set("department")} placeholder="e.g. Computer Science" />
        <Field label="Semester" name="semester" value={form.semester}
          onChange={set("semester")} placeholder="e.g. 5" />
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60">
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Subject"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const loadSubjects = async () => {
    try {
      const res = await api.get("/subjects/");
      setSubjects(res.data);
    } catch {
      setToast({ message: "Failed to load subjects.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSubjects(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/subjects/${id}`);
      setToast({ message: `"${name}" deleted.`, type: "success" });
      loadSubjects();
    } catch {
      setToast({ message: "Failed to delete subject.", type: "error" });
    }
  };

  const filtered = subjects.filter(
    (s) =>
      !search ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.department || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout
      title="Subjects"
      subtitle={`${subjects.length} subject${subjects.length !== 1 ? "s" : ""} registered`}
      actions={
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Subject
        </button>
      }
    >
      {/* Search */}
      <div className="mb-4 relative">
        <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by code, name or department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">
              {search ? "No subjects match your search." : "No subjects added yet."}
            </p>
            {!search && (
              <button onClick={() => setShowAdd(true)}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Add your first subject →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                  <th className="px-5 py-3 font-medium">Code</th>
                  <th className="px-5 py-3 font-medium">Subject Name</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Semester</th>
                  <th className="px-5 py-3 font-medium">Credits</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 font-mono font-semibold text-indigo-700 text-xs">{s.code}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-5 py-3 text-gray-600">{s.department || "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{s.semester || "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{s.credit_hours ?? "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditTarget(s)}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
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

      {showAdd && (
        <SubjectModal
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            loadSubjects();
            setToast({ message: "Subject added successfully.", type: "success" });
          }}
        />
      )}
      {editTarget && (
        <SubjectModal
          subject={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            loadSubjects();
            setToast({ message: "Subject updated.", type: "success" });
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}
