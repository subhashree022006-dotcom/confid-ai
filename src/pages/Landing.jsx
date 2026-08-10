import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

const MODES = [
  { icon: "Briefcase", title: "Interview", desc: "AI HR interview tailored to your role, company & job description.", tags: ["Confidence", "Eye contact", "Fluency", "Hiring probability"], color: "from-blue-500/20 to-blue-500/0" },
  { icon: "Screen", title: "Presentation", desc: "Upload your PPT/PDF, present, then face the Ask Viva round.", tags: ["Voice clarity", "Pacing", "Engagement", "Explanation"], color: "from-cyan-500/20 to-cyan-500/0" },
  { icon: "Mic", title: "Stage Speech", desc: "Own the stage - presence, delivery & body language analysis.", tags: ["Stage presence", "Delivery", "Gestures", "Body language"], color: "from-yellow-500/20 to-yellow-500/0" },
  { icon: "Group", title: "Group Discussion", desc: "Simulated GD with multiple AI personalities & a communication level.", tags: ["Leadership", "Listening", "Logic", "Participation"], color: "from-emerald-500/20 to-emerald-500/0" },
];

const FEATURES = [
  { title: "Facial Expression", desc: "Detects micro-expressions, warmth and engagement." },
  { title: "Eye Contact", desc: "Measures gaze steadiness and audience connection." },
  { title: "Speech Analysis", desc: "Fluency, filler words, pacing and clarity." },
  { title: "Gesture Tracking", desc: "Reads posture, hand movement and body language." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full border border-cyan-400/30 text-cyan-300 text-sm mb-6">
          Real-time AI camera + mic analysis
        </span>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          Speak with <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            unshakable confidence.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-gray-400 text-lg">
          Confid.ai coaches your interviews, presentations, speeches and group discussions.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link to="/signup" className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90">
            Start practicing free
          </Link>
        </div>
      </section>

      <section id="how" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-10">Four AI signals, one honest verdict</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="modes" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-10">Train for the moment that matters</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {MODES.map((m) => (
            <div key={m.title} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${m.color} p-7`}>
              <h3 className="text-xl font-semibold mb-2">{m.title}</h3>
              <p className="text-gray-400 mb-4">{m.desc}</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {m.tags.map((t) => (
                  <span key={t} className="text-xs px-3 py-1 rounded-full border border-white/15 text-gray-300">{t}</span>
                ))}
              </div>
              <Link to="/signup" className="text-cyan-300 text-sm font-medium hover:underline">Launch {m.title}</Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500">
        Confid.ai - built as a practice project.
      </footer>
    </div>
  );
}
