import type { VisionService, VerificationResult } from "./types";

/**
 * Adapter for Microsoft Florence-2 vision model.
 *
 * Florence-2 is a lightweight, open-source vision foundation model.
 * This adapter targets a self-hosted or HuggingFace-hosted endpoint.
 *
 * To activate: set REACT_APP_FLORENCE_API_URL and optionally
 * REACT_APP_FLORENCE_API_KEY, then wire into the factory.
 *
 * @status STUB — requires endpoint URL to activate.
 */
export class FlorenceVisionAdapter implements VisionService {
  readonly provider = "florence" as const;

  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = apiUrl || "";
    this.apiKey = apiKey || "";
  }

  async analyze(imageBase64: string, claimType: string): Promise<VerificationResult> {
    if (!this.apiUrl) {
      throw new Error(
        "Florence-2 adapter is not configured. Set REACT_APP_FLORENCE_API_URL to activate."
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    // Florence-2 uses object detection + captioning
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        inputs: imageBase64,
        parameters: {
          task: "<OD>", // Object Detection task for Florence-2
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Florence-2 API returned status ${response.status}.`);
    }

    const data = await response.json();

    // Florence-2 returns bounding boxes with labels
    const objects: Array<{ label: string; score?: number }> = Array.isArray(data)
      ? data
      : data.objects ?? data.detections ?? [];

    const treeObjects = objects.filter(
      (obj) =>
        obj.label?.toLowerCase().includes("tree") ||
        obj.label?.toLowerCase().includes("plant")
    );

    const treeCount = treeObjects.length;
    const avgScore =
      treeCount > 0
        ? treeObjects.reduce((sum, o) => sum + (o.score ?? 0.8), 0) / treeCount
        : 0.5;
    const confidence = Math.round(avgScore * 100);

    return {
      tree_count: treeCount,
      confidence_score: Math.min(100, Math.max(0, confidence)),
      explanation:
        treeCount > 0
          ? `Florence-2 detected ${treeCount} tree/plant objects with ${confidence}% average confidence.`
          : "Florence-2 did not detect any trees or plants in this image.",
      raw_response: JSON.stringify(data),
    };
  }
}