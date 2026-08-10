import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import ScoreCard from "../../components/ScoreCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { saveSession } from "../../utils/sessionApi.js";
import {
  computeConfidenceScore,
  computeEyeContactScore,
  computeGestureScore,
  computeCommunicationScore,
  computeOverallScore,
  computeHireProbability,
} from "../../utils/analysis.js";

export default function InterviewResults() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const savedRef = useRef(false);

  if (!state) {
    navigate("/interview");
    return null;
  }

  const { samples, transcript, form } = state;
  const confidence = computeConfidenceScore(samples);
  const eyeContact = computeEyeContactScore(samples);
  const gesture = computeGestureScore(samples);
  const communication = computeCommunicationScore(transcript);
  const overall = computeOverallScore({ confidence, eyeContact, gesture, communication });
  const hireProbability = computeHireProbability({ confidence, eyeContact, communication, gesture });

  useEffect(() => {
    if (savedRef.current || !user) return;
    savedRef.current = true;
    saveSession({
      userId: user.userId,
      mode: "interview",
      topicOrRole: `${form?.position || ""} at ${form?.company || ""}`.trim(),
      overallScore: overall,
      confidence,
      eyeContact,
      gesture,
      communication,
      hireProbability,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <ScoreCard label="Confidence" score={confidence} />
          <ScoreCard label="Eye contact" score={eyeContact} />
          <ScoreCard label="Gesture (beta)" score={gesture} />
          <ScoreCard label="Communication" score={communication} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6">
          <p className="text-sm text-gray-400 mb-1">Probability of getting hired (estimate)</p>
          <p className="text-3xl font-semibold text-emerald-400">{hireProbability}%</p>
        </div>

        <button onClick={() => navigate("/dashboard")} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90">
          Back to dashboard
        </button>
      </main>
    </div>
  );
}