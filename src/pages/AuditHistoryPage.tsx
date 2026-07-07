import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  History,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Filter,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  VERIFICATION_LABELS,
  VERIFICATION_TYPES,
  getClaimTypeLabel,
} from "../services/verification/types";

// ── Types ──

interface HistoryItem {
  claimId: string;
  claimType: string;
  description: string | null;
  status: string;
  treeCount: number | null;
  confidenceScore: number;
  hasBlockchain: boolean;
  createdAt: string;
}

// ── Helpers ──

function getStatusBadge(status: string) {
  switch (status) {
    case "verified":
      return { label: "Verified", icon: CheckCircle2, bg: "bg-success/10", text: "text-success", border: "border-success/25" };
    case "inconclusive":
      return { label: "Inconclusive", icon: AlertCircle, bg: "bg-warning/10", text: "text-warning", border: "border-warning/25" };
    case "rejected":
      return { label: "Rejected", icon: XCircle, bg: "bg-error/10", text: "text-error", border: "border-error/25" };
    default:
      return { label: "Pending", icon: Clock, bg: "bg-muted", text: "text-foreground/50", border: "border-border" };
  }
}

export default function AuditHistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const { data: claims, error: claimsError } = await supabase
          .from("claims")
          .select(`
            id, claim_type, description, status, created_at,
            verification_results ( tree_count, confidence_score ),
            blockchain_records ( id )
          `)
          .order("created_at", { ascending: false });

        if (claimsError) throw new Error(claimsError.message);

        const mapped: HistoryItem[] = (claims || []).map((claim: Record<string, unknown>) => ({
          claimId: claim.id as string,
          claimType: claim.claim_type as string,
          description: claim.description as string | null,
          status: claim.status as string,
          treeCount: Array.isArray(claim.verification_results) && claim.verification_results[0]
            ? (claim.verification_results[0] as Record<string, unknown>).tree_count as number | null
            : null,
          confidenceScore: Array.isArray(claim.verification_results) && claim.verification_results[0]
            ? (claim.verification_results[0] as Record<string, unknown>).confidence_score as number
            : 0,
          hasBlockchain: Array.isArray(claim.blockchain_records) && claim.blockchain_records.length > 0,
          createdAt: claim.created_at as string,
        }));

        setItems(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audit history.");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  // ── Filtered items ──
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterType !== "all" && item.claimType !== filterType) return false;
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = item.claimId.toLowerCase().includes(q);
        const matchesType = getClaimTypeLabel(item.claimType).toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q) || false;
        if (!matchesId && !matchesType && !matchesDesc) return false;
      }
      return true;
    });
  }, [items, filterType, filterStatus, searchQuery]);

  // ── Dashboard stats ──
  const stats = useMemo(() => {
    const total = items.length;
    const verified = items.filter((i) => i.status === "verified").length;
    const pending = items.filter((i) => i.status === "pending").length;
    const rejected = items.filter((i) => i.status === "rejected").length;
    const withBlockchain = items.filter((i) => i.hasBlockchain).length;
    const avgConfidence = total > 0
      ? Math.round(items.reduce((sum, i) => sum + i.confidenceScore, 0) / total)
      : 0;

    const typeCounts: Record<string, number> = {};
    items.forEach((i) => { typeCounts[i.claimType] = (typeCounts[i.claimType] || 0) + 1; });
    const mostUsedType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

    return { total, verified, pending, rejected, withBlockchain, avgConfidence, mostUsedType };
  }, [items]);

  const hasActiveFilters = filterType !== "all" || filterStatus !== "all" || searchQuery.trim() !== "";

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" aria-hidden="true" />
          <p className="text-foreground/50">Loading audit history…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center rounded-2xl border border-error/20 bg-error/5 px-8 py-14 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error/10">
            <AlertTriangle className="h-7 w-7 text-error" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-foreground">Failed to Load History</h2>
          <p className="mt-2 max-w-md text-foreground/55">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Audit History</h1>
          <p className="mt-2 text-foreground/50">
            Browse all verified claims and their blockchain records.
          </p>
        </div>
      </div>

      {/* ── Dashboard Stats ── */}
      {items.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          <StatCard label="Total Claims" value={stats.total} />
          <StatCard label="Verified" value={stats.verified} color="text-success" />
          <StatCard label="Pending" value={stats.pending} color="text-foreground/50" />
          <StatCard label="Rejected" value={stats.rejected} color="text-error" />
          <StatCard label="On-Chain" value={stats.withBlockchain} />
          <StatCard label="Avg Confidence" value={`${stats.avgConfidence}%`} />
          {stats.mostUsedType && (
            <StatCard
              label="Top Type"
              value={getClaimTypeLabel(stats.mostUsedType[0])}
              small
            />
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by claim ID or type…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-btn border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground/25 transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 rounded-btn border px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              showFilters || hasActiveFilters
                ? "border-accent bg-accent/5 text-accent"
                : "border-border text-foreground/60 hover:border-primary/30 hover:text-foreground"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                !
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => { setFilterType("all"); setFilterStatus("all"); setSearchQuery(""); }}
              className="text-sm text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-btn border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Types</option>
              {VERIFICATION_TYPES.map((type) => (
                <option key={type} value={type}>{VERIFICATION_LABELS[type]}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-btn border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="inconclusive">Inconclusive</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      {filteredItems.length > 0 ? (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3.5 font-semibold text-foreground/70">Claim</th>
                  <th className="px-5 py-3.5 font-semibold text-foreground/70">Type</th>
                  <th className="px-5 py-3.5 font-semibold text-foreground/70">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-foreground/70 hidden sm:table-cell">Confidence</th>
                  <th className="px-5 py-3.5 font-semibold text-foreground/70 hidden lg:table-cell">Blockchain</th>
                  <th className="px-5 py-3.5 font-semibold text-foreground/70 hidden lg:table-cell">Date</th>
                  <th className="px-5 py-3.5 font-semibold text-foreground/70">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => {
                  const badge = getStatusBadge(item.status);
                  const BadgeIcon = badge.icon;
                  return (
                    <tr key={item.claimId} className="transition-colors hover:bg-surface-alt/60">
                      <td className="px-5 py-4">
                        <div className="max-w-[180px]">
                          <p className="font-medium text-foreground truncate">
                            {item.description || getClaimTypeLabel(item.claimType)}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-foreground/30">
                            {item.claimId.slice(0, 8)}…
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-foreground/60">
                          {getClaimTypeLabel(item.claimType)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text} ${badge.border}`}>
                          <BadgeIcon className="h-3 w-3" /> {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                item.confidenceScore >= 70 ? "bg-success" : item.confidenceScore >= 50 ? "bg-warning" : "bg-error"
                              }`}
                              style={{ width: `${item.confidenceScore}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums text-foreground/50">{item.confidenceScore}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        {item.hasBlockchain ? (
                          <span className="inline-flex items-center gap-1 text-xs text-success">
                            <CheckCircle2 className="h-3 w-3" /> Recorded
                          </span>
                        ) : (
                          <span className="text-xs text-foreground/30">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-xs text-foreground/45 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/results/${item.claimId}`}
                          className="inline-flex items-center gap-1 rounded-btn px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                        >
                          <Search className="h-3.5 w-3.5" /> View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-5 py-3 text-xs text-foreground/40">
            {filteredItems.length} claim{filteredItems.length !== 1 ? "s" : ""}
            {hasActiveFilters && ` (filtered from ${items.length})`}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-card border border-border bg-surface px-6 py-20 text-center">
          <div className="mb-5 inline-flex rounded-full bg-muted p-4 text-foreground/30">
            <History className="h-10 w-10" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {items.length === 0 ? "No verifications yet" : "No matching claims"}
          </h2>
          <p className="mt-2 max-w-sm text-foreground/50">
            {items.length === 0
              ? "Start by verifying a claim. Your results will appear here with full audit trail details."
              : "Try adjusting your filters to see more results."}
          </p>
          {items.length === 0 && (
            <Link
              to="/verify"
              className="mt-6 inline-flex items-center gap-2 rounded-btn bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" /> Start Verification
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stat card ──
function StatCard({ label, value, color, small }: { label: string; value: string | number; color?: string; small?: boolean }) {
  return (
    <div className="rounded-card border border-border bg-surface px-4 py-3 shadow-sm">
      <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/40">{label}</p>
      <p className={`mt-1 ${small ? "text-sm" : "text-xl"} font-heading font-bold ${color || "text-foreground"} truncate`}>
        {value}
      </p>
    </div>
  );
}