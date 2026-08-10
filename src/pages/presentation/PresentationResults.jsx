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
} from "../../utils/analysis.js";

export default function PresentationResults() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const savedRef = useRef(false);

  if (!state) { navigate("/presentation"); return null; }

  const { samples = [], transcript = "", vivaTranscript = "", topic } = state;
  const confidence = computeConfidenceScore(samples);
  const eyeContact = computeEyeContactScore(samples);
  const gesture = computeGestureScore(samples);
  const explanation = computeCommunicationScore(transcript + " " + vivaTranscript);
  const overall = computeOverallScore({ confidence, eyeContact, gesture, explanation });

  useEffect(() => {
    if (savedRef.current || !user) return;
    savedRef.current = true;
    saveSession({
      userId: user.userId,
      mode: "presentation",
      topicOrRole: topic,
      overallScore: overall,
      confidence,
      eyeContact,
      gesture,
      communication: explanation,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-1">Presentation results</h1>
        <p className="text-gray-400 mb-8">{topic}</p>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6 text-center">
          <p className="text-sm text-gray-400 mb-1">Overall score</p>
          <p className="text-5xl font-bold text-cyan-300">{overall}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <ScoreCard label="Confidence" score={confidence} />
          <ScoreCard label="Eye contact" score={eyeContact} />
          <ScoreCard label="Gesture (beta)" score={gesture} />
          <ScoreCard label="Explanation of topic" score={explanation} />
        </div>

        <button onClick={() => navigate("/dashboard")} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90">Back to dashboard</button>
      </main>
    </div>
  );
}