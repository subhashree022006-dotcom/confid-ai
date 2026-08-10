const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export async function saveSession({ userId, mode, topicOrRole, overallScore, confidence, eyeContact, gesture, communication, hireProbability }) {
  try {
    await fetch(`${API_BASE}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, mode, topicOrRole, overallScore, confidence, eyeContact, gesture, communication, hireProbability }),
    });
  } catch (e) {
    console.error("Failed to save session", e);
    // fail silently - results still show to the user even if saving history fails
  }
}

export async function fetchSessionHistory(userId) {
  try {
    const res = await fetch(`${API_BASE}/api/sessions/${userId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Failed to fetch session history", e);
    return [];
  }
}