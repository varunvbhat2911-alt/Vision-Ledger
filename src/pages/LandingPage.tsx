import { Link } from "react-router-dom";
import {
  Leaf,
  ShieldCheck,
  FileCheck,
  Search,
  Upload,
  Cpu,
  Download,
  ArrowRight,
  CheckCircle,
  Sun,
  Building2,
  Package,
  Trash2,
  Sprout,
  Waves,
} from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "Multi-Industry AI Analysis",
    description:
      "Upload visual evidence and our AI analyses it across 8 verification domains — from tree plantations to solar installations, construction progress to waste processing.",
  },
  {
    icon: ShieldCheck,
    title: "Immutable Audit Trail",
    description:
      "Every verified claim is cryptographically hashed and recorded, creating a permanent, tamper-proof record that auditors across any industry can trust.",
  },
  {
    icon: Download,
    title: "Verifiable Certificates",
    description:
      "Download a verifiable PDF certificate with embedded QR code — proof of your real-world claim that anyone can independently validate.",
  },
];

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Upload Evidence",
    description:
      "Select your verification type, then upload a photo of the real-world evidence. Supported formats: JPG, PNG.",
  },
  {
    step: "02",
    icon: Search,
    title: "AI Verification",
    description:
      "Our vision model analyses the image against your claim type, generating metrics, confidence scores, and a detailed report in seconds.",
  },
  {
    step: "03",
    icon: FileCheck,
    title: "Record & Certify",
    description:
      "Record the verified claim immutably on-chain and download a shareable PDF certificate with a QR code linking back to the proof.",
  },
];

const trustPoints = [
  "SHA-256 cryptographically hashed records",
  "AI confidence scoring for every claim",
  "Tamper-proof blockchain audit trail",
  "Verifiable PDF certificates with QR codes",
  "8 verification domains supported",
];

const useCases = [
  { icon: Leaf, label: "Tree Plantation" },
  { icon: Sun, label: "Solar Installation" },
  { icon: Building2, label: "Construction" },
  { icon: Package, label: "Delivery" },
  { icon: Trash2, label: "Waste Processing" },
  { icon: Building2, label: "Infrastructure" },
  { icon: Sprout, label: "Agriculture" },
  { icon: Waves, label: "Water Bodies" },
];

export default function LandingPage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-surface-alt via-background to-background px-4 pb-24 pt-16 sm:px-6 sm:pb-32 sm:pt-24">
        {/* Decorative background blobs */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/6 to-transparent blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-accent/8 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            AI-Powered Proof of Reality Platform
          </div>

          <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Prove Every Claim.
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Build Trust with AI.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-foreground/65 leading-relaxed">
            Verify real-world claims using Vision AI and Blockchain. VisionLedger
            analyses visual evidence across 8 industries, records results
            immutably, and generates verifiable certificates — bringing radical
            transparency to environmental and industrial action.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/verify"
              className="group inline-flex items-center gap-2 rounded-btn bg-accent px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-accent/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
            >
              Start Verification
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              to="/history"
              className="inline-flex items-center gap-2 rounded-btn border-2 border-border bg-surface px-8 py-3.5 text-base font-semibold text-foreground transition-all duration-200 hover:border-primary/50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
            >
              View Audit Log
            </Link>
          </div>

          {/* Use case badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {useCases.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground/60 shadow-sm"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-foreground/60">
              Three simple steps from real-world evidence to immutable proof.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {step}
                </span>

                <div className="mb-4 inline-flex rounded-xl bg-accent/10 p-3.5 text-accent">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>

                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-foreground/55 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-surface-alt px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Built for Transparency
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-foreground/60">
              Every feature is designed to create a verifiable chain of trust —
              from image upload to blockchain record and final certificate.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="group rounded-card border border-border bg-surface p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-default"
              >
                <div className="mb-4 inline-flex rounded-lg bg-accent/10 p-3 text-accent transition-colors duration-200 group-hover:bg-accent/15">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-foreground/60 leading-relaxed">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / Credibility ── */}
      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Built for Auditors, NGOs &amp; Enterprises
          </div>

          <h2 className="mt-6 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Evidence You Can Trust
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-foreground/60">
            VisionLedger is designed for accountability across industries. Every
            claim is cryptographically secured and independently verifiable.
          </p>

          <ul className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            {trustPoints.map((point) => (
              <li
                key={point}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground/70 shadow-sm"
              >
                <CheckCircle className="h-4 w-4 text-success" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-accent p-10 text-center shadow-lg sm:p-14">
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Ready to verify your first claim?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/75">
            Select your verification type, upload evidence, and get an
            AI-powered verification report with a tamper-proof audit trail
            in minutes.
          </p>
          <Link
            to="/verify"
            className="mt-8 inline-flex items-center gap-2 rounded-btn bg-white px-8 py-3.5 text-base font-semibold text-primary shadow-md transition-all duration-200 hover:bg-white/95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-primary cursor-pointer"
          >
            <Upload className="h-5 w-5" aria-hidden="true" />
            Start Verification
          </Link>
        </div>
      </section>
    </div>
  );
}