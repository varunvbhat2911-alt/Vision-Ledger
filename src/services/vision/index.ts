export type {
  VisionService,
  AdvancedVisionService,
  VerificationResult,
  AnalyzeRequest,
  DetectionResult,
  DetectionObject,
  PipelineStatus,
  PipelineStage,
  VisionProvider,
  VerificationType,
} from "./types";

export { GeminiVisionAdapter } from "./geminiAdapter";
export { MockVisionAdapter } from "./mockAdapter";
export { QwenVisionAdapter } from "./qwenAdapter";
export { FlorenceVisionAdapter } from "./florenceAdapter";
export { ResponseParser } from "./responseParser";
export { getPromptForClaim } from "./promptTemplates";
export { withRetry, isRetryableError } from "./retryHandler";
export type { RetryConfig } from "./retryHandler";
export { verificationEngine } from "../verification/engine";
export {
  VERIFICATION_TYPES,
  VERIFICATION_LABELS,
  VERIFICATION_ICONS,
  VERIFICATION_METRICS,
  VERIFICATION_INSTRUCTIONS,
  isValidVerificationType,
  getClaimTypeLabel,
} from "../verification/types";
export type { VerificationMetrics, GenericVerificationResult } from "../verification/types";

import type { VisionService, VisionProvider } from "./types";
import { GeminiVisionAdapter } from "./geminiAdapter";
import { MockVisionAdapter } from "./mockAdapter";

// ── Factory ──

/**
 * Creates the default VisionService implementation.
 */
export function createVisionService(
  supabaseUrl?: string,
  preferredProvider?: VisionProvider,
): VisionService {
  switch (preferredProvider) {
    case "mock":
      return new MockVisionAdapter();
    case "gemini":
      if (supabaseUrl) return new GeminiVisionAdapter(supabaseUrl);
      console.warn("Gemini requested but no Supabase URL provided. Falling back to mock.");
      return new MockVisionAdapter();
    default:
      if (supabaseUrl) return new GeminiVisionAdapter(supabaseUrl);
      return new MockVisionAdapter();
  }
}
