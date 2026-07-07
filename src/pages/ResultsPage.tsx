import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShieldCheck,
  FileDown,
  Link2,
  Clock,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { blockchainService } from "../services/blockchain/blockchainService";
import { CertificateService } from "../services/certificate/certificateService";
import type { CertificateData } from "../services/certificate/certificateService";
import {
  VERIFICATION_LABELS,
  VERIFICATION_METRICS,
  VERIFICATION_ICONS,
  getClaimTypeLabel,
} from "../services/verification/types";

// ── Types ──

interface ClaimRow {
  id: string;
  claim_type: string;
  description: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
}

interface VerificationResultRow {
  id: string;
  claim_id: string;
  tree_count: number | null;
  confidence_score: number;
  explanation: string | null;
  raw_ai_response: unknown;
  verification_type: string | null;
  metrics: Record<string, string | number> | null;
  created_at: string;
}

type PageState =
  | { stage: "loading" }
  | { stage: "error"; message: string }
  | { stage: "not_found" }
  | { stage: "ready"; claim: ClaimRow; result: VerificationResultRow };

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

function getConfidenceColor(score: number) {
  if (score >= 70) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-error";
}

// ── Circular Gauge ──

function CircularGauge({ score, size = 180, strokeWidth = 12 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (progress / 100) * circumference;
  const strokeColor = score >= 70 ? "oklch(0.62 0.16 150)" : score >= 50 ? "oklch(0.68 0.14 75)" : "oklch(0.58 0.21 25)";
  const colorClass = getConfidenceColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="oklch(0.94 0.02 140)" strokeWidth={strokeWidth} strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-[stroke-dashoffset] duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-heading text-4xl font-bold ${colorClass}`}>{Math.round(score)}%</span>
        <span className="mt-1 text-xs font-medium uppercase tracking-wider text-foreground/40">Confidence</span>
      </div>
    </div>
  );
}

// ── Metric Card ──

function MetricCard({ label, value, primary }: { label: string; value: string | number; primary?: boolean }) {
  const displayValue = typeof value === "number" ? value : value;
  const isNum = typeof value === "number";
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-border bg-surface px-6 py-8 shadow-sm">
      <h2 className="mb-6 font-heading text-lg font-semibold text-foreground">{label}</h2>
      <span className={`font-heading ${primary ? "text-6xl" : "text-4xl"} font-bold text-foreground`}>
        {isNum ? Math.round(displayValue as number) : displayValue}
      </span>
      <p className="mt-4 text-sm text-foreground/45">AI-detected metric from your evidence</p>
    </div>
  );
}

// ── Page Component ──

export default function ResultsPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const [state, setState] = useState<PageState>({ stage: "loading" });
  const [isRecording, setIsRecording] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [blockchainRecord, setBlockchainRecord] = useState<{ txHash?: string; status?: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!claimId) { setState({ stage: "not_found" }); return; }
    setState({ stage: "loading" });
    try {
      const [claimRes, resultRes] = await Promise.all([
        supabase.from("claims").select("*").eq("id", claimId).single(),
        supabase.from("verification_results").select("*").eq("claim_id", claimId).single(),
      ]);
      if (claimRes.error || !claimRes.data) {
        setState({ stage: claimRes.error?.code === "PGRST116" ? "not_found" : "error", message: claimRes.error?.message || "Failed to load claim." });
        return;
      }
      if (resultRes.error || !resultRes.data) {
        setState({ stage: "error", message: resultRes.error?.code === "PGRST116" ? "Verification results not yet available." : resultRes.error?.message || "Failed to load results." });
        return;
      }
      setState({ stage: "ready", claim: claimRes.data as ClaimRow, result: resultRes.data as VerificationResultRow });
    } catch (err) {
      setState({ stage: "error", message: err instanceof Error ? err.message : "Unexpected error." });
    }
  }, [claimId]);

  useEffect(() => {
    async function checkBlockchain() {
      if (!claimId) return;
      try {
        const record = await blockchainService.getVerification(claimId);
        if (record) setBlockchainRecord({ txHash: record.txHash ?? undefined, status: record.status });
      } catch { /* no record yet */ }
    }
    fetchData();
    checkBlockchain();
  }, [fetchData, claimId]);

  // ── Actions ──

  const handleRecordOnBlockchain = async () => {
    if (state.stage !== "ready" || !claimId) return;
    setIsRecording(true);
    try {
      const record = await blockchainService.recordVerification({
        claimId,
        evidenceImageUrl: state.claim.image_url || "",
        evidenceHash: "",
        verificationHash: "",
        treeCount: state.result.tree_count ?? 0,
        confidenceScore: state.result.confidence_score,
        claimType: state.claim.claim_type,
        timestamp: new Date().toISOString(),
      });
      setBlockchainRecord({ txHash: record.txHash ?? undefined, status: record.status });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to record on blockchain.");
    } finally {
      setIsRecording(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (state.stage !== "ready" || !claimId) return;
    setIsDownloading(true);
    try {
      const metrics = state.result.metrics || {};
      const type = state.claim.claim_type;
      const typeLabel = getClaimTypeLabel(type);
      const metricDefs = type in VERIFICATION_METRICS ? VERIFICATION_METRICS[type as keyof typeof VERIFICATION_METRICS] : [];
      const primaryDef = metricDefs.find((m) => m.primary) || metricDefs[0];

      const certData: CertificateData = {
        claimId,
        claimType: type,
        claimTypeLabel: typeLabel,
        description: state.claim.description,
        verificationDate: new Date(state.result.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        primaryMetric: { label: primaryDef?.label || "Primary Metric", value: primaryDef ? (metrics[primaryDef.key] ?? "N/A") : (state.result.tree_count ?? 0) },
        metrics: metricDefs.filter((m) => !m.primary).map((m) => ({ label: m.label, value: metrics[m.key] ?? "N/A" })),
        confidenceScore: state.result.confidence_score,
        status: state.claim.status,
        evidenceHash: blockchainRecord?.txHash?.slice(0, 32) ?? null,
        verificationHash: blockchainRecord?.txHash ?? null,
        txHash: blockchainRecord?.txHash ?? null,
        verificationUrl: `${window.location.origin}/results/${claimId}`,
      };
      await CertificateService.downloadCertificate(certData);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate certificate.");
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Loading ──
  if (state.stage === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" aria-hidden="true" />
          <p className="text-foreground/50">Loading results…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (state.stage === "error") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center rounded-2xl border border-error/20 bg-error/5 px-8 py-14 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error/10">
            <AlertTriangle className="h-7 w-7 text-error" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-foreground">Failed to Load Results</h2>
          <p className="mt-2 max-w-md text-foreground/55">{state.message}</p>
          <button onClick={fetchData} className="mt-6 inline-flex items-center gap-2 rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Not Found ──
  if (state.stage === "not_found") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center rounded-2xl border border-border bg-surface px-8 py-14 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <AlertCircle className="h-7 w-7 text-foreground/30" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-foreground">Claim Not Found</h2>
          <p className="mt-2 text-foreground/55">The claim you're looking for doesn't exist or may have been removed.</p>
          <Link to="/verify" className="mt-6 inline-flex items-center gap-2 rounded-btn bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Submit a New Claim
          </Link>
        </div>
      </div>
    );
  }

  // ── Ready ──
  const { claim, result } = state;
  const badge = getStatusBadge(claim.status);
  const BadgeIcon = badge.icon;
  const confidenceColor = getConfidenceColor(result.confidence_score);
  const hasBlockchainRecord = blockchainRecord?.txHash != null;
  const claimType = claim.claim_type;
  const typeLabel = getClaimTypeLabel(claimType);
  const TypeIcon = claimType in VERIFICATION_ICONS ? VERIFICATION_ICONS[claimType as keyof typeof VERIFICATION_ICONS] : null;
  const metricDefs = claimType in VERIFICATION_METRICS ? VERIFICATION_METRICS[claimType as keyof typeof VERIFICATION_METRICS] : [];
  const metrics = result.metrics || {};
  const primaryDef = metricDefs.find((m) => m.primary) || metricDefs[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Back Link */}
      <Link to="/verify" className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/50 transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> New Verification
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Verification Results
          </h1>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${badge.bg} ${badge.text} ${badge.border}`}>
            <BadgeIcon className="h-3.5 w-3.5" /> {badge.label}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-foreground/45">
          {TypeIcon && (
            <span className="inline-flex items-center gap-1">
              <TypeIcon className="h-3.5 w-3.5" /> {typeLabel}
            </span>
          )}
          <span>
            Claim ID: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{claim.id.slice(0, 8)}…</code>
          </span>
          <span>
            Submitted: {new Date(claim.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gauge Card */}
        <div className="flex flex-col items-center rounded-card border border-border bg-surface px-6 py-8 shadow-sm">
          <h2 className="mb-6 font-heading text-lg font-semibold text-foreground">AI Confidence Score</h2>
          <CircularGauge score={result.confidence_score} />
          <p className="mt-4 text-sm text-foreground/45">
            {result.confidence_score >= 70 ? "High confidence — strong evidence detected." : result.confidence_score >= 50 ? "Moderate confidence — some evidence found." : "Low confidence — limited evidence detected."}
          </p>
        </div>

        {/* Dynamic Primary Metric Card */}
        <MetricCard
          label={primaryDef?.label || "Primary Metric"}
          value={primaryDef ? (metrics[primaryDef.key] ?? 0) : (result.tree_count ?? 0)}
          primary
        />
      </div>

      {/* Additional Metrics */}
      {metricDefs.filter((m) => !m.primary).length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metricDefs.filter((m) => !m.primary).map((def) => {
            const val = metrics[def.key];
            const displayVal = val !== undefined ? (typeof val === "number" ? `${Math.round(val)}${def.unit || ""}` : val) : "N/A";
            return (
              <div key={def.key} className="rounded-card border border-border bg-surface px-5 py-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-foreground/40">{def.label}</p>
                <p className="mt-1 font-heading text-2xl font-bold text-foreground">{displayVal}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Blockchain Record Status */}
      {hasBlockchainRecord && (
        <div className="mt-6 rounded-card border border-success/20 bg-success/5 px-6 py-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="font-heading font-semibold text-success">Immutably Recorded</span>
          </div>
          <p className="text-sm text-foreground/55">
            Transaction Hash:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs break-all">{blockchainRecord.txHash}</code>
          </p>
        </div>
      )}

      {/* AI Explanation */}
      {result.explanation && (
        <div className="mt-6 rounded-card border border-border bg-surface px-6 py-6 shadow-sm">
          <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">AI Explanation</h2>
          <div className="text-foreground/70 leading-relaxed whitespace-pre-wrap">{result.explanation}</div>
        </div>
      )}

      {/* Uploaded Image */}
      {claim.image_url && (
        <div className="mt-6 overflow-hidden rounded-card border border-border bg-surface shadow-sm">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-heading text-lg font-semibold text-foreground">Submitted Evidence</h2>
          </div>
          <img src={claim.image_url} alt="Uploaded evidence" className="w-full max-h-96 object-cover" />
        </div>
      )}

      {/* Claim Description */}
      {claim.description && (
        <div className="mt-6 rounded-card border border-border bg-surface px-6 py-5 shadow-sm">
          <h2 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wider text-foreground/40">Your Description</h2>
          <p className="text-foreground/70 leading-relaxed">{claim.description}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleRecordOnBlockchain}
          disabled={isRecording || !!hasBlockchainRecord}
          className="flex items-center justify-center gap-2.5 rounded-btn border border-border bg-surface px-6 py-3.5 text-base font-semibold shadow-sm transition-all duration-200 hover:border-primary/40 hover:text-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {isRecording ? <><Loader2 className="h-5 w-5 animate-spin" /> Recording…</> : hasBlockchainRecord ? <><CheckCircle2 className="h-5 w-5 text-success" /> Recorded on Blockchain</> : <><Link2 className="h-5 w-5" /> Record on Blockchain</>}
        </button>
        <button
          type="button"
          onClick={handleDownloadCertificate}
          disabled={isDownloading}
          className="flex items-center justify-center gap-2.5 rounded-btn bg-accent px-6 py-3.5 text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-accent/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {isDownloading ? <><Loader2 className="h-5 w-5 animate-spin" /> Generating…</> : <><FileDown className="h-5 w-5" /> Download Certificate</>}
        </button>
      </div>

      {/* Verify Another */}
      <div className="mt-8 text-center">
        <Link
          to="/verify"
          className="inline-flex items-center gap-2 rounded-btn bg-accent px-6 py-3 text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-accent/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
        >
          <ShieldCheck className="h-5 w-5" /> Verify Another Claim
        </Link>
      </div>
    </div>
  );
}