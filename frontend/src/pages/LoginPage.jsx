import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError("Username and password are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { role } = await login(form.username.trim(), form.password);
      navigate(role === "student" ? "/my-attendance" : "/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials. Please try again.");
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
      <div className="orb w-80 h-80" style={{ background:"#9333ea", top:"8%",  left:"5%"  }} />
      <div className="orb orb-b w-96 h-96" style={{ background:"#06b6d4", bottom:"10%", right:"8%"  }} />
      <div className="orb orb-c w-64 h-64" style={{ background:"#7c3aed", top:"55%",  left:"55%" }} />

      {/* Animated grid lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(147,51,234,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(147,51,234,0.04) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-2xl animate-glow"
            style={{ background: "linear-gradient(135deg,#9333ea,#06b6d4)" }}
          >
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            <span className="text-gradient">AI Attendance</span>
          </h1>
          <p className="mt-1.5" style={{ color:"rgba(203,213,225,0.65)", fontSize:"0.875rem" }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: "rgba(255,255,255,0.97)",
            boxShadow: "0 24px 80px rgba(147,51,234,0.22), 0 4px 16px rgba(0,0,0,0.2)",
            border: "1px solid rgba(147,51,234,0.12)",
          }}
        >
          {location.state?.registered && (
            <div
              className="mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", color:"#065f46" }}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Account created! Sign in to continue.
            </div>
          )}

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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
              <input
                name="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="input-glow w-full px-4 py-3 border text-sm rounded-xl transition-all duration-200"
                style={{ borderColor:"rgba(147,51,234,0.2)", background:"rgba(250,245,255,0.6)" }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="input-glow w-full px-4 py-3 pr-11 border text-sm rounded-xl transition-all duration-200"
                  style={{ borderColor:"rgba(147,51,234,0.2)", background:"rgba(250,245,255,0.6)" }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-white text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              style={{
                background: loading ? "#9333ea" : "linear-gradient(135deg,#9333ea,#7e22ce)",
                boxShadow: loading ? "none" : "0 6px 24px rgba(147,51,234,0.4)",
                transform: loading ? "none" : undefined,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(147,51,234,0.5)"; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(147,51,234,0.4)"; }}
            >
              {loading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold transition-colors" style={{ color:"#9333ea" }}>
              Create account
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-5" style={{ color:"rgba(148,163,184,0.5)" }}>
          Attendance is AI-controlled. Students cannot mark their own attendance.
        </p>
      </div>
    </div>
  );
}

