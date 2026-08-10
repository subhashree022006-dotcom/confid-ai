import { useEffect, useRef, useState } from "react";

export default function AudioLevelMeter({ active }) {
  const [level, setLevel] = useState(0);
  const rafRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    let stream;
    let analyser;
    let dataArray;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        ctxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        function loop() {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setLevel(Math.min(1, avg / 80));
          rafRef.current = requestAnimationFrame(loop);
        }
        loop();
      } catch {
        // mic unavailable; meter just stays flat
      }
    }
    start();

    return () => {
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close();
    };
  }, [active]);

  const bars = 5;
  return (
    <div className="flex items-end gap-1 h-6">
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = ((i + 1) / bars) * 0.6;
        const isActive = level >= threshold;
        return (
          <div
            key={i}
            className={`w-1.5 rounded-sm transition-all ${isActive ? "bg-cyan-400" : "bg-white/10"}`}
            style={{ height: `${8 + i * 4}px` }}
          />
        );
      })}
    </div>
  );
}