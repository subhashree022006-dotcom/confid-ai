export function speak(text) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) { resolve(); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.speak(utterance);
  });
}

// Auto-restarting recognizer for long, continuous speech (presentations, speeches).
// Browser speech recognition silently stops after periods of silence or ~60s;
// this restarts itself automatically unless you call .stop() yourself.
export function createContinuousRecognizer(onFinalResult) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  let manuallyStopped = false;
  let recognizer = null;

  function build() {
    const r = new SpeechRecognition();
    r.continuous = true;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript + " ";
      }
      if (finalText) onFinalResult(finalText);
    };
    r.onend = () => {
      if (!manuallyStopped) {
        try { r.start(); } catch { /* already starting, ignore */ }
      }
    };
    r.onerror = () => { /* let onend handle restart */ };
    return r;
  }

  return {
    start() {
      manuallyStopped = false;
      recognizer = build();
      try { recognizer.start(); } catch { /* ignore double-start */ }
    },
    stop() {
      manuallyStopped = true;
      recognizer?.stop();
    },
  };
}