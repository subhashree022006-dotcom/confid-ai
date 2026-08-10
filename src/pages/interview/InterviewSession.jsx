import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import CameraFeed from "../../components/CameraFeed.jsx";
import AudioLevelMeter from "../../components/AudioLevelMeter.jsx";
import EndSessionButton from "../../components/EndSessionButton.jsx";
import { askAI, buildInterviewerSystemPrompt } from "../../utils/aiChat.js";
import { speak, createContinuousRecognizer } from "../../utils/speech.js";

const SILENCE_AUTO_SUBMIT_MS = 3000;
const MAX_DURATION_MS = 30 * 60 * 1000;

export default function InterviewSession() {
  const { state: form } = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [liveCaption, setLiveCaption] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [elapsedLabel, setElapsedLabel] = useState("30:00");

  // messagesRef is the single source of truth for conversation history used
  // in async logic, avoiding stale-closure bugs where a callback fires with
  // an outdated snapshot of React state. setMessages is only for rendering.
  const messagesRef = useRef([]);
  const samplesRef = useRef([]);
  const recognizerRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const captionRef = useRef("");
  const startTimeRef = useRef(Date.now());
  const durationTimerRef = useRef(null);
  const finishedRef = useRef(false);
  const busyRef = useRef(false); // prevents double-submits
  const systemPrompt = useRef(buildInterviewerSystemPrompt(form || {}));

  function updateMessages(next) {
    messagesRef.current = next;
    setMessages(next);
  }

  useEffect(() => {
    if (!form) { navigate("/interview"); return; }

    startTimeRef.current = Date.now();
    durationTimerRef.current = setInterval(() => {
      const remainingMs = MAX_DURATION_MS - (Date.now() - startTimeRef.current);
      if (remainingMs <= 0) {
        clearInterval(durationTimerRef.current);
        endInterview();
        return;
      }
      const mins = Math.floor(remainingMs / 60000);
      const secs = Math.floor((remainingMs % 60000) / 1000);
      setElapsedLabel(`${mins}:${secs.toString().padStart(2, "0")}`);
    }, 1000);

    askNext();

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
      silenceTimerRef.current = setTimeout(() => {
        submitVoiceAnswer();
      }, SILENCE_AUTO_SUBMIT_MS);
    });
    recognizerRef.current.start();
  }

  function submitVoiceAnswer() {
    const finalAnswer = captionRef.current.trim();
    if (!finalAnswer) return;
    recognizerRef.current?.stop();
    handleAnswer(finalAnswer);
  }

  async function askNext() {
    if (finishedRef.current || timeIsUp() || busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    setAiError(false);
    const history = messagesRef.current;
    try {
      const reply = await askAI(
        history.length === 0 ? [{ role: "user", content: "Begin the interview." }] : history,
        systemPrompt.current
      );
      if (finishedRef.current) return;
      const newMessages = [...history, { role: "assistant", content: reply }];
      updateMessages(newMessages);
      setQuestionCount((c) => c + 1);
      if (form.mode === "voice") {
        await speak(reply);
        if (!finishedRef.current && !timeIsUp()) startListening();
        else if (!finishedRef.current) endInterview();
      }
    } catch (e) {
      setAiError(true);
    } finally {
      setLoading(false);
      busyRef.current = false;
    }
  }

  function handleAnswer(userAnswer) {
    if (finishedRef.current || busyRef.current) return;
    const newMessages = [...messagesRef.current, { role: "user", content: userAnswer }];
    updateMessages(newMessages);
    setTextAnswer("");
    captionRef.current = "";
    setLiveCaption("");
    if (timeIsUp()) { endInterview(); return; }
    askNext();
  }

  function submitTextAnswer() {
    const userAnswer = textAnswer.trim();
    if (!userAnswer) return;
    handleAnswer(userAnswer);
  }

  function retry() {
    askNext();
  }

  function endInterview() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearInterval(durationTimerRef.current);
    clearTimeout(silenceTimerRef.current);
    recognizerRef.current?.stop();
    setFinished(true);
    const fullTranscript = messagesRef.current.filter((m) => m.role === "user").map((m) => m.content).join(" ");
    navigate("/interview/results", { state: { samples: samplesRef.current, transcript: fullTranscript, form } });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8 grid md:grid-cols-2 gap-6">
        <div>
          <CameraFeed active={!finished} onSample={(s) => samplesRef.current.push(s)} />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">Question {questionCount} &middot; {elapsedLabel} left</p>
            {form?.mode === "voice" && <AudioLevelMeter active={!finished} />}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3 overflow-y-auto max-h-96">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "assistant" ? "text-gray-200" : "text-cyan-300"}>
                <span className="text-xs font-semibold uppercase mr-2 text-gray-500">{m.role === "assistant" ? "HR" : "You"}</span>
                {m.content}
              </div>
            ))}
            {loading && <p className="text-sm text-gray-500">HR is thinking...</p>}
            {aiError && (
              <div className="text-sm text-rose-400">
                Could not reach the AI service.{" "}
                <button onClick={retry} className="underline text-cyan-300">Retry</button>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {form?.mode === "voice" ? (
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 min-h-[3rem] text-sm text-gray-300">
                {liveCaption || (loading ? "Waiting for the next question..." : "Listening - start speaking your answer...")}
              </div>
            ) : (
              <>
                <textarea
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 h-20"
                  placeholder="Your answer"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                />
                <button onClick={submitTextAnswer} disabled={loading || !textAnswer.trim()} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90 disabled:opacity-50">
                  Submit answer
                </button>
              </>
            )}
            <EndSessionButton onEnd={() => endInterview()} label="End interview now" />
          </div>
        </div>
      </main>
    </div>
  );
}