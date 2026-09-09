const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const TOKEN_KEY = "confidai_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export async function uploadInterviewVideo(videoBlob) {
  if (!videoBlob) return { ok: false, error: "No video to upload" };
  try {
    const formData = new FormData();
    formData.append("video", videoBlob, "session.webm");

    const res = await fetch(`${API_BASE}/api/upload-interview-video`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || "Failed to upload video" };
    }
    const data = await res.json();
    return { ok: true, url: data.url };
  } catch (e) {
    console.error("Failed to upload video", e);
    return { ok: false, error: "Could not reach the server." };
  }
}

export async function saveSession({ mode, topicOrRole, overallScore, confidence, eyeContact, gesture, communication, hireProbability, videoUrl }) {
  try {
    const res = await fetch(`${API_BASE}/api/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ mode, topicOrRole, overallScore, confidence, eyeContact, gesture, communication, hireProbability, videoUrl }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || "Failed to save session" };
    }
    return { ok: true, session: await res.json() };
  } catch (e) {
    console.error("Failed to save session", e);
    return { ok: false, error: "Could not reach the server." };
  }
}

export async function fetchSessionHistory(userId) {
  try {
    const res = await fetch(`${API_BASE}/api/sessions/${userId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Failed to fetch session history", e);
    return [];
  }
}