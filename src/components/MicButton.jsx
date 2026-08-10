import { useRef, useState } from "react";
import { createContinuousRecognizer } from "../utils/speech.js";

export default function MicButton({ onText }) {
  const [listening, setListening] = useState(false);
  const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const recognizerRef = useRef(null);

  function toggle() {
    if (!supported) return;
    if (listening) {
      recognizerRef.current?.stop();
      setListening(false);
      return;
    }
    recognizerRef.current = createContinuousRecognizer((text) => onText(text));
    recognizerRef.current.start();
    setListening(true);
  }

  if (!supported) {
    return <p className="text-xs text-gray-500">Voice input not supported in this browser. Please type instead.</p>;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${
        listening ? "border-rose-400 text-rose-300 bg-rose-500/10" : "border-white/15 text-gray-300 hover:bg-white/5"
      }`}
    >
      <span>{listening ? "🔴" : "🎤"}</span>
      {listening ? "Listening... click to stop" : "Click to speak your answer"}
    </button>
  );
}