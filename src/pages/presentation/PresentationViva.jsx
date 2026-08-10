import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import AudioLevelMeter from "../../components/AudioLevelMeter.jsx";
import EndSessionButton from "../../components/EndSessionButton.jsx";
import { askAI, buildVivaSystemPrompt } from "../../utils/aiChat.js";
import { speak, createContinuousRecognizer } from "../../utils/speech.js";

const SILENCE_AUTO_SUBMIT_MS = 3000;
const MAX_DURATION_MS = 15 * 60 * 1000;

export default function PresentationViva() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [liveCaption, setLiveCaption] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [elapsedLabel, setElapsedLabel] = useState("15:00");

  const messagesRef = useRef([]);
  const recognizerRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const captionRef = useRef("");
  const startTimeRef = useRef(Date.now());
  const durationTimerRef = useRef(null);
  const finishedRef = useRef(false);
  const busyRef = useRef(false);
  const systemPrompt = useRef(buildVivaSystemPrompt(state || {}));

  function updateMessages(next) {
    messagesRef.current = next;
    setMessages(next);
  }

  useEffect(() => {
    if (!state) navigate("/presentation");
    return () => {
      clearInterval(durationTimerRef.current);
      clearTimeout(silenceTimerRef.current);
      recognizerRef.current?.stop();
    };
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
      silenceTimerRef.current = setTimeout(() => submitVoiceAnswer(), SILENCE_AUTO_SUBMIT_MS);
    });
    recognizerRef.current.start();
  }

  function submitVoiceAnswer() {
    const finalAnswer = captionRef.current.trim();
    if (!finalAnswer) return;
    recognizerRef.current?.stop();
    handleAnswer(finalAnswer);
  }

  async function ask() {
    if (finishedRef.current || timeIsUp() || busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    setAiError(false);
    const history = messagesRef.current;
    try {
      const reply = await askAI(history.length ? history : [{ role: "user", content: "Begin the viva." }], systemPrompt.current);
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

  function retry() { ask(); }

  function startViva() {
    setStarted(true);
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
    ask();
  }

  function handleAnswer(text) {
    if (finishedRef.current || busyRef.current) return;
    const next = [...messagesRef.current, { role: "user", content: text }];
    updateMessages(next);
    setTextAnswer("");
    captionRef.current = "";
    setLiveCaption("");
    if (timeIsUp()) { finish(); return; }
    ask();
  }

  function submitTextAnswer() {
    if (!textAnswer.trim()) return;
    handleAnswer(textAnswer.trim());
  }

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearInterval(durationTimerRef.current);
    clearTimeout(silenceTimerRef.current);
    recognizerRef.current?.stop();
    const vivaTranscript = messagesRef.current.filter((m) => m.role === "user").map((m) => m.content).join(" ");
    navigate("/presentation/results", { state: { ...state, vivaTranscript } });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-semibold">Ask viva</h1>
          {started && state?.mode === "voice" && <AudioLevelMeter active={true} />}
        </div>
        <p className="text-gray-400 mb-6">The invigilator will ask questions about "{state?.topic}". {started ? `${elapsedLabel} remaining` : ""}</p>
        {!started ? (
          <button onClick={startViva} className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold">Start viva</button>
        ) : (
          <div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3 max-h-72 overflow-y-auto mb-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "assistant" ? "text-gray-200" : "text-cyan-300"}>
                  <span className="text-xs font-semibold uppercase mr-2 text-gray-500">{m.role === "assistant" ? "Invigilator" : "You"}</span>
                  {m.content}
                </div>
              ))}
              {loading && <p className="text-sm text-gray-500">Thinking...</p>}
              {aiError && (
                <div className="text-sm text-rose-400">
                  Could not reach the AI service.{" "}
                  <button onClick={retry} className="underline text-cyan-300">Retry</button>
                </div>
              )}
            </div>
            {state?.mode === "voice" ? (
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 min-h-[3rem] text-sm text-gray-300">
                {liveCaption || (loading ? "Waiting for the next question..." : "Listening...")}
              </div>
            ) : (
              <>
                <textarea className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 h-20" value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} placeholder="Your answer" />
                <button onClick={submitTextAnswer} disabled={loading || !textAnswer.trim()} className="mt-3 w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold disabled:opacity-50">Submit answer</button>
              </>
            )}
            <div className="mt-2">
              <EndSessionButton onEnd={() => finish()} label="Skip viva / end now" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}