import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="flex flex-col items-center justify-center px-6 py-32 text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-gray-400 mb-8">This page doesn't exist.</p>
        <Link to="/" className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold">
          Go home
        </Link>
      </div>
    </div>
  );
}
