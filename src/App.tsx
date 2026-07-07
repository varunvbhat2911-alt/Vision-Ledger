import { Routes, Route } from "react-router-dom";
import PageLayout from "./components/PageLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import VerifyPage from "./pages/VerifyPage";
import ResultsPage from "./pages/ResultsPage";
import AuditHistoryPage from "./pages/AuditHistoryPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PageLayout />}>
        {/* Public */}
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignUpPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />

        {/* Protected */}
        <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="verify" element={<ProtectedRoute><VerifyPage /></ProtectedRoute>} />
        <Route path="results/:claimId" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
        <Route path="history" element={<ProtectedRoute><AuditHistoryPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
