import type { VerificationType, GenericVerificationResult, VerificationMetrics } from "./types";
import { isValidVerificationType } from "./types";
import { generateMockResult } from "./registry";

/**
 * Verification Engine — the central orchestrator for the
 * AI-powered Proof of Reality platform.
 *
 * Routes verification requests to the appropriate module
 * based on verification type. Currently uses mock data;
 * ready to integrate real Vision AI models per module.
 */
export class VerificationEngine {
  /**
   * Analyze an image for a given verification type.
   * Returns a structured result with type-specific metrics.
   */
  async analyze(
    _imageBase64: string,
    claimType: string,
  ): Promise<GenericVerificationResult> {
    const type = this.normalizeType(claimType);

    // Route to mock generator for now.
    // When real Vision AI is connected, this will dispatch to
    // type-specific adapters (e.g., Gemini for solar, Florence for crops).
    return generateMockResult(type);
  }

  /**
   * Validate that a claim type is supported.
   */
  validateType(claimType: string): VerificationType {
    return this.normalizeType(claimType);
  }

  /**
   * Generate a human-readable explanation for a verification result.
   */
  generateExplanation(type: VerificationType, metrics: VerificationMetrics): string {
    return metrics.explanation;
  }

  // ── Private ──

  private normalizeType(claimType: string): VerificationType {
    const normalized = claimType.toLowerCase().trim();
    if (isValidVerificationType(normalized)) {
      return normalized;
    }
    // Fallback to tree_plantation for backwards compatibility
    console.warn(`Unknown claim type "${claimType}", falling back to tree_plantation.`);
    return "tree_plantation";
  }
}

/** Singleton instance. */
export const verificationEngine = new VerificationEngine();