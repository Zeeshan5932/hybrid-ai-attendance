import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "teacher", label: "Teacher", desc: "Manage students & run sessions", icon: "ðŸŽ“" },
  { value: "student", label: "Student", desc: "View personal records only",     icon: "ðŸ“š" },
];

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "", confirm: "", role: "teacher" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError("Username and password are required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(form.username.trim(), form.password, form.role);
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0a0618 0%,#130d2e 45%,#071526 100%)" }}
    >
      {/* Animated background orbs */}
      <div className="orb w-72 h-72" style={{ background:"#06b6d4", top:"6%",   right:"8%"  }} />
      <div className="orb orb-b w-80 h-80" style={{ background:"#9333ea", bottom:"8%",  left:"6%"  }} />
      <div className="orb orb-c w-56 h-56" style={{ background:"#a855f7", top:"50%",  right:"30%" }} />

      {/* Grid lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(6,182,212,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,0.04) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        {/* Brand */}
        <div className="text-center mb-7">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-2xl animate-glow"
            style={{ background: "linear-gradient(135deg,#06b6d4,#9333ea)" }}
          >
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            <span className="text-gradient">Create Account</span>
          </h1>
          <p className="mt-1.5" style={{ color:"rgba(203,213,225,0.65)", fontSize:"0.875rem" }}>Join the AI Attendance System</p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: "rgba(255,255,255,0.97)",
            boxShadow: "0 24px 80px rgba(6,182,212,0.18), 0 4px 16px rgba(0,0,0,0.2)",
            border: "1px solid rgba(6,182,212,0.12)",
          }}
        >
          {error && (
            <div
              className="mb-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm animate-bounce-in"
              style={{ background:"rgba(244,63,94,0.09)", border:"1px solid rgba(244,63,94,0.25)", color:"#9f1239" }}
            >
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
              <input
                name="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Choose a username"
                className="input-glow w-full px-4 py-3 border text-sm rounded-xl transition-all duration-200"
                style={{ borderColor:"rgba(6,182,212,0.2)", background:"rgba(240,249,255,0.5)" }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="input-glow w-full px-4 py-3 pr-11 border text-sm rounded-xl transition-all duration-200"
                  style={{ borderColor:"rgba(6,182,212,0.2)", background:"rgba(240,249,255,0.5)" }}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className="input-glow w-full px-4 py-3 pr-11 border text-sm rounded-xl transition-all duration-200"
                  style={{ borderColor:"rgba(6,182,212,0.2)", background:"rgba(240,249,255,0.5)" }}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 hover:text-gray-600 transition-colors">
                  {showConfirm ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <label
                    key={r.value}
                    className="cursor-pointer rounded-2xl border-2 p-3.5 transition-all duration-200"
                    style={form.role === r.value ? {
                      borderColor: "#9333ea",
                      background: "linear-gradient(135deg,rgba(147,51,234,0.07),rgba(6,182,212,0.05))",
                      boxShadow: "0 0 0 3px rgba(147,51,234,0.12)",
                    } : {
                      borderColor: "rgba(203,213,225,0.7)",
                      background: "transparent",
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={form.role === r.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="text-xl mb-1">{r.icon}</div>
                    <p className="text-sm font-bold text-gray-800">{r.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{r.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-white text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              style={{
                background: loading ? "#9333ea" : "linear-gradient(135deg,#06b6d4,#9333ea)",
                boxShadow: loading ? "none" : "0 6px 24px rgba(6,182,212,0.35), 0 6px 24px rgba(147,51,234,0.25)",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
            >
              {loading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold transition-colors" style={{ color:"#9333ea" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

