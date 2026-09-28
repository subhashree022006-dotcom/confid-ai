import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const TOKEN_KEY = "confidai_token";

export default function FeedbackModal({ mode, onClose }) {
  const [rating, setRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [wouldPay, setWouldPay] = useState(null);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!rating) {
      setError("Please select a rating.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode, rating, wouldRecommend, wouldPay, comments }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      setTimeout(onClose, 1500);
    } catch {
      setError("Could not submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-slate-900 p-6">
        {submitted ? (
          <p className="text-center text-emerald-400 font-medium py-4">Thanks for your feedback! 🙌</p>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-1">How was this session?</h2>
            <p className="text-sm text-gray-400 mb-4">Your feedback helps us improve Confid.ai.</p>

            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">Rate your experience</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className={`w-10 h-10 rounded-lg border text-lg ${
                      rating >= n
                        ? "border-cyan-400 bg-cyan-500/10 text-cyan-300"
                        : "border-white/15 text-gray-500 hover:bg-white/5"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">Would you recommend this to a friend?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setWouldRecommend(true)}
                  className={`py-2 rounded-lg border text-sm ${wouldRecommend === true ? "border-cyan-400 bg-cyan-500/10 text-cyan-300" : "border-white/15 text-gray-300 hover:bg-white/5"}`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setWouldRecommend(false)}
                  className={`py-2 rounded-lg border text-sm ${wouldRecommend === false ? "border-rose-400 bg-rose-500/10 text-rose-300" : "border-white/15 text-gray-300 hover:bg-white/5"}`}
                >
                  No
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">Would you pay for unlimited practice?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setWouldPay(true)}
                  className={`py-2 rounded-lg border text-sm ${wouldPay === true ? "border-cyan-400 bg-cyan-500/10 text-cyan-300" : "border-white/15 text-gray-300 hover:bg-white/5"}`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setWouldPay(false)}
                  className={`py-2 rounded-lg border text-sm ${wouldPay === false ? "border-rose-400 bg-rose-500/10 text-rose-300" : "border-white/15 text-gray-300 hover:bg-white/5"}`}
                >
                  No
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">Anything else? (optional)</p>
              <textarea
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 h-20 text-sm"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="What was confusing, useful, or missing?"
              />
            </div>

            {error && <p className="text-sm text-rose-400 mb-3">{error}</p>}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/15 text-gray-300 hover:bg-white/5">
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}