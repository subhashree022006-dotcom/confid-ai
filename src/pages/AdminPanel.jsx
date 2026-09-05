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

  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

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

  async function handleLookup(e) {
    e.preventDefault();
    setLookupError("");
    setLookupResult(null);
    setCancelDone(false);
    setLookupLoading(true);
    try {
      const token = localStorage.getItem("confidai_token");
      const res = await fetch(`${API_BASE}/api/admin/user/${encodeURIComponent(lookupId.trim())}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-admin-password": adminPassword,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || "User not found.");
        setLookupLoading(false);
        return;
      }
      setLookupResult(data);
      setLookupLoading(false);
    } catch (err) {
      console.error(err);
      setLookupError("Could not reach the server.");
      setLookupLoading(false);
    }
  }

  async function handleCancelPlan() {
    setCancelLoading(true);
    try {
      const token = localStorage.getItem("confidai_token");
      const res = await fetch(`${API_BASE}/api/admin/cancel-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({ userId: lookupResult.user_id, reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || "Failed to cancel plan.");
        setCancelLoading(false);
        return;
      }
      setCancelDone(true);
      setLookupResult({ ...lookupResult, plan: "free", plan_expires_at: null });
      setCancelLoading(false);
    } catch (err) {
      console.error(err);
      setLookupError("Could not reach the server.");
      setCancelLoading(false);
    }
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
        <div className="mb-12">
          <h1 className="text-2xl font-bold mb-1">Look up user &amp; manage plan</h1>
          <p className="text-gray-400 mb-6">Search a user to view or cancel their subscription.</p>

          <form onSubmit={handleLookup} className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Enter user ID (email)"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              disabled={lookupLoading}
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold"
            >
              {lookupLoading ? "Searching..." : "Search"}
            </button>
          </form>

          {lookupError && <p className="text-sm text-rose-400 mb-4">{lookupError}</p>}

          {lookupResult && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="font-medium mb-1">{lookupResult.user_id}</p>
              <p className="text-sm text-gray-400 mb-1">Plan: <span className="text-white">{lookupResult.plan}</span></p>
              {lookupResult.plan_expires_at && (
                <p className="text-sm text-gray-400 mb-1">Expires: {new Date(lookupResult.plan_expires_at).toLocaleDateString()}</p>
              )}
              <p className="text-sm text-gray-400 mb-4">Student ID status: {lookupResult.student_id_status || "none"}</p>

              {cancelDone ? (
                <p className="text-sm text-emerald-400">Plan cancelled - user reverted to free.</p>
              ) : lookupResult.plan !== "free" ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Reason (optional, for your own records)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <button
                    onClick={handleCancelPlan}
                    disabled={cancelLoading}
                    className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-semibold text-sm"
                  >
                    {cancelLoading ? "Cancelling..." : "Cancel this user's plan"}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">This user is already on the free plan.</p>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 pt-10">
          <h2 className="text-2xl font-bold mb-1">Pending student verifications</h2>
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
        </div>
      </main>
    </div>
  );
}
