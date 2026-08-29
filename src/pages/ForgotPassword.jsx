import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ForgotPassword() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      setSent(true);
      setLoading(false);
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          {sent ? (
            <>
              <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
              <p className="text-sm text-gray-400 mb-6">
                If an account exists for that user ID, we've sent a password reset link. It expires in 1 hour.
              </p>
              <Link to="/login" className="text-cyan-300 text-sm font-medium">Back to login</Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold mb-1">Forgot your password?</h1>
              <p className="text-sm text-gray-400 mb-6">Enter your user ID and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300">User ID</label>
                  <input
                    className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-rose-400">{error}</p>}
                <button
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
              <p className="text-sm text-gray-400 mt-5">
                Remembered it? <Link to="/login" className="text-cyan-300 font-medium">Log in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
