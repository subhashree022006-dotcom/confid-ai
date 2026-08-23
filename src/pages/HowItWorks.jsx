import Navbar from "../components/Navbar.jsx";

const STEPS = [
  { title: "Choose a practice mode", desc: "Pick from Interview, Presentation, Stage Speech, or Group Discussion based on what you want to improve." },
  { title: "Practice in front of your camera", desc: "Answer questions or speak naturally while our AI watches your gestures, eye contact, and listens to your communication." },
  { title: "Get instant AI feedback", desc: "Right after your session, receive a detailed score covering confidence, gestures, eye contact, and communication." },
  { title: "Track your progress", desc: "Your dashboard shows your average scores by mode and how you're improving session after session." },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <p className="text-cyan-400 text-sm font-medium mb-2">How it works</p>
        <h1 className="text-3xl font-bold mb-10">Four steps to better communication</h1>
        <div className="space-y-8">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-semibold">
                {i + 1}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
