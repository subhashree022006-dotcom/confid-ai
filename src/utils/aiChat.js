const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export async function askAI(messages, system) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system }),
  });
  if (!res.ok) throw new Error("AI request failed");
  const data = await res.json();
  return data.reply;
}

export function buildInterviewerSystemPrompt({ position, company, jobDescription }) {
  return `You are an experienced, professional HR interviewer conducting a mock interview for the position of "${position}" at "${company}". Job description: ${jobDescription || "Not provided."} Ask one question at a time, natural and encouraging, building on what the candidate has already said. After the candidate answers, briefly acknowledge it, then ask a relevant follow-up or move to the next topic. Cover background, role-relevant technical/situational questions, and one behavioural question. Keep each message under 80 words.`;
}

export function buildGDSystemPrompt({ position, topic }) {
  return `You are simulating 2-3 OTHER participants in a live Group Discussion, for a candidate practicing for a "${position}" role. The GD topic is: "${topic}". Speak as different participants (label each turn like "Participant A:", "Participant B:"). Introduce the topic, make points, occasionally disagree politely, and leave openings for the human to jump in. Keep each message under 100 words.`;
}

export function buildVivaSystemPrompt({ topic }) {
  return `You are an invigilator asking viva-voce questions about a presentation the candidate just gave on the topic: "${topic}". Ask probing but fair questions one at a time, building on previous answers. Keep each message under 40 words.`;
}