import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  ShieldCheck,
  FileCheck,
  ArrowRight,
  Clock,
  History,
  Plus,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

interface DashboardStats {
  totalClaims: number;
  verifiedClaims: number;
  certificatesGenerated: number;
  latestVerificationDate: string | null;
  lastClaimId: string | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClaims: 0,
    verifiedClaims: 0,
    certificatesGenerated: 0,
    latestVerificationDate: null,
    lastClaimId: null,
  });
  const [loading, setLoading] = useState(true);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const { data: claims } = await supabase
        .from("claims")
        .select("id, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const claimIds = (claims || []).map((c: { id: string }) => c.id);

      let certCount = 0;
      if (claimIds.length > 0) {
        const { count } = await supabase
          .from("certificates")
          .select("*", { count: "exact", head: true })
          .in("claim_id", claimIds);
        certCount = count || 0;
      }

      setStats({
        totalClaims: claims?.length || 0,
        verifiedClaims: claims?.filter((c: { status: string }) => c.status === "verified").length || 0,
        certificatesGenerated: certCount,
        latestVerificationDate: claims?.[0]?.created_at || null,
        lastClaimId: claims?.[0]?.id || null,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  const hasHistory = stats.totalClaims > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Welcome back, {displayName}! 👋
        </h1>
        <p className="mt-2 text-lg text-foreground/50">
          Ready to verify another real-world claim today?
        </p>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={ShieldCheck} label="Total Claims" value={stats.totalClaims} />
        <StatCard icon={ShieldCheck} label="Verified" value={stats.verifiedClaims} color="text-success" />
        <StatCard icon={FileCheck} label="Certificates" value={stats.certificatesGenerated} />
        <StatCard icon={Clock} label="Latest" value={stats.latestVerificationDate ? new Date(stats.latestVerificationDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"} small />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/verify"
          className="group flex items-center justify-between rounded-card border border-border bg-surface p-6 shadow-sm transition-all duration-200 hover:border-accent/40 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">New Verification</p>
              <p className="text-sm text-foreground/45">Submit a new claim for AI analysis</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-foreground/25 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>

        {hasHistory && stats.lastClaimId ? (
          <Link
            to={`/results/${stats.lastClaimId}`}
            className="group flex items-center justify-between rounded-card border border-border bg-surface p-6 shadow-sm transition-all duration-200 hover:border-accent/40 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <ArrowRight className="h-6 w-6 -rotate-45" />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-foreground">Continue Last Verification</p>
                <p className="text-sm text-foreground/45">View your most recent result</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-foreground/25 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <Link
            to="/verify"
            className="group flex items-center justify-between rounded-card border border-border bg-surface p-6 shadow-sm transition-all duration-200 hover:border-accent/40 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-foreground/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-foreground">Start Your First Verification</p>
                <p className="text-sm text-foreground/45">Get started with AI-powered claim verification</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-foreground/25 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* History Link */}
      {hasHistory && (
        <div className="mt-8 text-center">
          <Link
            to="/history"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/50 transition-colors hover:text-foreground cursor-pointer"
          >
            <History className="h-4 w-4" /> View Full Verification History
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, small }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; color?: string; small?: boolean }) {
  return (
    <div className="rounded-card border border-border bg-surface px-5 py-4 shadow-sm">
      <Icon className="mb-2 h-5 w-5 text-foreground/25" />
      <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/40">{label}</p>
      <p className={`mt-1 ${small ? "text-sm" : "text-2xl"} font-heading font-bold ${color || "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}