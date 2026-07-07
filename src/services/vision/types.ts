// ── Core Types ──
// Re-export verification types for convenience
import type { VerificationType } from "../verification/types";
export type { VerificationType };

/** Structured result returned by any VisionService implementation. */
export interface VerificationResult {
  tree_count: number;
  confidence_score: number;
  explanation: string;
  raw_response: string;
  /** The verification type that produced this result. */
  verificationType?: string;
  /** Type-specific metrics for dynamic result rendering. */
  metrics?: Record<string, string | number>;
}

/** Payload sent to the Edge Function. */
export interface AnalyzeRequest {
  image: string; // base64-encoded image (with or without data URI prefix)
  claimType: string;
}

// ── Extended Module 3 Types ──

/** Detailed detection result for a single object/tree. */
export interface DetectionObject {
  label: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/** Full detection result from image analysis. */
export interface DetectionResult {
  status: "verified" | "inconclusive" | "rejected";
  confidence: number;
  objectsDetected: number;
  explanation: string;
  objects: DetectionObject[];
  processingTimeMs: number;
  modelUsed: string;
  rawResponse: string;
}

/** Analysis mode for video vs image. */
export type AnalysisMode = "image" | "video";

/** Request pipeline stage. */
export type PipelineStage =
  | "validating"
  | "preprocessing"
  | "analyzing"
  | "parsing"
  | "complete";

/** Pipeline status for tracking request lifecycle. */
export interface PipelineStatus {
  stage: PipelineStage;
  startedAt: number;
  completedAt?: number;
  error?: string;
}

/** Provider identifier for multi-model support. */
export type VisionProvider = "gemini" | "qwen" | "florence" | "mock";

// ── Service Interface ──

/**
 * Abstraction over AI vision providers.
 * Implementations handle the transport and provider-specific logic.
 */
export interface VisionService {
  /** Human-readable provider name (e.g. "Gemini", "Qwen2-VL"). */
  readonly provider: VisionProvider;

  /**
   * Analyze an image for a given claim type.
   * @returns Structured verification result.
   */
  analyze(imageBase64: string, claimType: string): Promise<VerificationResult>;
}

/** Extended vision service with detection capabilities. */
export interface AdvancedVisionService extends VisionService {
  /** Detect individual objects in an image. */
  detectObjects(imageBase64: string): Promise<DetectionResult>;

  /** Analyze a video (extracts frames and processes each). */
  analyzeVideo(videoBase64: string, claimType: string): Promise<VerificationResult>;
}
