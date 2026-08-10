import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import CameraFeed from "../../components/CameraFeed.jsx";
import AudioLevelMeter from "../../components/AudioLevelMeter.jsx";
import EndSessionButton from "../../components/EndSessionButton.jsx";
import { createContinuousRecognizer } from "../../utils/speech.js";

const MAX_DURATION_MS = 30 * 60 * 1000;

export default function PresentationSession() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(true);
  const [elapsedLabel, setElapsedLabel] = useState("30:00");
  const samplesRef = useRef([]);
  const recognizerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const durationTimerRef = useRef(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!state) { navigate("/presentation"); return; }
    if (state.mode === "voice") {
      recognizerRef.current = createContinuousRecognizer((t) => setTranscript((p) => (p + " " + t).trim()));
      recognizerRef.current?.start();
    }
    startTimeRef.current = Date.now();
    durationTimerRef.current = setInterval(() => {
      const remainingMs = MAX_DURATION_MS - (Date.now() - startTimeRef.current);
      if (remainingMs <= 0) {
        clearInterval(durationTimerRef.current);
        finishPresentation();
        return;
      }
      const mins = Math.floor(remainingMs / 60000);
      const secs = Math.floor((remainingMs % 60000) / 1000);
      setElapsedLabel(`${mins}:${secs.toString().padStart(2, "0")}`);
    }, 1000);
    return () => {
      recognizerRef.current?.stop();
      clearInterval(durationTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finishPresentation() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    recognizerRef.current?.stop();
    clearInterval(durationTimerRef.current);
    setRecording(false);
    navigate("/presentation/viva", { state: { ...state, samples: samplesRef.current, transcript: transcript.trim() } });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold">Presenting: {state?.topic}</h1>
          {state?.mode === "voice" && <AudioLevelMeter active={recording} />}
        </div>
        <p className="text-gray-400 mb-4 text-sm">
          {state?.mode === "voice" ? "Speak naturally - transcribed live below." : "Type what you are presenting as you go."} &middot; {elapsedLabel} remaining
        </p>
        <CameraFeed active={recording} onSample={(s) => samplesRef.current.push(s)} />

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          {state?.mode === "voice" ? (
            <div className="max-h-40 overflow-y-auto text-sm text-gray-300">
              {transcript || "Start speaking - your words will appear here..."}
            </div>
          ) : (
            <textarea
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 h-32 text-sm"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Type your presentation content here..."
            />
          )}
        </div>

        <div className="mt-4 space-y-2">
          <button onClick={finishPresentation} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90">
            Finish presentation to go to viva
          </button>
          <EndSessionButton onEnd={finishPresentation} label="End presentation early" />
        </div>
      </main>
    </div>
  );
}