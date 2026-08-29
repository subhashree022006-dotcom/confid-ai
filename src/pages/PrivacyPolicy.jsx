import Navbar from "../components/Navbar.jsx";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-16 prose prose-invert">
        <p className="text-cyan-400 text-sm font-medium mb-2">Legal</p>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: August 2026</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. Information we collect</h2>
            <p>When you use Confid.ai, we collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Account information: your chosen user ID and password (stored as a securely hashed value, never in plain text).</li>
              <li>Session data: your practice session scores, mode selected, topic/role, and timestamps.</li>
              <li>Camera and microphone data: processed live during practice sessions to generate AI feedback.</li>
              <li>Student ID images: if you subscribe to the Student Plan, the ID image you upload for verification.</li>
              <li>Payment information: processed directly by Razorpay. We do not store your card, UPI, or bank details on our servers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. How we use your information</h2>
            <p>We use your information to: provide and improve the Service, generate AI-based session feedback, verify student status for the Student Plan, process payments, and communicate with you about your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. Third-party services</h2>
            <p>We use the following third-party services to operate Confid.ai:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Groq - to generate AI feedback during practice sessions.</li>
              <li>Razorpay - to process payments securely.</li>
              <li>Cloudinary - to store uploaded student ID images.</li>
              <li>Render and Neon - to host our application and database.</li>
            </ul>
            <p className="mt-2">These providers may process your data as necessary to deliver their services to us, subject to their own privacy policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. Student ID images</h2>
            <p>Student ID images are used solely for verifying eligibility for the Student Plan and are reviewed manually by our team. We do not share these images with any third party beyond our storage provider (Cloudinary).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">5. Data retention</h2>
            <p>We retain your account and session data for as long as your account is active. You may request deletion of your account and associated data by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">6. Data security</h2>
            <p>Passwords are hashed using industry-standard methods and are never stored in plain text. We take reasonable measures to protect your data, but no method of transmission or storage is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">7. Your rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us through the support channel associated with this account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">8. Children's privacy</h2>
            <p>The Service is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">9. Changes to this policy</h2>
            <p>We may update this Privacy Policy from time to time. Continued use of the Service after changes constitutes acceptance of the revised policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">10. Contact</h2>
            <p>For privacy-related questions, contact us at the email associated with this account's support channel.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
