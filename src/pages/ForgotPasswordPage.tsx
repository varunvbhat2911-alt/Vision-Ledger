import { useState } from "react";
import { Link } from "react-router-dom";
import { Leaf, Loader2, AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await resetPassword(email);
      if (err) { setError(err); return; }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Check your email</h1>
          <p className="mt-3 text-foreground/60 leading-relaxed">
            We&apos;ve sent a password reset link to <strong>{email}</strong>.
            Click the link in the email to reset your password.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-btn bg-accent px-6 py-3 text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-accent/90 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-heading text-2xl font-semibold text-primary cursor-pointer">
            <Leaf className="h-7 w-7" />
            VisionLedger
          </Link>
          <h1 className="mt-6 font-heading text-3xl font-bold text-foreground">Reset Password</h1>
          <p className="mt-2 text-foreground/50">Enter your email and we&apos;ll send you a reset link</p>
        </div>

        <div className="rounded-card border border-border bg-surface p-8 shadow-sm">
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-foreground/70">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-btn border border-border bg-background px-4 py-3 text-foreground placeholder:text-foreground/25 transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-btn bg-accent px-6 py-3 text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending…</> : "Send Reset Link"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-foreground/50">
          <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-accent hover:text-accent/80 transition-colors cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}