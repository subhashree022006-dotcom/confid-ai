import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import CameraFeed from "../../components/CameraFeed.jsx";
import AudioLevelMeter from "../../components/AudioLevelMeter.jsx";
import EndSessionButton from "../../components/EndSessionButton.jsx";
import { askAI, buildGDSystemPrompt } from "../../utils/aiChat.js";
import { speak, createContinuousRecognizer } from "../../utils/speech.js";

const SILENCE_AUTO_SUBMIT_MS = 3000;
const MAX_DURATION_MS = 30 * 60 * 1000;

export default function GDSession() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [round, setRound] = useState(0);
  const [liveCaption, setLiveCaption] = useState("");
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [elapsedLabel, setElapsedLabel] = useState("30:00");

  const messagesRef = useRef([]);
  const samplesRef = useRef([]);
  const recognizerRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const captionRef = useRef("");
  const startTimeRef = useRef(Date.now());
  const durationTimerRef = useRef(null);
  const finishedRef = useRef(false);
  const busyRef = useRef(false);
  const systemPrompt = useRef(buildGDSystemPrompt(state || {}));

  function updateMessages(next) {
    messagesRef.current = next;
    setMessages(next);
  }

  useEffect(() => {
    if (!state) { navigate("/gd"); return; }

    startTimeRef.current = Date.now();
    durationTimerRef.current = setInterval(() => {
      const remainingMs = MAX_DURATION_MS - (Date.now() - startTimeRef.current);
      if (remainingMs <= 0) {
        clearInterval(durationTimerRef.current);
        finish();
        return;
      }
      const mins = Math.floor(remainingMs / 60000);
      const secs = Math.floor((remainingMs % 60000) / 1000);
      setElapsedLabel(`${mins}:${secs.toString().padStart(2, "0")}`);
    }, 1000);

    runGroupTurn();

    return () => {
      clearInterval(durationTimerRef.current);
      clearTimeout(silenceTimerRef.current);
      recognizerRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function timeIsUp() {
    return Date.now() - startTimeRef.current >= MAX_DURATION_MS;
  }

  function startListening() {
    if (finishedRef.current) return;
    captionRef.current = "";
    setLiveCaption("");
    recognizerRef.current = createContinuousRecognizer((text) => {
      captionRef.current = (captionRef.current + " " + text).trim();
      setLiveCaption(captionRef.current);
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => submitVoiceTurn(), SILENCE_AUTO_SUBMIT_MS);
    });
    recognizerRef.current.start();
  }

  function submitVoiceTurn() {
    const finalText = captionRef.current.trim();
    if (!finalText) return;
    recognizerRef.current?.stop();
    handleTurn(finalText);
  }

  async function runGroupTurn() {
    if (finishedRef.current || timeIsUp() || busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    setAiError(false);
    const history = messagesRef.current;
    try {
      const reply = await askAI(history.length ? history : [{ role: "user", content: "Start the discussion." }], systemPrompt.current);
      if (finishedRef.current) return;
      const next = [...history, { role: "assistant", content: reply }];
      updateMessages(next);
      if (state?.mode === "voice") {
        await speak(reply);
        if (!finishedRef.current && !timeIsUp()) startListening();
        else if (!finishedRef.current) finish();
      }
    } catch {
      setAiError(true);
    } finally {
      setLoading(false);
      busyRef.current = false;
    }
  }

  function handleTurn(text) {
    if (finishedRef.current || busyRef.current) return;
    const next = [...messagesRef.current, { role: "user", content: text }];
    updateMessages(next);
    setTextInput("");
    captionRef.current = "";
    setLiveCaption("");
    setRound((r) => r + 1);
    if (timeIsUp()) { finish(); return; }
    runGroupTurn();
  }

  function submitTextTurn() {
    if (!textInput.trim()) return;
    handleTurn(textInput.trim());
  }

  function retry() {
    runGroupTurn();
  }

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearInterval(durationTimerRef.current);
    clearTimeout(silenceTimerRef.current);
    recognizerRef.current?.stop();
    setFinished(true);
    const userTranscript = messagesRef.current.filter((m) => m.role === "user").map((m) => m.content).join(" ");
    navigate("/gd/results", { state: { ...state, samples: samplesRef.current, transcript: userTranscript } });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8 grid md:grid-cols-2 gap-6">
        <div>
          <CameraFeed active={!finished} onSample={(s) => samplesRef.current.push(s)} />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">Round {round} &middot; {elapsedLabel} left</p>
            {state?.mode === "voice" && <AudioLevelMeter active={!finished} />}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3 overflow-y-auto max-h-96">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "assistant" ? "text-gray-200" : "text-cyan-300"}>
                <span className="text-xs font-semibold uppercase mr-2 text-gray-500">{m.role === "assistant" ? "Group" : "You"}</span>
                {m.content}
              </div>
            ))}
            {loading && <p className="text-sm text-gray-500">Group is discussing...</p>}
            {aiError && (
              <div className="text-sm text-rose-400">
                Could not reach the AI service.{" "}
                <button onClick={retry} className="underline text-cyan-300">Retry</button>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {state?.mode === "voice" ? (
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 min-h-[3rem] text-sm text-gray-300">
                {liveCaption || (loading ? "Waiting for the group..." : "Listening - jump in when ready...")}
              </div>
            ) : (
              <>
                <textarea className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 h-20" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Jump into the discussion" />
                <button onClick={submitTextTurn} disabled={loading || !textInput.trim()} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold disabled:opacity-50">Speak</button>
              </>
            )}
            <EndSessionButton onEnd={() => finish()} label="End discussion now" />
          </div>
        </div>
      </main>
    </div>
  );
}