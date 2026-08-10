import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchSessionHistory } from "../utils/sessionApi.js";

const MODES = [
  { title: "Interview", key: "interview", desc: "Mock HR interview scored on confidence, gestures, eye contact, communication, and hire probability.", path: "/interview", color: "from-blue-500/20 to-blue-500/0" },
  { title: "Presentation", key: "presentation", desc: "Upload your slides, present to the camera, then face a short viva on your topic.", path: "/presentation", color: "from-cyan-500/20 to-cyan-500/0" },
  { title: "Stage Speech", key: "stagespeech", desc: "Practice a stage speech with confidence, gesture and eye-contact scoring.", path: "/stagespeech", color: "from-yellow-500/20 to-yellow-500/0" },
  { title: "Group Discussion", key: "gd", desc: "Join a simulated group discussion with AI participants and get evaluated.", path: "/gd", color: "from-emerald-500/20 to-emerald-500/0" },
];

const MODE_LABELS = {
  interview: "Interview",
  presentation: "Presentation",
  stagespeech: "Stage Speech",
  gd: "Group Discussion",
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedMode, setSelectedMode] = useState("interview");

  useEffect(() => {
    if (!user) return;
    fetchSessionHistory(user.userId).then((data) => {
      setHistory(data);
      setLoadingHistory(false);
    });
  }, [user]);

  const avgScore = history.length
    ? Math.round(history.reduce((sum, s) => sum + (s.overall_score || 0), 0) / history.length)
    : null;

  // Sessions for the selected mode, oldest first, so the chart reads left-to-right
  // as "first attempt" through "most recent attempt".
  const modeTrend = useMemo(() => {
    return history
      .filter((s) => s.mode === selectedMode)
      .slice()
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((s, i) => ({
        attempt: `#${i + 1}`,
        date: new Date(s.created_at).toLocaleDateString(),
        score: s.overall_score,
      }));
  }, [history, selectedMode]);

  const modesWithData = new Set(history.map((s) => s.mode));

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-cyan-400 text-sm font-medium mb-2">Welcome back, {user?.userId}</p>
        <h1 className="text-3xl font-bold mb-1">What are you practicing today?</h1>
        <p className="text-gray-400 mb-10">Choose a mode to begin a trial session.</p>

        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {MODES.map((m) => (
            <button
              key={m.title}
              onClick={() => navigate(m.path)}
              className={`text-left rounded-2xl border border-white/10 bg-gradient-to-br ${m.color} p-7 hover:border-cyan-400/40 transition`}
            >
              <h3 className="text-xl font-semibold mb-2">{m.title}</h3>
              <p className="text-gray-400 text-sm">{m.desc}</p>
            </button>
          ))}
        </div>

        {!loadingHistory && history.length > 0 && (
          <div className="border-t border-white/10 pt-10 mb-12">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-xl font-semibold">Progress over time</h2>
              {avgScore !== null && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Overall average</p>
                  <p className="text-2xl font-bold text-cyan-300">{avgScore}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mb-5 flex-wrap">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMode(m.key)}
                  disabled={!modesWithData.has(m.key)}
                  className={`text-sm px-4 py-1.5 rounded-full border transition ${
                    selectedMode === m.key
                      ? "border-cyan-400 bg-cyan-500/10 text-cyan-300"
                      : modesWithData.has(m.key)
                      ? "border-white/15 text-gray-300 hover:bg-white/5"
                      : "border-white/5 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  {m.title}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6" style={{ height: 280 }}>
              {modeTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  No {MODE_LABELS[selectedMode]} sessions yet.
                </div>
              ) : modeTrend.length === 1 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <p className="text-sm text-gray-500 mb-1">Only one {MODE_LABELS[selectedMode]} session so far</p>
                  <p className="text-4xl font-bold text-cyan-300">{modeTrend[0].score}</p>
                  <p className="text-xs text-gray-600 mt-1">Complete another session to see your trend</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modeTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="attempt" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.5)" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                      labelStyle={{ color: "#e5e7eb" }}
                      formatter={(value) => [value, "Score"]}
                      labelFormatter={(label, payload) => payload?.[0] ? `${label} - ${payload[0].payload.date}` : label}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="url(#trendGradient)" />
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-white/10 pt-10">
          <h2 className="text-xl font-semibold mb-6">Recent sessions</h2>
          {loadingHistory ? (
            <p className="text-gray-500 text-sm">Loading your session history...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500 text-sm">No sessions yet - complete a practice session above and it will show up here.</p>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/10">
              {history.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium">{MODE_LABELS[s.mode] || s.mode}</p>
                    <p className="text-sm text-gray-500">{s.topic_or_role || "-"}</p>
                    <p className="text-xs text-gray-600 mt-1">{new Date(s.created_at).toLocaleString()}</p>
                  </div>
                  <p className="text-2xl font-bold text-cyan-300">{s.overall_score}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}