function average(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function computeEyeContactScore(samples) {
  const withFace = samples.filter((s) => s.faceDetected);
  if (!withFace.length) return 0;
  const faceVisibleRatio = withFace.length / samples.length;
  const centerednessAvg = average(withFace.map((s) => s.centeredness ?? 0));
  return Math.round(Math.min(1, faceVisibleRatio * 0.5 + centerednessAvg * 0.5) * 100);
}

export function computeConfidenceScore(samples) {
  const withFace = samples.filter((s) => s.faceDetected && s.expressions);
  if (!withFace.length) return 0;
  const positive = average(withFace.map((s) => (s.expressions.happy ?? 0) + (s.expressions.neutral ?? 0) * 0.6));
  const negative = average(withFace.map((s) => (s.expressions.fearful ?? 0) + (s.expressions.sad ?? 0) + (s.expressions.disgusted ?? 0)));
  const raw = Math.max(0, Math.min(1, positive - negative * 0.5));
  return Math.round(raw * 100);
}

export function computeGestureScore(samples) {
  const sizes = samples.filter((s) => s.faceDetected).map((s) => s.boxSize ?? 0);
  if (sizes.length < 2) return 50;
  const diffs = sizes.slice(1).map((v, i) => Math.abs(v - sizes[i]));
  const movement = average(diffs) * 5000;
  const score = 100 - Math.min(100, Math.abs(movement - 20) * 3);
  return Math.round(Math.max(20, Math.min(95, score)));
}

export function computeCommunicationScore(transcript) {
  if (!transcript || !transcript.trim()) return 0;
  const words = transcript.trim().split(/\s+/);
  const wordCount = words.length;
  const fillerWords = ["um", "uh", "like", "actually", "basically"];
  const fillerCount = words.filter((w) => fillerWords.includes(w.toLowerCase().replace(/[^a-z]/g, ""))).length;
  const fillerRatio = fillerCount / Math.max(1, wordCount);
  const lengthScore = Math.min(1, wordCount / 150);
  const clarityScore = Math.max(0, 1 - fillerRatio * 6);
  return Math.round((lengthScore * 0.4 + clarityScore * 0.6) * 100);
}

export function computeOverallScore(scores) {
  const values = Object.values(scores).filter((v) => typeof v === "number");
  return Math.round(average(values));
}

export function computeHireProbability({ confidence, eyeContact, communication, gesture }) {
  const weighted = confidence * 0.3 + eyeContact * 0.2 + communication * 0.35 + gesture * 0.15;
  return Math.round(Math.max(5, Math.min(95, weighted)));
}
