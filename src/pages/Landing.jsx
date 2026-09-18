import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

const MODES = [
  { icon: "Briefcase", title: "Interview", desc: "Face an AI HR round tailored to your role, company & job description.", tags: ["Confidence", "Eye contact", "Fluency", "Hiring probability"], color: "from-blue-500/20 to-blue-500/0" },
  { icon: "Screen", title: "Presentation", desc: "Upload your PPT/PDF, present it, then survive the Ask Viva round.", tags: ["Voice clarity", "Pacing", "Engagement", "Explanation"], color: "from-cyan-500/20 to-cyan-500/0" },
  { icon: "Mic", title: "Stage Speech", desc: "Own the stage - presence, delivery & body language, analyzed live.", tags: ["Stage presence", "Delivery", "Gestures", "Body language"], color: "from-yellow-500/20 to-yellow-500/0" },
  { icon: "Group", title: "Group Discussion", desc: "Hold your own in a simulated GD against multiple AI personalities.", tags: ["Leadership", "Listening", "Logic", "Participation"], color: "from-emerald-500/20 to-emerald-500/0" },
];

const FEATURES = [
  { title: "Never seem checked out", desc: "We read micro-expressions, warmth and engagement in real time." },
  { title: "Hold the room's attention", desc: "Gaze steadiness and audience connection, measured as you speak." },
  { title: "Sound like you mean it", desc: "Fluency, filler words, pacing and clarity, scored live." },
  { title: "Stand like you belong there", desc: "Posture, hand movement and body language, read on camera." },
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
          <Link to="/signup" aria-label="Sign up and start practicing free" className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90">
            Start practicing free
          </Link>
          <Link to="/how-it-works" aria-label="Learn how Confid.ai works" className="px-6 py-3 rounded-lg border border-white/15 text-gray-200 font-semibold hover:bg-white/5">
            See how it works
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Built for students and job seekers preparing for the interviews, presentations and speeches that actually matter.
        </p>
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
        <h2 className="text-3xl md:text-4xl font-bold mb-10">Choose your practice mode</h2>
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
              <Link to="/signup" aria-label={`Launch ${m.title} practice mode`} className="text-cyan-300 text-sm font-medium hover:underline">Launch {m.title}</Link>
            </div>
          ))}
        </div>
      </section>

      <section id="accessibility" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Built to be usable by everyone</h2>
        <p className="text-gray-400 max-w-2xl mb-8">
          Confid.ai works across screen sizes and devices, supports keyboard navigation, and labels every interactive element for screen readers. We're actively extending accessibility further:
        </p>
        <div className="grid sm:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-semibold mb-1">Available now</h3>
            <p className="text-sm text-gray-400">Responsive layout, keyboard-navigable forms, screen-reader labels on all buttons and links.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-semibold mb-1">In progress</h3>
            <p className="text-sm text-gray-400">Multilingual voice interface and text-to-speech feedback for low-literacy and vision-impaired users.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-semibold mb-1">Roadmap</h3>
            <p className="text-sm text-gray-400">Low-bandwidth / IVR fallback mode for users with limited data access.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Confid.ai - Practice. Perform. Get Hired.
      </footer>
    </div>
  );
}