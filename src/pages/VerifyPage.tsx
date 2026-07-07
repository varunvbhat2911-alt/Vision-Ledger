import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Loader2,
  ShieldCheck,
  Info,
  ChevronDown,
  AlertTriangle,
  X,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { createVisionService } from "../services/vision";
import {
  VERIFICATION_TYPES,
  VERIFICATION_LABELS,
  VERIFICATION_ICONS,
  VERIFICATION_INSTRUCTIONS,
} from "../services/verification/types";
import type { VerificationType } from "../services/verification/types";

const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const visionService = createVisionService(
  VITE_SUPABASE_URL,
  isSupabaseConfigured ? "gemini" : "mock",
);

type SubmitStatus =
  | { phase: "idle" }
  | { phase: "uploading"; message: string }
  | { phase: "analyzing"; message: string }
  | { phase: "saving"; message: string }
  | { phase: "error"; message: string };

export default function VerifyPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [verificationType, setVerificationType] = useState<VerificationType>("tree_plantation");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>({ phase: "idle" });
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const TypeIcon = VERIFICATION_ICONS[verificationType];
  const instructions = VERIFICATION_INSTRUCTIONS[verificationType];

  const handleFileChange = useCallback((file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus({ phase: "error", message: "Only image files (JPG, PNG) are accepted." });
      return;
    }
    setImageFile(file);
    setStatus({ phase: "idle" });
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files[0]);
  }, [handleFileChange]);

  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
  }, []);

  const handleSubmit = async () => {
    if (!imageFile || !verificationType) return;

    try {
      // Always fetch fresh authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        throw new Error("No authenticated user found. Please login again.");
      }

      // ---------------- CREATE CLAIM ----------------
      setStatus({
        phase: "uploading",
        message: "Creating claim record...",
      });

      const { data: claim, error: claimError } = await supabase
        .from("claims")
        .insert({
          user_id: user.id,
          claim_type: verificationType,
          description,
          status: "pending",
        })
        .select()
        .single();

      if (claimError) {
        console.error("CLAIMS INSERT ERROR:", claimError);
        throw new Error(
          `Claims Error: ${claimError.message} (${claimError.code})`
        );
      }

      const claimId = claim.id;

      // ---------------- UPLOAD IMAGE ----------------

      setStatus({
        phase: "uploading",
        message: "Uploading evidence image...",
      });

      const ext = imageFile.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `${claimId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("claim-images")
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error("UPLOAD ERROR:", uploadError);
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from("claim-images")
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("claims")
        .update({
          image_url: imageUrl,
        })
        .eq("id", claimId);

      if (updateError) {
        console.error("CLAIMS UPDATE ERROR:", updateError);
        throw new Error(updateError.message);
      }

      // ---------------- AI ----------------

      setStatus({
        phase: "analyzing",
        message: "Running AI analysis...",
      });

      const result = await visionService.analyze(
        imagePreview!,
        verificationType
      );

      // ---------------- SAVE RESULT ----------------

      setStatus({
        phase: "saving",
        message: "Saving verification result...",
      });

      const metrics: Record<string, string | number> = {};

      if (result.metrics) {
        Object.entries(result.metrics).forEach(([k, v]) => {
          metrics[k] = v;
        });
      }

      const { error: resultError } = await supabase
        .from("verification_results")
        .insert({
          claim_id: claimId,
          user_id: user.id,
          verification_type: verificationType,
          tree_count: result.tree_count,
          confidence_score: result.confidence_score,
          explanation: result.explanation,
          raw_ai_response: result.raw_response,
          metrics,
        });

      if (resultError) {
        console.error("VERIFICATION_RESULTS ERROR:", resultError);
        throw new Error(
          `Verification Results Error: ${resultError.message} (${resultError.code})`
        );
      }

      const claimStatus =
        result.confidence_score >= 70
          ? "verified"
          : result.confidence_score >= 50
          ? "inconclusive"
          : "rejected";

      const { error: statusError } = await supabase
        .from("claims")
        .update({
          status: claimStatus,
        })
        .eq("id", claimId);

      if (statusError) {
        console.error("STATUS UPDATE ERROR:", statusError);
        throw new Error(statusError.message);
      }

      setStatus({ phase: "idle" });

      navigate(`/results/${claimId}`);
    } catch (err) {
      console.error("FULL ERROR:", err);

      setStatus({
        phase: "error",
        message:
          err instanceof Error
            ? err.message
            : "Unknown error occurred.",
      });
    }
  };

  const isLoading = status.phase !== "idle" && status.phase !== "error";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Verify a Claim
        </h1>
        <p className="mt-2 text-foreground/50">
          Select a verification type, upload visual evidence, and let AI analyse it.
        </p>
      </div>

      <div className="space-y-8">
        <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
          <label className="mb-3 block text-sm font-semibold text-foreground/70">
            Verification Type
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
              disabled={isLoading}
              className="flex w-full items-center justify-between rounded-btn border border-border bg-background px-4 py-3 text-left text-foreground transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer disabled:opacity-50"
            >
              <span className="flex items-center gap-3">
                <TypeIcon className="h-5 w-5 text-accent" aria-hidden="true" />
                <span className="font-medium">{VERIFICATION_LABELS[verificationType]}</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 text-foreground/40 transition-transform duration-200 ${typeDropdownOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {typeDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-card border border-border bg-surface shadow-lg">
                <ul className="max-h-60 overflow-y-auto py-1">
                  {VERIFICATION_TYPES.map((type) => {
                    const Icon = VERIFICATION_ICONS[type];
                    const isActive = type === verificationType;
                    return (
                      <li key={type}>
                        <button
                          type="button"
                          onClick={() => {
                            setVerificationType(type);
                            setTypeDropdownOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                            isActive
                              ? "bg-accent/10 text-accent font-semibold"
                              : "text-foreground/70 hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                          {VERIFICATION_LABELS[type]}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-accent/5 border border-accent/15 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <p className="text-sm text-foreground/60 leading-relaxed">{instructions}</p>
          </div>
        </div>

        <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
          <label className="mb-3 block text-sm font-semibold text-foreground/70">
            Evidence Image
          </label>

          {imagePreview ? (
            <div className="relative overflow-hidden rounded-card border border-border">
              <img
                src={imagePreview}
                alt="Evidence preview"
                className="w-full h-64 object-cover"
              />
              {!isLoading && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-foreground/75 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm transition-all hover:bg-destructive cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed border-border bg-background px-6 py-14 transition-colors hover:border-accent/40 hover:bg-accent/[0.02]"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="mb-3 rounded-full bg-accent/10 p-3.5 text-accent">
                <Upload className="h-7 w-7" aria-hidden="true" />
              </div>
              <p className="font-medium text-foreground/60">
                Drag &amp; drop an image, or click to browse
              </p>
              <p className="mt-1 text-sm text-foreground/35">
                JPG or PNG, up to 10 MB
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            className="hidden"
          />

          <div className="mt-5">
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-semibold text-foreground/70"
            >
              Description{" "}
              <span className="font-normal text-foreground/35">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what this evidence shows…"
              disabled={isLoading}
              className="w-full resize-none rounded-btn border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground/25 transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        {status.phase !== "idle" && (
          <div
            className={`rounded-card border px-5 py-4 ${
              status.phase === "error"
                ? "border-error/20 bg-error/5 text-error"
                : "border-accent/20 bg-accent/5 text-accent"
            }`}
          >
            <div className="flex items-center gap-3">
              {status.phase === "error" ? (
                <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
              )}
              <p className="text-sm font-medium">{status.message}</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!imageFile || isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-btn bg-accent px-6 py-4 text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-accent/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Processing…
            </>
          ) : (
            <>
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              Verify Claim
            </>
          )}
        </button>
      </div>
    </div>
  );
}