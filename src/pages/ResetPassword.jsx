import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import PasswordInput from "../components/PasswordInput.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const userId = searchParams.get("userId");

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      setDone(true);
      setLoading(false);
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }

  if (!token || !userId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-16 text-center">
          <div className="w-full max-w-sm rounded-2xl border border-rose-400/30 bg-rose-500/5 p-8">
            <h1 className="text-xl font-semibold mb-2">Invalid reset link</h1>
            <p className="text-sm text-gray-400 mb-6">This link is missing required information. Please request a new one.</p>
            <Link to="/forgot-password" className="text-cyan-300 text-sm font-medium">Request a new link</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          {done ? (
            <>
              <h1 className="text-2xl font-semibold mb-2">Password updated</h1>
              <p className="text-sm text-gray-400 mb-6">You can now log in with your new password.</p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90"
              >
                Go to login
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold mb-1">Set a new password</h1>
              <p className="text-sm text-gray-400 mb-6">Choose a new password for your account.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300">New password</label>
                  <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                {error && <p className="text-sm text-rose-400">{error}</p>}
                <button
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
