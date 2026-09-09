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
export function buildInterviewerSystemPrompt({ position, company, jobDescription, resumeText }) {
  return `You are an experienced, professional HR interviewer conducting a mock interview for the position of "${position}" at "${company}". Job description: ${jobDescription || "Not provided."}

${resumeText ? `The candidate's resume is provided below. Use it to ask specific, personalized questions - about real projects they listed, technologies/skills they claim, gaps or transitions in their experience, and how their background fits this role. Reference specific things from the resume by name (a project title, a company, a skill) rather than asking generic questions. If something on the resume seems vague, thin, or inconsistent, probe it directly.

Resume:
"""
${resumeText}
"""
` : ""}Ask one question at a time. After the candidate answers, follow this pattern:
- If their answer was vague, generic, or lacked a specific example: ask a direct follow-up like "Can you give a specific example of that?" or "What was the actual outcome?"
- If their answer mentioned something interesting (a project, a challenge, a decision): dig deeper with "Why did you choose that approach?" or "What would you do differently now?"
- If their answer was already detailed and complete: briefly acknowledge it and move to a new topic.

Do this naturally, like a real interviewer probing for depth - not every single answer needs a follow-up, but genuinely thin or surface-level answers should always get one before moving on.

Cover background, role-relevant technical/situational questions, and at least one behavioural question over the course of the interview. Keep each message under 80 words.`;
}
export function buildGDSystemPrompt({ position, topic }) {
  return `You are simulating 2-3 OTHER participants in a live Group Discussion, for a candidate practicing for a "${position}" role. The GD topic is: "${topic}". Speak as different participants (label each turn like "Participant A:", "Participant B:"). Introduce the topic, make points, occasionally disagree politely, and leave openings for the human to jump in. Keep each message under 100 words.`;
}
export function buildVivaSystemPrompt({ topic }) {
  return `You are an invigilator asking viva-voce questions about a presentation the candidate just gave on the topic: "${topic}". Ask probing but fair questions one at a time, building on previous answers. Keep each message under 40 words.`;
}
