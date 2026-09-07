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

export default function InterviewResults() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const savedRef = useRef(false);
  const [analyzing, setAnalyzing] = useState(true);
  const [aiResult, setAiResult] = useState(null);

  if (!state) {
    navigate("/interview");
    return null;
  }

  const { samples, transcript, form } = state;
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
            mode: "interview",
            context: `Interviewing for ${form?.position || "a role"} at ${form?.company || "a company"}`,
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
            hireProbability: null,
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
  const hireProbability = aiResult?.hireProbability ?? null;

  const overall = confidence !== null
    ? computeOverallScore({ confidence, eyeContact, gesture, communication })
    : computeOverallScore({ eyeContact, gesture, communication });

  useEffect(() => {
    if (savedRef.current || !user || analyzing) return;
    savedRef.current = true;
    saveSession({
      mode: "interview",
      topicOrRole: `${form?.position || ""} at ${form?.company || ""}`.trim(),
      overallScore: overall,
      confidence: confidence ?? 0,
      eyeContact,
      gesture,
      communication,
      hireProbability: hireProbability ?? 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyzing]);

  if (analyzing) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Analyzing your interview...</p>
          <p className="text-sm text-gray-500">This takes a few seconds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-1">Interview results</h1>
        <p className="text-gray-400 mb-8">{form?.position} at {form?.company}</p>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6 text-center">
          <p className="text-sm text-gray-400 mb-1">Overall score</p>
          <p className="text-5xl font-bold text-cyan-300">{overall}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <ScoreCard label="Confidence" score={confidence ?? 0} />
          <ScoreCard label="Eye contact" score={eyeContact} />
          <ScoreCard label="Gesture" score={gesture} />
          <ScoreCard label="Communication" score={communication} />
        </div>

        {aiResult?.reasoning && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6">
            <p className="text-sm text-gray-400 mb-2">Coach feedback</p>
            <p className="text-gray-200">{aiResult.reasoning}</p>
          </div>
        )}

        {hireProbability !== null && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6">
            <p className="text-sm text-gray-400 mb-1">Estimated hire likelihood</p>
            <p className="text-3xl font-semibold text-emerald-400">{hireProbability}%</p>
            <p className="text-xs text-gray-500 mt-1">This is an AI estimate for practice purposes, not a guarantee.</p>
          </div>
        )}

        <button onClick={() => navigate("/dashboard")} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90">
          Back to dashboard
        </button>
      </main>
    </div>
  );
}
