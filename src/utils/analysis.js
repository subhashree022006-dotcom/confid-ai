function average(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stdDev(nums) {
  if (nums.length < 2) return 0;
  const avg = average(nums);
  const variance = average(nums.map((n) => (n - avg) ** 2));
  return Math.sqrt(variance);
}

export function computeEyeContactScore(samples) {
  const withFace = samples.filter((s) => s.faceDetected);
  if (!withFace.length) return 0;
  const faceVisibleRatio = withFace.length / samples.length;
  const centerednessAvg = average(withFace.map((s) => s.centeredness ?? 0));
  return Math.round(Math.min(1, faceVisibleRatio * 0.5 + centerednessAvg * 0.5) * 100);
}

export function computeGestureScore(samples) {
  const withFace = samples.filter((s) => s.faceDetected);
  if (withFace.length < 3) return 50;

  const sizes = withFace.map((s) => s.boxSize ?? 0);
  const centerX = withFace.map((s) => s.centerX ?? 0.5);
  const centerY = withFace.map((s) => s.centerY ?? 0.5);

  const sizeVariability = stdDev(sizes) * 1000;
  const positionVariability = (stdDev(centerX) + stdDev(centerY)) * 500;

  const totalMovement = sizeVariability + positionVariability;

  const idealMin = 8;
  const idealMax = 35;

  let score;
  if (totalMovement < idealMin) {
    score = 40 + (totalMovement / idealMin) * 30;
  } else if (totalMovement <= idealMax) {
    score = 100 - ((totalMovement - idealMin) / (idealMax - idealMin)) * 15;
  } else {
    score = Math.max(20, 85 - (totalMovement - idealMax) * 1.5);
  }

  return Math.round(Math.max(20, Math.min(95, score)));
}

export function buildBehavioralSummary(samples) {
  const withFace = samples.filter((s) => s.faceDetected);
  const faceVisiblePercent = samples.length ? Math.round((withFace.length / samples.length) * 100) : 0;
  const centerednessAvg = withFace.length ? Math.round(average(withFace.map((s) => s.centeredness ?? 0)) * 100) : 0;

  const positiveExpressionAvg = withFace.length
    ? Math.round(
        average(
          withFace
            .filter((s) => s.expressions)
            .map((s) => ((s.expressions.happy ?? 0) + (s.expressions.neutral ?? 0) * 0.6) * 100)
        )
      )
    : 0;

  const gestureScore = computeGestureScore(samples);

  return {
    faceVisiblePercent,
    centerednessAvg,
    positiveExpressionAvg,
    movementLevel: gestureScore,
  };
}

export function computeCommunicationScoreFallback(transcript) {
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
