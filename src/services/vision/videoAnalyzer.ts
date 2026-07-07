import type { VisionService, VerificationResult, PipelineStatus } from "./types";

/**
 * VideoAnalyzer handles video-based verification.
 *
 * Strategy:
 * 1. Extract frames from the video at regular intervals
 * 2. Analyze each frame through the VisionService
 * 3. Aggregate results (median tree count, average confidence)
 */
export class VideoAnalyzer {
  private readonly visionService: VisionService;
  private readonly frameIntervalMs: number;

  constructor(visionService: VisionService, frameIntervalMs: number = 3000) {
    this.visionService = visionService;
    this.frameIntervalMs = frameIntervalMs;
  }

  /**
   * Analyze a video by extracting and processing frames.
   *
   * @param videoBase64 - Base64-encoded video data (or data URI).
   * @param claimType - The type of claim being verified.
   * @returns Aggregated verification result from all frames.
   */
  async analyze(videoBase64: string, claimType: string): Promise<{
    result: VerificationResult;
    pipeline: PipelineStatus;
    frameResults: VerificationResult[];
  }> {
    const startedAt = performance.now();

    // Extract frames as base64 images
    const frames = await this.extractFrames(videoBase64);

    if (frames.length === 0) {
      throw new Error("Could not extract any frames from the video.");
    }

    // Analyze each frame
    const frameResults: VerificationResult[] = [];
    for (const frame of frames) {
      try {
        const result = await this.visionService.analyze(frame, claimType);
        frameResults.push(result);
      } catch {
        // Skip failed frames
        continue;
      }
    }

    if (frameResults.length === 0) {
      throw new Error("All frames failed analysis.");
    }

    // Aggregate results
    const treeCounts = frameResults.map((r) => r.tree_count).sort((a, b) => a - b);
    const confidences = frameResults.map((r) => r.confidence_score);
    const medianTreeCount = treeCounts[Math.floor(treeCounts.length / 2)];
    const avgConfidence = Math.round(
      confidences.reduce((sum, c) => sum + c, 0) / confidences.length,
    );

    const completedAt = performance.now();

    return {
      result: {
        tree_count: medianTreeCount,
        confidence_score: avgConfidence,
        explanation: `Video analysis across ${frameResults.length} frames. Median tree count: ${medianTreeCount}. Average confidence: ${avgConfidence}%.`,
        raw_response: JSON.stringify(frameResults),
      },
      pipeline: {
        stage: "complete",
        startedAt,
        completedAt,
      },
      frameResults,
    };
  }

  /**
   * Extract frames from a base64 video.
   *
   * Uses the browser's video element + canvas to capture frames
   * at regular intervals.
   */
  private async extractFrames(videoBase64: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas 2D context not available."));
        return;
      }

      video.preload = "metadata";
      video.muted = true;

      const frames: string[] = [];

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 0;
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0);
        frames.push(canvas.toDataURL("image/jpeg", 0.85));

        const nextTime = video.currentTime + this.frameIntervalMs / 1000;
        if (nextTime < video.duration) {
          video.currentTime = nextTime;
        } else {
          resolve(frames);
        }
      };

      video.onerror = () => reject(new Error("Failed to load video."));

      video.src = videoBase64;
    });
  }
}