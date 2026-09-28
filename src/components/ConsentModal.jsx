import { Link } from "react-router-dom";

export default function ConsentModal({ onAgree, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold mb-2">Camera & Microphone Access</h2>
        <p className="text-sm text-gray-300 mb-3">
          Confid.ai uses your camera and microphone to analyze your interview
          performance (eye contact, confidence, communication). Your session
          may be temporarily processed to generate feedback.
        </p>
        <ul className="text-sm text-gray-400 list-disc pl-5 mb-4 space-y-1">
          <li>Recordings are used only to generate your performance report.</li>
          <li>You can stop a session at any time.</li>
          <li>
            See our{" "}
            <Link to="/privacy-policy" target="_blank" className="text-cyan-400 underline">
              Privacy Policy
            </Link>{" "}
            for details.
          </li>
        </ul>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-white/15 text-gray-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={onAgree}
            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950 font-semibold hover:opacity-90"
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}