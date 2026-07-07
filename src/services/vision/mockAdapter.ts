import type { VisionService, VerificationResult, DetectionResult, AdvancedVisionService } from "./types";
import { verificationEngine } from "../verification/engine";
import type { VerificationType, VerificationMetrics } from "../verification/types";
import { isValidVerificationType } from "../verification/types";

/**
 * Mock Vision Service adapter.
 *
 * Delegates to the VerificationEngine which generates type-specific
 * realistic mock responses. Supports all 8 verification types.
 */
export class MockVisionAdapter implements AdvancedVisionService {
  readonly provider = "mock" as const;

  /**
   * Analyze an image and return a type-aware mock verification result.
   * Simulates a 1-2 second processing delay for realism.
   */
  async analyze(imageBase64: string, claimType: string): Promise<VerificationResult> {
    const result = await verificationEngine.analyze(imageBase64, claimType);

    // Convert metrics values to string|number record for the VerificationResult type
    const metrics: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(result.metrics.values)) {
      metrics[key] = value;
    }

    return {
      tree_count: result.tree_count,
      confidence_score: result.confidence_score,
      explanation: result.explanation,
      raw_response: result.raw_response,
      verificationType: result.verificationType,
      metrics,
    };
  }

  /**
   * Mock object detection with type-aware bounding boxes.
   */
  async detectObjects(imageBase64: string): Promise<DetectionResult> {
    const delay = 800 + Math.random() * 600;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const objectCount = Math.floor(Math.random() * 80) + 15;
    const confidence = Math.floor(Math.random() * 25) + 70;
    const startTime = performance.now();

    const label = "object";
    const objects = Array.from({ length: objectCount }, () => ({
      label,
      confidence: Math.floor(Math.random() * 20) + 75,
      boundingBox: {
        x: Math.random() * 0.8,
        y: Math.random() * 0.8,
        width: 0.02 + Math.random() * 0.06,
        height: 0.04 + Math.random() * 0.12,
      },
    }));

    const processingTimeMs = Math.round(performance.now() - startTime);

    return {
      status: confidence >= 70 ? "verified" : "inconclusive",
      confidence,
      objectsDetected: objectCount,
      explanation: `Mock detection found ${objectCount} objects with ${confidence}% confidence.`,
      objects,
      processingTimeMs,
      modelUsed: "MockVisionAdapter v2.0",
      rawResponse: JSON.stringify({ objects, confidence }),
    };
  }

  /**
   * Mock video analysis — simulates frame extraction.
   */
  async analyzeVideo(videoBase64: string, claimType: string): Promise<VerificationResult> {
    const delay = 2500 + Math.random() * 1500;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return this.analyze(videoBase64, claimType);
  }
}