import type { VisionService, VerificationResult } from "./types";

/**
 * Adapter for Qwen2-VL vision model.
 *
 * Qwen2-VL is Alibaba's multimodal model that supports image understanding.
 * This adapter is ready to use once API credentials are available.
 *
 * To activate: set REACT_APP_QWEN_API_KEY and REACT_APP_QWEN_API_URL
 * environment variables, then wire this adapter into the factory.
 *
 * @status STUB — requires API credentials to activate.
 */
export class QwenVisionAdapter implements VisionService {
  readonly provider = "qwen" as const;

  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = apiUrl || "";
    this.apiKey = apiKey || "";
  }

  async analyze(imageBase64: string, claimType: string): Promise<VerificationResult> {
    if (!this.apiKey || !this.apiUrl) {
      throw new Error(
        "Qwen2-VL adapter is not configured. Set REACT_APP_QWEN_API_KEY and REACT_APP_QWEN_API_URL to activate."
      );
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "qwen-vl-max",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
              {
                type: "text",
                text: `Analyze this image for ${claimType}. Count visible trees and return JSON with tree_count, confidence_score (0-100), and explanation.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Qwen2-VL API returned status ${response.status}.`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Qwen2-VL returned unparseable response.");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      tree_count: Math.max(0, Math.round(parsed.tree_count ?? 0)),
      confidence_score: Math.min(100, Math.max(0, Math.round(parsed.confidence_score ?? 0))),
      explanation: parsed.explanation ?? "No explanation provided.",
      raw_response: rawText,
    };
  }
}