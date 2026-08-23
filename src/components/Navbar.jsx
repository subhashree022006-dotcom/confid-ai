import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg">
            🎙️
          </span>
          <span className="font-semibold text-lg">
            Confid<span className="text-blue-400">.ai</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300">
          <Link to="/practice-modes" className="hover:text-white">Practice Modes</Link>
          <Link to="/how-it-works" className="hover:text-white">How it works</Link>
          <Link to="/pricing" className="hover:text-white">Pricing</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-gray-300 hover:text-white">Login</Link>
          <Link
            to="/signup"
            className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}