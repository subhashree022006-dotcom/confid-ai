import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";
import PasswordInput from "../components/PasswordInput.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const result = login(userId.trim(), password);
    if (!result.ok) { setError(result.error); return; }
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <h1 className="text-2xl font-semibold mb-1">Welcome back</h1>
          <p className="text-sm text-gray-400 mb-6">Log in to keep practicing</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-300">User ID</label>
              <input className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400" value={userId} onChange={(e) => setUserId(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-300">Password</label>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90">Log in</button>
          </form>
          <p className="text-sm text-gray-400 mt-5">New here? <Link to="/signup" className="text-cyan-300 font-medium">Create an account</Link></p>
        </div>
      </div>
    </div>
  );
}