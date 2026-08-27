import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "Free",
    period: "",
    features: ["1 trial session per mode (4 total)", "AI-powered scoring", "Session history & progress tracking"],
  },
  {
    key: "student",
    name: "Student",
    price: "\u20b9299",
    period: "/6 months",
    features: ["Unlimited sessions, all 4 modes", "Requires student ID verification", "Approved manually within 24-48 hrs"],
    highlight: true,
  },
  {
    key: "regular",
    name: "Regular",
    price: "\u20b9799",
    period: "/6 months",
    features: ["Unlimited sessions, all 4 modes", "Full progress dashboard", "Instant activation after payment"],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState("");
  const [showIdUpload, setShowIdUpload] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  async function handleSubscribe(planKey) {
    if (planKey === "free") return;
    if (!user) {
      navigate("/signup");
      return;
    }

    setError("");
    setLoadingPlan(planKey);

    try {
      const token = localStorage.getItem("confidai_token");
      const orderRes = await fetch(`${API_BASE}/api/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planType: planKey }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error || "Could not start payment.");
        setLoadingPlan(null);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Confid.ai",
        description: `${orderData.planLabel} Plan - 6 months`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${API_BASE}/api/verify-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planType: planKey,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              setError(verifyData.error || "Payment verification failed.");
              setLoadingPlan(null);
              return;
            }
            await refreshUser();
            setLoadingPlan(null);

            if (verifyData.requiresIdUpload) {
              setShowIdUpload(true);
            } else {
              navigate("/dashboard");
            }
          } catch {
            setError("Payment succeeded but verification failed. Contact support.");
            setLoadingPlan(null);
          }
        },
        modal: {
          ondismiss: function () {
            setLoadingPlan(null);
          },
        },
        theme: { color: "#22d3ee" },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      console.error(err);
      setError("Could not reach the server. Please try again.");
      setLoadingPlan(null);
    }
  }

  async function handleIdUpload(e) {
    e.preventDefault();
    if (!idFile) {
      setError("Please choose a file first.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const token = localStorage.getItem("confidai_token");
      const formData = new FormData();
      formData.append("idImage", idFile);

      const res = await fetch(`${API_BASE}/api/upload-student-id`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        setUploading(false);
        return;
      }
      setUploadDone(true);
      setUploading(false);
      await refreshUser();
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
      setUploading(false);
    }
  }

  if (showIdUpload) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="max-w-lg mx-auto px-6 py-16">
          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-8">
            {uploadDone ? (
              <>
                <h1 className="text-2xl font-bold mb-2">Payment received</h1>
                <p className="text-gray-300 mb-6">
                  Your student ID has been submitted. Our team will verify it within 24-48 hours and activate your plan. You'll be able to practice with your free sessions until then.
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-2.5 transition"
                >
                  Go to dashboard
                </button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-2">Almost done</h1>
                <p className="text-gray-300 mb-6">
                  Payment successful. Please upload a photo of your valid student ID card to activate your student plan.
                </p>
                {error && (
                  <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {error}
                  </div>
                )}
                <form onSubmit={handleIdUpload} className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setIdFile(e.target.files[0])}
                    className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-slate-950 file:font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold py-2.5 transition"
                  >
                    {uploading ? "Uploading..." : "Submit ID"}
                  </button>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-cyan-400 text-sm font-medium mb-2">Pricing</p>
        <h1 className="text-3xl font-bold mb-2">Simple, transparent pricing</h1>
        <p className="text-gray-400 mb-10">Every new user gets 1 free session per mode. Upgrade anytime for unlimited practice.</p>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-2xl border p-8 flex flex-col ${
                plan.highlight ? "border-cyan-400/40 bg-cyan-500/5" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
              <p className="text-3xl font-bold mb-4">
                {plan.price}
                <span className="text-sm text-gray-400 font-normal">{plan.period}</span>
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-gray-400 text-sm flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">-</span> {f}
                  </li>
                ))}
              </ul>
              {plan.key === "free" ? (
                <button
                  onClick={() => navigate(user ? "/dashboard" : "/signup")}
                  className="w-full rounded-xl border border-white/20 text-white font-semibold py-2.5 hover:bg-white/5 transition"
                >
                  {user ? "Go to dashboard" : "Get started"}
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={loadingPlan === plan.key}
                  className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold py-2.5 transition"
                >
                  {loadingPlan === plan.key ? "Opening..." : "Subscribe"}
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-8">
          Student plan requires uploading a valid student ID after payment. Access is activated once your ID is manually verified, usually within 24-48 hours.
        </p>
      </main>
    </div>
  );
}
