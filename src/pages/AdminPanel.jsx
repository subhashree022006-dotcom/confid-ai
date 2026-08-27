import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AdminPanel() {
  const { user } = useAuth();
  const [adminPassword, setAdminPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  async function handleUnlock(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("confidai_token");
      const res = await fetch(`${API_BASE}/api/admin/pending-students`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-admin-password": adminPassword,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Access denied.");
        setLoading(false);
        return;
      }
      setPending(data);
      setAuthorized(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Could not reach the server.");
      setLoading(false);
    }
  }

  async function refreshPending() {
    const token = localStorage.getItem("confidai_token");
    const res = await fetch(`${API_BASE}/api/admin/pending-students`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-admin-password": adminPassword,
      },
    });
    if (res.ok) setPending(await res.json());
  }

  async function handleApprove(userId) {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem("confidai_token");
      await fetch(`${API_BASE}/api/admin/approve-student`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({ userId }),
      });
      await refreshPending();
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  }

  async function handleReject(userId) {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem("confidai_token");
      await fetch(`${API_BASE}/api/admin/reject-student`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({ userId }),
      });
      await refreshPending();
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="max-w-lg mx-auto px-6 py-16 text-center">
          <p className="text-gray-400">Please log in first.</p>
        </main>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="max-w-sm mx-auto px-6 py-16">
          <h1 className="text-2xl font-bold mb-6">Admin access</h1>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              placeholder="Admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Checking..." : "Unlock"}
            </button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-1">Pending student verifications</h1>
        <p className="text-gray-400 mb-8">{pending.length} awaiting review</p>

        {pending.length === 0 ? (
          <p className="text-gray-500">No pending submissions right now.</p>
        ) : (
          <div className="space-y-4">
            {pending.map((p) => (
              <div key={p.user_id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-center gap-5">
                <img
                  src={p.student_id_url}
                  alt="Student ID"
                  className="w-32 h-20 object-cover rounded-lg border border-white/10"
                />
                <div className="flex-1">
                  <p className="font-medium">{p.user_id}</p>
                  <p className="text-xs text-gray-500">Submitted {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(p.user_id)}
                    disabled={actionLoading === p.user_id}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(p.user_id)}
                    disabled={actionLoading === p.user_id}
                    className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-semibold text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
