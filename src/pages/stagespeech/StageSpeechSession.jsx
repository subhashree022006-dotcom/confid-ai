import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import CameraFeed from "../../components/CameraFeed.jsx";
import AudioLevelMeter from "../../components/AudioLevelMeter.jsx";
import EndSessionButton from "../../components/EndSessionButton.jsx";
import { createContinuousRecognizer } from "../../utils/speech.js";

export default function StageSpeechSession() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(true);
  const samplesRef = useRef([]);
  const recognizerRef = useRef(null);

  useEffect(() => {
    if (!state) { navigate("/stagespeech"); return; }
    if (state.mode === "voice") {
      recognizerRef.current = createContinuousRecognizer((t) => setTranscript((p) => (p + " " + t).trim()));
      recognizerRef.current?.start();
    }
    return () => recognizerRef.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finishSpeech() {
    recognizerRef.current?.stop();
    setRecording(false);
    navigate("/stagespeech/results", { state: { ...state, samples: samplesRef.current, transcript: transcript.trim() } });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold">Speaking on: {state?.topic}</h1>
          <AudioLevelMeter active={recording && state?.mode === "voice"} />
        </div>
        <p className="text-gray-400 mb-4 text-sm">
          {state?.mode === "voice" ? "Deliver your speech naturally — transcribed live below." : "Type your speech as you go."}
        </p>
        <CameraFeed active={recording} onSample={(s) => samplesRef.current.push(s)} />

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          {state?.mode === "voice" ? (
            <div className="max-h-40 overflow-y-auto text-sm text-gray-300">
              {transcript || "Start speaking — your words will appear here..."}
            </div>
          ) : (
            <textarea
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 h-32 text-sm"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Type your speech here..."
            />
          )}
        </div>

        <div className="mt-4 space-y-2">
          <button onClick={finishSpeech} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90">Finish speech</button>
          <EndSessionButton onEnd={finishSpeech} label="End speech early" />
        </div>
      </main>
    </div>
  );
}