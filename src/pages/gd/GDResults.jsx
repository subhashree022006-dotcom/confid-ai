import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import ScoreCard from "../../components/ScoreCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { saveSession } from "../../utils/sessionApi.js";
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

  if (!state) { navigate("/gd"); return null; }

  const { samples = [], transcript = "", topic, position } = state;
  const eyeContact = computeEyeContactScore(samples);
  const gesture = computeGestureScore(samples);
  const behavioralSummary = buildBehavioralSummary(samples);

  useEffect(() => {
    let cancelled = false;

    async function analyze() {
      try {
        const res = await fetch(`${API_BASE}/api/analyze-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            behavioralSummary,
            mode: "group discussion",
            context: `Group discussion on topic: ${topic || "N/A"}${position ? `, participating as: ${position}` : ""}`,
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
          });
          setAnalyzing(false);
        }
      }
    }

    analyze();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confidence = aiResult?.confidence ?? null;
  const communication = aiResult?.communication ?? computeCommunicationScoreFallback(transcript);
  const level = communicationLevel(communication);

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
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyzing]);

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
        <button onClick={() => navigate("/dashboard")} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90">Back to dashboard</button>
      </main>
    </div>
  );
}
