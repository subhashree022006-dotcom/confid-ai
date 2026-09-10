import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import ScoreCard from "../../components/ScoreCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { saveSession, uploadInterviewVideo, fetchSessionHistory } from "../../utils/sessionApi.js";
import {
  computeEyeContactScore,
  computeGestureScore,
  computeCommunicationScoreFallback,
  computeOverallScore,
  buildBehavioralSummary,
} from "../../utils/analysis.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function InterviewResults() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const savedRef = useRef(false);
  const videoUploadRef = useRef(false);
  const videoRef = useRef(null);
  const [analyzing, setAnalyzing] = useState(true);
  const [aiResult, setAiResult] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [previousSession, setPreviousSession] = useState(null);

  if (!state) {
    navigate("/interview");
    return null;
  }

  const { samples, transcript, messages, form, videoBlob } = state;
  const eyeContact = computeEyeContactScore(samples);
  const gesture = computeGestureScore(samples);
  const behavioralSummary = buildBehavioralSummary(samples);

  // Rough session duration from the behavioral sample timestamps (ms apart, first to last)
  const sessionDurationSeconds =
    samples && samples.length > 1
      ? Math.round((samples[samples.length - 1].timestamp - samples[0].timestamp) / 1000)
      : null;

  // Fetch the previous interview session (for its goals) once we know the user.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchSessionHistory(user.userId).then((history) => {
      if (cancelled) return;
      const previousInterview = (history || []).find((s) => s.mode === "interview");
      if (previousInterview) setPreviousSession(previousInterview);
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
            mode: "interview",
            context: `Interviewing for ${form?.position || "a role"} at ${form?.company || "a company"}`,
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
            hireProbability: null,
            starScore: 0,
            starFeedback: "",
            goals: [],
            fillerWordCount: 0,
            speakingPaceWpm: null,
          });
          setAnalyzing(false);
        }
      }
    }

    // Wait for the previous-session lookup to resolve (or fail) before analyzing,
    // so previousGoals context is available on the first request. If the user
    // has no history, previousSession stays null and previousGoals is just null.
    analyze();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previousSession]);

  useEffect(() => {
    if (videoUploadRef.current || !videoBlob) return;
    videoUploadRef.current = true;
    setVideoUploading(true);
    uploadInterviewVideo(videoBlob).then((result) => {
      if (result.ok) {
        setVideoUrl(result.url);
      } else {
        console.error("Video upload failed:", result.error);
      }
      setVideoUploading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confidence = aiResult?.confidence ?? null;
  const communication = aiResult?.communication ?? computeCommunicationScoreFallback(transcript);
  const hireProbability = aiResult?.hireProbability ?? null;
  const starScore = aiResult?.starScore ?? 0;
  const fillerWordCount = aiResult?.fillerWordCount ?? 0;
  const speakingPaceWpm = aiResult?.speakingPaceWpm ?? null;
  const goals = aiResult?.goals ?? [];

  const overall = confidence !== null
    ? computeOverallScore({ confidence, eyeContact, gesture, communication })
    : computeOverallScore({ eyeContact, gesture, communication });

  useEffect(() => {
    if (savedRef.current || !user || analyzing || videoUploading) return;
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
      videoUrl,
      fillerWordCount,
      speakingPaceWpm,
      starScore,
      goals,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyzing, videoUploading]);

  function jumpToMoment(timestamp) {
    if (!videoRef.current) return;
    videoRef.current.currentTime = timestamp;
    videoRef.current.play();
  }

  // Compares this session's metrics against the previous session's goals,
  // to show a simple ✅/⚠️ outcome for each goal the user was working on.
  function evaluateGoalOutcome(goalTitle) {
    const title = goalTitle.toLowerCase();
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
        ? { met: true, note: `STAR structure improved to ${starScore}% (was ${previousSession.star_score}%).` }
        : { met: false, note: `STAR structure still at ${starScore}% (was ${previousSession.star_score}%).` };
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

        {videoBlob && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">Session recording</p>
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full rounded-lg bg-black aspect-video"
              />
            ) : (
              <div className="w-full rounded-lg bg-black/40 aspect-video flex items-center justify-center text-sm text-gray-500">
                {videoUploading ? "Uploading recording..." : "Recording unavailable."}
              </div>
            )}
          </div>
        )}

        {videoUrl && messages && messages.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 mb-6">
            <p className="text-sm text-gray-400 mb-3">Transcript</p>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i} className="flex items-start gap-3">
                  <button
                    onClick={() => jumpToMoment(m.timestamp)}
                    className="shrink-0 text-xs font-mono px-2 py-1 rounded bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                  >
                    ▶ {formatTime(m.timestamp)}
                  </button>
                  <div>
                    <span className="text-xs font-semibold uppercase mr-2 text-gray-500">
                      {m.role === "assistant" ? "HR" : "You"}
                    </span>
                    <span className={m.role === "assistant" ? "text-gray-200" : "text-cyan-300"}>
                      {m.content}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6 text-center">
          <p className="text-sm text-gray-400 mb-1">Overall score</p>
          <p className="text-5xl font-bold text-cyan-300">{overall}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <ScoreCard label="Confidence" score={confidence ?? 0} />
          <ScoreCard label="Eye contact" score={eyeContact} />
          <ScoreCard label="Gesture" score={gesture} />
          <ScoreCard label="Communication" score={communication} />
          <ScoreCard label="STAR structure" score={starScore} />
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

        {aiResult?.starFeedback && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6">
            <p className="text-sm text-gray-400 mb-2">STAR structure feedback</p>
            <p className="text-gray-200">{aiResult.starFeedback}</p>
          </div>
        )}

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