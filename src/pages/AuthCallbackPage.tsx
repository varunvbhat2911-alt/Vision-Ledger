import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

/**
 * Public OAuth callback handler.
 * Supabase redirects here with session tokens in the URL hash.
 * This route must stay unprotected so tokens can be parsed before routing.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          if (!cancelled) setError(sessionError.message);
          return;
        }

        if (session) {
          if (!cancelled) navigate("/dashboard", { replace: true });
          return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (nextSession && !cancelled) {
            subscription.unsubscribe();
            navigate("/dashboard", { replace: true });
          }
        });

        window.setTimeout(() => {
          if (!cancelled) {
            subscription.unsubscribe();
            setError("Authentication timed out. Please try signing in again.");
          }
        }, 10000);
      } catch {
        if (!cancelled) setError("Failed to complete sign-in. Please try again.");
      }
    })();

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
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-10 w-10 animate-spin text-accent" />
      <p className="text-sm text-foreground/70">Completing sign-in…</p>
    </div>
  );
}
