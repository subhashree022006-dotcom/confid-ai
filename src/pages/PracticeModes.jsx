import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

const MODES = [
  { title: "Interview", desc: "Mock HR interview scored on confidence, gestures, eye contact, communication, and hire probability.", path: "/interview", color: "from-blue-500/20 to-blue-500/0" },
  { title: "Presentation", desc: "Upload your slides, present to the camera, then face a short viva on your topic.", path: "/presentation", color: "from-cyan-500/20 to-cyan-500/0" },
  { title: "Stage Speech", desc: "Practice a stage speech with confidence, gesture and eye-contact scoring.", path: "/stagespeech", color: "from-yellow-500/20 to-yellow-500/0" },
  { title: "Group Discussion", desc: "Join a simulated group discussion with AI participants and get evaluated.", path: "/gd", color: "from-emerald-500/20 to-emerald-500/0" },
];

export default function PracticeModes() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-cyan-400 text-sm font-medium mb-2">Practice modes</p>
        <h1 className="text-3xl font-bold mb-10">Four ways to sharpen your communication</h1>
        <div className="grid sm:grid-cols-2 gap-6">
          {MODES.map((m) => (
            <button key={m.title} onClick={() => navigate(m.path)} className={`text-left rounded-2xl border border-white/10 bg-gradient-to-br ${m.color} p-7 hover:border-cyan-400/40 transition`}>
              <h3 className="text-xl font-semibold mb-2">{m.title}</h3>
              <p className="text-gray-400 text-sm">{m.desc}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
