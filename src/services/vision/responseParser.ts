import type { VerificationResult } from "./types";

/**
 * Response parser for Vision AI outputs.
 *
 * Handles multiple formats:
 * - Clean JSON
 * - JSON in markdown code fences
 * - JSON embedded in explanatory text
 */
export class ResponseParser {
  /**
   * Parse raw AI response text into a structured VerificationResult.
   */
  static parse(rawText: string): VerificationResult {
    const extracted = ResponseParser.extractJson(rawText);

    try {
      const parsed = JSON.parse(extracted);

      const tree_count =
        typeof parsed.tree_count === "number" && Number.isFinite(parsed.tree_count)
          ? Math.max(0, Math.round(parsed.tree_count))
          : 0;

      const confidence_score =
        typeof parsed.confidence_score === "number" && Number.isFinite(parsed.confidence_score)
          ? Math.min(100, Math.max(0, Math.round(parsed.confidence_score)))
          : 0;

      const explanation =
        typeof parsed.explanation === "string" && parsed.explanation.trim().length > 0
          ? parsed.explanation.trim()
          : "No explanation provided.";

      return { tree_count, confidence_score, explanation, raw_response: rawText };
    } catch {
      // Fallback: try to extract numbers from text
      return this.fallbackParse(rawText);
    }
  }

  /**
   * Extract JSON from text that may be wrapped in markdown or have extra content.
   */
  static extractJson(text: string): string {
    // Remove markdown code fences
    let cleaned = text
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    // Find the first JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    return match ? match[0] : cleaned;
  }

  /**
   * Fallback parser when JSON parsing fails.
   * Attempts to extract tree_count and confidence_score from arbitrary text.
   */
  private static fallbackParse(rawText: string): VerificationResult {
    let tree_count = 0;
    let confidence_score = 0;

    // Try to find "tree_count": N or "tree count: N"
    const treeMatch =
      rawText.match(/"tree_count"\s*:\s*(\d+)/i) ||
      rawText.match(/tree[_ ]count\s*[:=]\s*(\d+)/i) ||
      rawText.match(/(\d+)\s*trees/i);

    if (treeMatch) {
      tree_count = Math.max(0, parseInt(treeMatch[1], 10));
    }

    // Try to find "confidence_score": N or "confidence: N%"
    const confMatch =
      rawText.match(/"confidence_score"\s*:\s*(\d+)/i) ||
      rawText.match(/confidence\s*[:=]\s*(\d+)/i) ||
      rawText.match(/(\d+)\s*%\s*confiden/i);

    if (confMatch) {
      confidence_score = Math.min(100, Math.max(0, parseInt(confMatch[1], 10)));
    }

    return {
      tree_count,
      confidence_score,
      explanation: rawText.slice(0, 500),
      raw_response: rawText,
    };
  }
}