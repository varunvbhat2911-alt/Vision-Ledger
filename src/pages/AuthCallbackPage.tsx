import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const handleAuth = async () => {
      try {
        // Exchange OAuth code for a session (PKCE flow)
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(window.location.href);

        if (exchangeError) {
          if (!cancelled) setError(exchangeError.message);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          if (!cancelled) {
            navigate("/dashboard", { replace: true });
          }
        } else {
          if (!cancelled) {
            setError("Failed to create session.");
          }
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Failed to complete sign-in.");
        }
      }
    };

    handleAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-destructive">{error}</p>

        <button
          type="button"
          onClick={() => navigate("/login", { replace: true })}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-10 w-10 animate-spin text-accent" />
      <p className="text-sm text-foreground/70">
        Completing sign-in...
      </p>
    </div>
  );
}