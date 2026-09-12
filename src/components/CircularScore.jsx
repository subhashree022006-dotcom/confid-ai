import { useEffect, useState } from "react";

export default function CircularScore({ score = 0, size = 160 }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 900;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const strokeColor =
    score >= 75 ? "#22d3ee" : score >= 50 ? "#eab308" : "#f43f5e";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="12"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="12"
          fill="none"
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{animatedScore}</span>
        <span className="text-xs text-gray-500">/100</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
          ATS Score
        </span>
      </div>
    </div>
  );
}