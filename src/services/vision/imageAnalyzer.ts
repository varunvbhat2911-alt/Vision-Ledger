import type { VisionService, VerificationResult, PipelineStatus, PipelineStage } from "./types";
import { ResponseParser } from "./responseParser";
import { getPromptForClaim } from "./promptTemplates";

/**
 * ImageAnalyzer orchestrates the full image analysis pipeline:
 *   validate → preprocess → analyze → parse → complete
 *
 * Uses dependency injection so the underlying VisionService
 * can be swapped (Gemini, Qwen, Florence, Mock) without
 * modifying this class.
 */
export class ImageAnalyzer {
  private readonly visionService: VisionService;
  private currentPipeline: PipelineStatus | null = null;

  constructor(visionService: VisionService) {
    this.visionService = visionService;
  }

  /**
   * Run the full analysis pipeline on an image.
   */
  async analyze(imageBase64: string, claimType: string): Promise<{
    result: VerificationResult;
    pipeline: PipelineStatus;
  }> {
    const startedAt = performance.now();

    // Stage 1: Validate
    this.updateStage("validating");
    this.validateInput(imageBase64, claimType);

    // Stage 2: Preprocess
    this.updateStage("preprocessing");
    const processed = this.preprocessImage(imageBase64);
    const prompt = getPromptForClaim(claimType);

    // Stage 3: Analyze
    this.updateStage("analyzing");
    const result = await this.visionService.analyze(processed, claimType);

    // Stage 4: Parse (already done by the adapter, but validate shape)
    this.updateStage("parsing");
    const validated = this.validateResult(result);

    // Stage 5: Complete
    this.updateStage("complete");
    const completedAt = performance.now();

    return {
      result: validated,
      pipeline: {
        stage: "complete",
        startedAt,
        completedAt,
      },
    };
  }

  /**
   * Get current pipeline status (for progress UI).
   */
  getPipelineStatus(): PipelineStatus | null {
    return this.currentPipeline;
  }

  // ── Private ──

  private updateStage(stage: PipelineStage, error?: string): void {
    this.currentPipeline = {
      stage,
      startedAt: this.currentPipeline?.startedAt ?? performance.now(),
      error,
    };
  }

  private validateInput(imageBase64: string, claimType: string): void {
    if (!imageBase64 || typeof imageBase64 !== "string") {
      throw new Error("Invalid input: image is required.");
    }
    if (imageBase64.length < 100) {
      throw new Error("Invalid input: image data appears too small.");
    }
    if (!claimType || typeof claimType !== "string") {
      throw new Error("Invalid input: claim type is required.");
    }
  }

  private preprocessImage(imageBase64: string): string {
    // Normalize: ensure it has a data URI prefix for adapters that need it
    if (imageBase64.startsWith("data:")) {
      return imageBase64;
    }
    // Assume JPEG if no prefix
    return `data:image/jpeg;base64,${imageBase64}`;
  }

  private validateResult(result: VerificationResult): VerificationResult {
    return {
      tree_count: Math.max(0, Math.round(result.tree_count ?? 0)),
      confidence_score: Math.min(100, Math.max(0, Math.round(result.confidence_score ?? 0))),
      explanation: result.explanation || "No explanation provided.",
      raw_response: result.raw_response || "",
    };
  }
}