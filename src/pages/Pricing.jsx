import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

const PLANS = [
  { name: "Free", price: "Free", period: "/month", features: ["4 practice modes", "AI-powered scoring", "Session history & progress tracking"], highlight: true },
];

export default function Pricing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-cyan-400 text-sm font-medium mb-2">Pricing</p>
        <h1 className="text-3xl font-bold mb-10">Simple, transparent pricing</h1>
        <div className="grid gap-6">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`rounded-2xl border p-8 ${plan.highlight ? "border-cyan-400/40 bg-cyan-500/5" : "border-white/10 bg-white/[0.02]"}`}>
              <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
              <p className="text-3xl font-bold mb-4">{plan.price}<span className="text-sm text-gray-400 font-normal">{plan.period}</span></p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="text-gray-400 text-sm flex items-center gap-2"><span className="text-cyan-400">-</span> {f}</li>
                ))}
              </ul>
              <button onClick={() => navigate("/signup")} className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-2.5 transition">Get started</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
