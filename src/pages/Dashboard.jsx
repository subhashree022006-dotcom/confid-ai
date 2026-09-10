```jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchSessionHistory } from "../utils/sessionApi.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const MODES = [
  {
    title: "Interview",
    key: "interview",
    desc: "Mock HR interview scored on confidence, gestures, eye contact, communication, and hire probability.",
    path: "/interview",
    color: "from-blue-500/20 to-blue-500/0",
    barColor: "#3b82f6",
  },
  {
    title: "Presentation",
    key: "presentation",
    desc: "Upload your slides, present to the camera, then face a short viva on your topic.",
    path: "/presentation",
    color: "from-cyan-500/20 to-cyan-500/0",
    barColor: "#22d3ee",
  },
  {
    title: "Stage Speech",
    key: "stagespeech",
    desc: "Practice a stage speech with confidence, gesture and eye-contact scoring.",
    path: "/stagespeech",
    color: "from-yellow-500/20 to-yellow-500/0",
    barColor: "#eab308",
  },
  {
    title: "Group Discussion",
    key: "gd",
    desc: "Join a simulated group discussion with AI participants and get evaluated.",
    path: "/gd",
    color: "from-emerald-500/20 to-emerald-500/0",
    barColor: "#10b981",
  },
];

const MODE_LABELS = {
  interview: "Interview",
  presentation: "Presentation",
  stagespeech: "Stage Speech",
  gd: "Group Discussion",
};

const QUICK_QUESTIONS = [
  "Am I becoming better at interviews?",
  "Which area am I weakest in?",
  "Compare my first and latest attempts.",
  "What should I practice next?",
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedMode, setSelectedMode] = useState("interview");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Confid Coach state
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachInput, setCoachInput] = useState("");
  const [coachMessages, setCoachMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm Confid Coach. Ask me about your interview, presentation, stage speech, or GD performance. I'll use your recorded sessions to give you an honest answer.",
    },
  ]);
  const [coachLoading, setCoachLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetchSessionHistory(user.userId).then((data) => {
      setHistory(data);
      setLoadingHistory(false);
    });
  }, [user]);

  const avgScore = history.length
    ? Math.round(
        history.reduce((sum, s) => sum + (s.overall_score || 0), 0) /
          history.length
      )
    : null;

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

  const modeAverages = useMemo(() => {
    return MODES.map((m) => {
      const sessions = history.filter((s) => s.mode === m.key);
      const avg = sessions.length
        ? Math.round(
            sessions.reduce(
              (sum, s) => sum + (s.overall_score || 0),
              0
            ) / sessions.length
          )
        : 0;

      return {
        mode: m.title,
        key: m.key,
        avg,
        count: sessions.length,
        barColor: m.barColor,
      };
    });
  }, [history]);

  async function askCoach(question = coachInput) {
    const trimmed = question.trim();

    if (!trimmed || coachLoading) return;

    setCoachMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
    ]);

    setCoachInput("");
    setCoachLoading(true);

    try {
      const token = localStorage.getItem("confidai_token");

      const res = await fetch(`${API_BASE}/api/coach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: trimmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Coach request failed.");
      }

      setCoachMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.answer ||
            "I couldn't generate an answer from your session history.",
        },
      ]);
    } catch (err) {
      console.error(err);

      setCoachMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I couldn't connect to Confid Coach right now. Please try again.",
        },
      ]);
    } finally {
      setCoachLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setDeleteError("");

    try {
      const token = localStorage.getItem("confidai_token");

      const res = await fetch(`${API_BASE}/api/account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || "Failed to delete account.");
        setDeleteLoading(false);
        return;
      }

      logout();
      navigate("/");
    } catch (err) {
      console.error(err);
      setDeleteError("Could not reach the server.");
      setDeleteLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-cyan-400 text-sm font-medium mb-2">
          Welcome back, {user?.userId}
        </p>

        <h1 className="text-3xl font-bold mb-1">
          What are you practicing today?
        </h1>

        <p className="text-gray-400 mb-10">
          Choose a mode to begin a trial session.
        </p>

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

        {/* CONFID COACH */}
        <section className="mb-12">
          <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent p-7">
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-xl">
                    🤖
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">
                      Confid Coach
                    </h2>
                    <p className="text-xs text-cyan-300/80">
                      Your honest AI performance coach
                    </p>
                  </div>
                </div>

                <p className="text-gray-400 max-w-2xl text-sm leading-6">
                  Ask about your progress across interviews, presentations,
                  stage speeches, and group discussions. Confid Coach will
                  use your recorded performance to give you evidence-based
                  feedback.
                </p>
              </div>

              <button
                onClick={() => setCoachOpen((prev) => !prev)}
                className="shrink-0 px-6 py-3 rounded-xl bg-cyan-400 text-slate-950 font-semibold hover:bg-cyan-300 transition"
              >
                {coachOpen ? "Close Coach" : "Ask Confid Coach"}
              </button>
            </div>

            {coachOpen && (
              <div className="relative mt-7 rounded-2xl border border-white/10 bg-slate-950/70 overflow-hidden">
                <div className="h-[380px] overflow-y-auto p-5 space-y-4">
                  {coachMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                          message.role === "user"
                            ? "bg-cyan-400 text-slate-950"
                            : "bg-white/5 border border-white/10 text-gray-200"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}

                  {coachLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl px-4 py-3 bg-white/5 border border-white/10 text-gray-400 text-sm">
                        Analyzing your performance...
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 p-4">
                  <div className="flex gap-2 overflow-x-auto pb-3">
                    {QUICK_QUESTIONS.map((question) => (
                      <button
                        key={question}
                        onClick={() => askCoach(question)}
                        disabled={coachLoading}
                        className="whitespace-nowrap px-3 py-2 rounded-lg border border-white/10 text-xs text-gray-300 hover:bg-white/5 hover:border-cyan-400/30 disabled:opacity-50 transition"
                      >
                        {question}
                      </button>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      askCoach();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={coachInput}
                      onChange={(e) => setCoachInput(e.target.value)}
                      placeholder="Ask about your performance..."
                      className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-cyan-400/50 placeholder:text-gray-600"
                    />

                    <button
                      type="submit"
                      disabled={!coachInput.trim() || coachLoading}
                      className="px-5 rounded-xl bg-cyan-400 text-slate-950 font-semibold text-sm disabled:opacity-40 hover:bg-cyan-300 transition"
                    >
                      Ask
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </section>

        {!loadingHistory && history.length > 0 && (
          <div className="border-t border-white/10 pt-10 mb-12">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-xl font-semibold">Average score by mode</h2>

              {avgScore !== null && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Overall average</p>
                  <p className="text-2xl font-bold text-cyan-300">
                    {avgScore}
                  </p>
                </div>
              )}
            </div>

            <div
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
              style={{ height: 280 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modeAverages}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                  />

                  <XAxis
                    dataKey="mode"
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={12}
                  />

                  <YAxis
                    domain={[0, 100]}
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={12}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: "#e5e7eb" }}
                    formatter={(value, name, props) => [
                      props.payload.count ? value : "No sessions yet",
                      "Average score",
                    ]}
                  />

                  <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                    {modeAverages.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={
                          entry.count
                            ? entry.barColor
                            : "rgba(255,255,255,0.08)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {!loadingHistory && history.length > 0 && (
          <div className="border-t border-white/10 pt-10 mb-12">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-xl font-semibold">Progress over time</h2>
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

            <div
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
              style={{ height: 280 }}
            >
              {modeTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  No {MODE_LABELS[selectedMode]} sessions yet.
                </div>
              ) : modeTrend.length === 1 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <p className="text-sm text-gray-500 mb-1">
                    Only one {MODE_LABELS[selectedMode]} session so far
                  </p>

                  <p className="text-4xl font-bold text-cyan-300">
                    {modeTrend[0].score}
                  </p>

                  <p className="text-xs text-gray-600 mt-1">
                    Complete another session to see your trend
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modeTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.08)"
                    />

                    <XAxis
                      dataKey="attempt"
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={12}
                    />

                    <YAxis
                      domain={[0, 100]}
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={12}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                      labelStyle={{ color: "#e5e7eb" }}
                      formatter={(value) => [value, "Score"]}
                      labelFormatter={(label, payload) =>
                        payload?.[0]
                          ? `${label} - ${payload[0].payload.date}`
                          : label
                      }
                    />

                    <Bar
                      dataKey="score"
                      radius={[6, 6, 0, 0]}
                      fill="url(#trendGradient)"
                    />

                    <defs>
                      <linearGradient
                        id="trendGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
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

        <div className="border-t border-white/10 pt-10 mb-12">
          <h2 className="text-xl font-semibold mb-6">Recent sessions</h2>

          {loadingHistory ? (
            <p className="text-gray-500 text-sm">
              Loading your session history...
            </p>
          ) : history.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No sessions yet - complete a practice session above and it will
              show up here.
            </p>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] divide-y divide-white/10">
              {history.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div>
                    <p className="font-medium">
                      {MODE_LABELS[s.mode] || s.mode}
                    </p>

                    <p className="text-sm text-gray-500">
                      {s.topic_or_role || "-"}
                    </p>

                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(s.created_at).toLocaleString()}
                    </p>
                  </div>

                  <p className="text-2xl font-bold text-cyan-300">
                    {s.overall_score}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-rose-500/20 pt-10">
          <h2 className="text-xl font-semibold mb-2 text-rose-400">
            Danger zone
          </h2>

          <p className="text-gray-500 text-sm mb-4">
            Permanently delete your account and all session history. This
            cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-5 py-2.5 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 font-semibold text-sm"
            >
              Delete my account and data
            </button>
          ) : (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 max-w-md">
              <p className="text-sm text-gray-200 mb-4">
                Are you sure? This will permanently delete your account, all
                session history, and cannot be undone.
              </p>

              {deleteError && (
                <p className="text-sm text-rose-400 mb-3">
                  {deleteError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-semibold text-sm"
                >
                  {deleteLoading ? "Deleting..." : "Yes, delete everything"}
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteLoading}
                  className="px-4 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/5 font-semibold text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
```
