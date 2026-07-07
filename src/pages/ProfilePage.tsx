import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Calendar,
  ShieldCheck,
  FileCheck,
  Save,
  Upload,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Stats {
  totalVerifications: number;
  totalCertificates: number;
  verifiedCount: number;
  latestVerificationDate: string | null;
}

export default function ProfilePage() {
  const { user, updateUserDisplayName } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<Stats>({ totalVerifications: 0, totalCertificates: 0, verifiedCount: 0, latestVerificationDate: null });
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch profile
      const { data: prof } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (prof) {
        setProfile(prof as ProfileData);
        setDisplayName(prof.display_name || "");
      }

      // Fetch stats
      const { data: claims } = await supabase
        .from("claims")
        .select("id, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const { count: certCount } = await supabase
        .from("certificates")
        .select("*", { count: "exact", head: true })
        .in("claim_id", (claims || []).map((c: { id: string }) => c.id));

      setStats({
        totalVerifications: claims?.length || 0,
        verifiedCount: claims?.filter((c: { status: string }) => c.status === "verified").length || 0,
        totalCertificates: certCount || 0,
        latestVerificationDate: claims?.[0]?.created_at || null,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await updateUserDisplayName(displayName);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <Link to="/dashboard" className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/50 transition-colors hover:text-foreground cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left — Profile Card */}
        <div className="lg:col-span-1">
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <User className="h-12 w-12" />
              )}
            </div>
            <h2 className="font-heading text-xl font-bold text-foreground">
              {profile?.display_name || user?.email?.split("@")[0] || "User"}
            </h2>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-foreground/50">
              <Mail className="h-3.5 w-3.5" /> {user?.email}
            </p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-foreground/35">
              <Calendar className="h-3.5 w-3.5" />
              Joined {new Date(user?.created_at || "").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* Right — Stats & Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={ShieldCheck} label="Total Verifications" value={stats.totalVerifications} />
            <StatCard icon={ShieldCheck} label="Verified" value={stats.verifiedCount} color="text-success" />
            <StatCard icon={FileCheck} label="Certificates" value={stats.totalCertificates} />
            <StatCard icon={Calendar} label="Latest" value={stats.latestVerificationDate ? new Date(stats.latestVerificationDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"} small />
          </div>

          {/* Edit Profile */}
          <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
            <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">Account Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground/70">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-btn border border-border bg-background px-4 py-3 text-foreground transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground/70">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-foreground/30">
                    <User className="h-8 w-8" />
                  </div>
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 rounded-btn border border-border px-4 py-2.5 text-sm font-medium text-foreground/50 cursor-not-allowed"
                    title="Coming soon"
                  >
                    <Upload className="h-4 w-4" /> Upload (coming soon)
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-btn bg-accent px-6 py-3 text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
              >
                {saving ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving…</> : saved ? <><Save className="h-5 w-5" /> Saved!</> : <><Save className="h-5 w-5" /> Save Changes</>}
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link to="/history" className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">My Verifications</p>
                <p className="text-sm text-foreground/45">View your verification history</p>
              </div>
            </Link>
            <Link to="/verify" className="flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">New Verification</p>
                <p className="text-sm text-foreground/45">Submit a new claim</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, small }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; color?: string; small?: boolean }) {
  return (
    <div className="rounded-card border border-border bg-surface px-4 py-4 shadow-sm">
      <Icon className="mb-2 h-5 w-5 text-foreground/30" />
      <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/40">{label}</p>
      <p className={`mt-1 ${small ? "text-sm" : "text-xl"} font-heading font-bold ${color || "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}