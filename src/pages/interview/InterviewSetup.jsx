import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ position: "", company: "", jobDescription: "" });
  const [mode, setMode] = useState(null);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [error, setError] = useState("");

  async function requestCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setCameraGranted(true);
      setError("");
    } catch {
      setError("Camera/microphone permission is required.");
    }
  }

  function startInterview() {
    if (!form.position || !form.company) { setError("Fill in the position and company."); return; }
    if (!mode) { setError("Choose whether you want to answer by voice or by text."); return; }
    if (!cameraGranted) { setError("Please allow camera access first."); return; }
    navigate("/interview/session", { state: { ...form, mode } });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-1">Set up your mock interview</h1>
        <p className="text-gray-400 mb-6">Tell us about the role you are preparing for.</p>
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div>
            <label className="text-sm text-gray-300">Position applying for</label>
            <input className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="e.g. Frontend Developer" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Company</label>
            <input className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. Acme Corp" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Job description (optional)</label>
            <textarea className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 h-28" value={form.jobDescription} onChange={(e) => setForm({ ...form, jobDescription: e.target.value })} placeholder="Paste the JD here" />
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-2">How do you want to answer?</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setMode("voice")} className={`py-2.5 rounded-lg border text-sm font-medium ${mode === "voice" ? "border-cyan-400 bg-cyan-500/10 text-cyan-300" : "border-white/15 text-gray-300 hover:bg-white/5"}`}>🎤 Voice</button>
              <button type="button" onClick={() => setMode("text")} className={`py-2.5 rounded-lg border text-sm font-medium ${mode === "text" ? "border-cyan-400 bg-cyan-500/10 text-cyan-300" : "border-white/15 text-gray-300 hover:bg-white/5"}`}>⌨️ Text</button>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            {!cameraGranted ? (
              <button onClick={requestCamera} className="text-sm px-4 py-2 rounded-lg border border-white/15 hover:bg-white/5">Allow camera & microphone</button>
            ) : (
              <p className="text-sm text-emerald-400 font-medium">Camera & microphone ready</p>
            )}
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button onClick={startInterview} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90">Start trial interview</button>
        </div>
      </main>
    </div>
  );
}