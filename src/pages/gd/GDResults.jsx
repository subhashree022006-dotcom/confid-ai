import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import ScoreCard from "../../components/ScoreCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { saveSession, fetchSessionHistory } from "../../utils/sessionApi.js";
import {
  computeEyeContactScore,
  computeGestureScore,
  computeCommunicationScoreFallback,
  computeOverallScore,
  buildBehavioralSummary,
} from "../../utils/analysis.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function communicationLevel(score) {
  if (score >= 75) return "Advanced";
  if (score >= 45) return "Medium";
  return "Basic";
}

export default function GDResults() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const savedRef = useRef(false);
  const [analyzing, setAnalyzing] = useState(true);
  const [aiResult, setAiResult] = useState(null);
  const [previousSession, setPreviousSession] = useState(null);

  if (!state) { navigate("/gd"); return null; }

  const { samples = [], transcript = "", topic, position } = state;
  const eyeContact = computeEyeContactScore(samples);
  const gesture = computeGestureScore(samples);
  const behavioralSummary = buildBehavioralSummary(samples);

  const sessionDurationSeconds =
    samples && samples.length > 1
      ? Math.round((samples[samples.length - 1].timestamp - samples[0].timestamp) / 1000)
      : null;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchSessionHistory(user.userId).then((history) => {
      if (cancelled) return;
      const previous = (history || []).find((s) => s.mode === "gd");
      if (previous) setPreviousSession(previous);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function analyze() {
      try {
        let previousGoals = null;
        if (previousSession?.goals) {
          try {
            const parsed = typeof previousSession.goals === "string" ? JSON.parse(previousSession.goals) : previousSession.goals;
            previousGoals = Array.isArray(parsed) ? parsed.map((g) => g.title || g).filter(Boolean) : null;
          } catch {
            previousGoals = null;
          }
        }

        const res = await fetch(`${API_BASE}/api/analyze-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            behavioralSummary,
            mode: "group discussion",
            context: `Group discussion on topic: ${topic || "N/A"}${position ? `, participating as: ${position}` : ""}`,
            sessionDurationSeconds,
            previousGoals,
          }),
        });
        const data = await res.json();
        if (!cancelled) {
          setAiResult(data);
          setAnalyzing(false);
        }
      } catch (err) {
        console.error("AI analysis failed, using fallback:", err);
        if (!cancelled) {
          setAiResult({
            confidence: null,
            communication: computeCommunicationScoreFallback(transcript),
            reasoning: "AI analysis was unavailable, showing basic estimate instead.",
            starScore: 0,
            starFeedback: "",
            goals: [],
            fillerWordCount: 0,
            speakingPaceWpm: null,
            turnTaking: 0,
            listening: 0,
            pressureHandling: 0,
          });
          setAnalyzing(false);
        }
      }
    }

    analyze();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previousSession]);

  const confidence = aiResult?.confidence ?? null;
  const communication = aiResult?.communication ?? computeCommunicationScoreFallback(transcript);
  const level = communicationLevel(communication);
  const starScore = aiResult?.starScore ?? 0;
  const fillerWordCount = aiResult?.fillerWordCount ?? 0;
  const speakingPaceWpm = aiResult?.speakingPaceWpm ?? null;
  const goals = aiResult?.goals ?? [];
  const turnTaking = aiResult?.turnTaking ?? 0;
  const listening = aiResult?.listening ?? 0;
  const pressureHandling = aiResult?.pressureHandling ?? 0;

  const overall = confidence !== null
    ? computeOverallScore({ confidence, eyeContact, gesture, communication })
    : computeOverallScore({ eyeContact, gesture, communication });

  useEffect(() => {
    if (savedRef.current || !user || analyzing) return;
    savedRef.current = true;
    saveSession({
      mode: "gd",
      topicOrRole: position ? `${position} - ${topic}` : topic,
      overallScore: overall,
      confidence: confidence ?? 0,
      eyeContact,
      gesture,
      communication,
      fillerWordCount,
      speakingPaceWpm,
      starScore,
      goals,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyzing]);

  function evaluateGoalOutcome(goalTitle) {
    const title = (goalTitle || "").toLowerCase();
    if (title.includes("filler")) {
      if (!previousSession?.filler_word_count) return null;
      return fillerWordCount < previousSession.filler_word_count
        ? { met: true, note: `Filler words dropped to ${fillerWordCount} (was ${previousSession.filler_word_count}).` }
        : { met: false, note: `Filler words still at ${fillerWordCount} (was ${previousSession.filler_word_count}).` };
    }
    if (title.includes("pace") || title.includes("slow") || title.includes("speed")) {
      if (!speakingPaceWpm) return null;
      const inRange = speakingPaceWpm >= 100 && speakingPaceWpm <= 160;
      return inRange
        ? { met: true, note: `Pace is now ${speakingPaceWpm} wpm.` }
        : { met: false, note: `Pace is ${speakingPaceWpm} wpm — still outside 100-160.` };
    }
    if (title.includes("star") || title.includes("structure") || title.includes("example")) {
      if (!previousSession?.star_score && previousSession?.star_score !== 0) return null;
      return starScore > previousSession.star_score
        ? { met: true, note: `Structure improved to ${starScore}% (was ${previousSession.star_score}%).` }
        : { met: false, note: `Structure still at ${starScore}% (was ${previousSession.star_score}%).` };
    }
    return null;
  }

  let previousGoalsList = [];
  if (previousSession?.goals) {
    try {
      const parsed = typeof previousSession.goals === "string" ? JSON.parse(previousSession.goals) : previousSession.goals;
      previousGoalsList = Array.isArray(parsed) ? parsed : [];
    } catch {
      previousGoalsList = [];
    }
  }

  if (analyzing) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Analyzing your discussion...</p>
          <p className="text-sm text-gray-500">This takes a few seconds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-1">Group discussion results</h1>
        <p className="text-gray-400 mb-8">{position ? `${position} - ` : ""}{topic}</p>

        {previousGoalsList.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6">
            <p className="text-sm text-gray-400 mb-3">How you did on last time's goals</p>
            <div className="space-y-2">
              {previousGoalsList.map((goal, i) => {
                const outcome = evaluateGoalOutcome(goal.title || "");
                return (
                  <div key={i} className="text-sm">
                    <span className="mr-2">
                      {outcome === null ? "•" : outcome.met ? "✅" : "⚠️"}
                    </span>
                    <span className={outcome?.met ? "text-emerald-300" : outcome === null ? "text-gray-300" : "text-amber-300"}>
                      {goal.title}
                    </span>
                    {outcome && <span className="text-gray-500"> — {outcome.note}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6 text-center">
          <p className="text-sm text-gray-400 mb-1">Overall performance</p>
          <p className="text-5xl font-bold text-cyan-300">{overall}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <ScoreCard label="Confidence" score={confidence ?? 0} />
          <ScoreCard label="Eye contact" score={eyeContact} />
          <ScoreCard label="Gesture" score={gesture} />
          <ScoreCard label="Communication" score={communication} />
        </div>

        <p className="text-sm text-gray-400 mb-2 mt-2">Panel discussion skills</p>
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <ScoreCard label="Turn-taking" score={turnTaking} />
          <ScoreCard label="Listening" score={listening} />
          <ScoreCard label="Handling pressure" score={pressureHandling} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-sm text-gray-400 mb-1">Filler words</p>
            <p className="text-2xl font-semibold text-white">{fillerWordCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-sm text-gray-400 mb-1">Speaking pace</p>
            <p className="text-2xl font-semibold text-white">
              {speakingPaceWpm ? `${speakingPaceWpm} wpm` : "N/A"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6">
          <p className="text-sm text-gray-400 mb-1">Communication level</p>
          <p className="text-2xl font-semibold text-cyan-300">{level}</p>
        </div>

        {aiResult?.reasoning && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6">
            <p className="text-sm text-gray-400 mb-2">Coach feedback</p>
            <p className="text-gray-200">{aiResult.reasoning}</p>
          </div>
        )}

        {goals.length > 0 && (
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.04] p-6 mb-6">
            <p className="text-sm text-cyan-300 mb-3 font-semibold">Your goals for next practice</p>
            <div className="space-y-3">
              {goals.map((goal, i) => (
                <div key={i} className="text-sm">
                  <p className="text-white font-medium">{goal.title}</p>
                  <p className="text-gray-400">{goal.action}</p>
                  <p className="text-gray-500 text-xs mt-0.5">Target: {goal.successMetric}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => navigate("/dashboard")} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90">Back to dashboard</button>
      </main>
    </div>
  );
}

