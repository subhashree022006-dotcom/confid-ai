import { useState, useRef } from "react";
import Navbar from "../components/Navbar.jsx";
import CircularScore from "../components/CircularScore.jsx";
import RecentAtsChecks from "../components/RecentAtsChecks.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AtsCheck() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Max size is 5MB.");
      return;
    }

    setError("");
    setResumeFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange({ target: { files: [file] } });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!resumeFile) {
      setError("Please upload your resume first.");
      return;
    }
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      setError("Please paste a fuller job description to compare against.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem("confidai_token");
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDescription);

      const res = await fetch(`${API_BASE}/api/ats-check`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze resume.");

      setResult(data);
      setHistoryRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResumeFile(null);
    setJobDescription("");
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-cyan-400 text-sm font-medium mb-2">ATS Score Checker</p>
        <h1 className="text-3xl font-bold mb-1">Check your resume against a job description</h1>
        <p className="text-gray-400 mb-10">
          Upload your resume and paste the target job description to see your ATS match score.
        </p>

        {!result && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/[0.02] p-7 space-y-5">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
                resumeFile
                  ? "border-cyan-400/50 bg-cyan-500/5"
                  : "border-white/15 hover:border-cyan-400/40 hover:bg-white/[0.03]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                hidden
              />
              {resumeFile ? (
                <p className="font-medium text-cyan-300">📄 {resumeFile.name}</p>
              ) : (
                <>
                  <p className="text-gray-300 mb-1">Drag & drop your resume, or click to browse</p>
                  <p className="text-xs text-gray-600">PDF or DOCX, max 5MB</p>
                </>
              )}
            </div>

            <div>
              <label htmlFor="job-description" className="block text-sm font-medium text-gray-300 mb-2">
                Target Job Description
              </label>
              <textarea
                id="job-description"
                rows={10}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-cyan-400/50 placeholder:text-gray-600 resize-y"
              />
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-5 py-3 rounded-xl bg-cyan-400 text-slate-950 font-semibold hover:bg-cyan-300 disabled:opacity-50 transition"
            >
              {loading ? "Analyzing..." : "Check ATS Score"}
            </button>
          </form>
        )}

        {loading && (
          <div className="text-center py-16 text-gray-400">
            <div className="mx-auto mb-4 h-9 w-9 rounded-full border-3 border-white/10 border-t-cyan-400 animate-spin" />
            <p>Parsing resume and running ATS analysis...</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7 flex justify-center">
              <CircularScore score={result.matchScore} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
              <h3 className="text-lg font-semibold mb-4">Missing Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.length === 0 ? (
                  <p className="text-sm text-gray-500">No major keyword gaps found 🎉</p>
                ) : (
                  result.missingKeywords.map((kw, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                      {kw}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
              <h3 className="text-lg font-semibold mb-4">Formatting Issues</h3>
              {result.formattingIssues.length === 0 ? (
                <p className="text-sm text-gray-500">No ATS-breaking formatting detected.</p>
              ) : (
                <ul className="space-y-2 list-disc list-inside text-sm text-gray-300">
                  {result.formattingIssues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
              <h3 className="text-lg font-semibold mb-4">Suggestions to Improve</h3>
              <ul className="space-y-2 list-disc list-inside text-sm text-gray-300">
                {result.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleReset}
              className="w-full px-5 py-3 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 font-semibold transition"
            >
              Check Another Resume
            </button>
          </div>
        )}

        {!result && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Recent ATS Checks</h2>
            <RecentAtsChecks refreshKey={historyRefreshKey} />
          </div>
        )}
      </main>
    </div>
  );
}
