import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function RecentAtsChecks({ refreshKey }) {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("confidai_token");
        const res = await fetch(`${API_BASE}/api/ats-checks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load history.");
        if (!cancelled) setChecks(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading recent checks...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-400">{error}</p>;
  }

  if (checks.length === 0) {
    return <p className="text-sm text-gray-500">No ATS checks yet.</p>;
  }

  function scoreColor(score) {
    if (score >= 75) return "text-cyan-300";
    if (score >= 50) return "text-yellow-300";
    return "text-rose-400";
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/10">
      {checks.map((check) => (
        <div key={check.id} className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="font-medium text-white">
              {check.resume_filename || "Resume"}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {new Date(check.created_at).toLocaleString()}
            </p>
          </div>
          <p className={`text-2xl font-bold ${scoreColor(check.match_score)}`}>
            {check.match_score}
          </p>
        </div>
      ))}
    </div>
  );
}
