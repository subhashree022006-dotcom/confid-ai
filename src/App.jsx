import HowItWorks from "./pages/HowItWorks.jsx";
import PracticeModes from "./pages/PracticeModes.jsx";
import Pricing from "./pages/Pricing.jsx";
import TermsOfService from "./pages/TermsOfService.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import NotFound from "./pages/NotFound.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import InterviewSetup from "./pages/interview/InterviewSetup.jsx";
import InterviewSession from "./pages/interview/InterviewSession.jsx";
import InterviewResults from "./pages/interview/InterviewResults.jsx";
import PresentationSetup from "./pages/presentation/PresentationSetup.jsx";
import PresentationSession from "./pages/presentation/PresentationSession.jsx";
import PresentationViva from "./pages/presentation/PresentationViva.jsx";
import PresentationResults from "./pages/presentation/PresentationResults.jsx";
import StageSpeechSetup from "./pages/stagespeech/StageSpeechSetup.jsx";
import StageSpeechSession from "./pages/stagespeech/StageSpeechSession.jsx";
import StageSpeechResults from "./pages/stagespeech/StageSpeechResults.jsx";
import GDSetup from "./pages/gd/GDSetup.jsx";
import GDSession from "./pages/gd/GDSession.jsx";
import GDResults from "./pages/gd/GDResults.jsx";
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/practice-modes" element={<PracticeModes />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/interview" element={<ProtectedRoute><InterviewSetup /></ProtectedRoute>} />
      <Route path="/interview/session" element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />
      <Route path="/interview/results" element={<ProtectedRoute><InterviewResults /></ProtectedRoute>} />
      <Route path="/presentation" element={<ProtectedRoute><PresentationSetup /></ProtectedRoute>} />
      <Route path="/presentation/session" element={<ProtectedRoute><PresentationSession /></ProtectedRoute>} />
      <Route path="/presentation/viva" element={<ProtectedRoute><PresentationViva /></ProtectedRoute>} />
      <Route path="/presentation/results" element={<ProtectedRoute><PresentationResults /></ProtectedRoute>} />
      <Route path="/stagespeech" element={<ProtectedRoute><StageSpeechSetup /></ProtectedRoute>} />
      <Route path="/stagespeech/session" element={<ProtectedRoute><StageSpeechSession /></ProtectedRoute>} />
      <Route path="/stagespeech/results" element={<ProtectedRoute><StageSpeechResults /></ProtectedRoute>} />
      <Route path="/gd" element={<ProtectedRoute><GDSetup /></ProtectedRoute>} />
      <Route path="/gd/session" element={<ProtectedRoute><GDSession /></ProtectedRoute>} />
      <Route path="/gd/results" element={<ProtectedRoute><GDResults /></ProtectedRoute>} />
      <Route path="/admin-confidai-2026" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
