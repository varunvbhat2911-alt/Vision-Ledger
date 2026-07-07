import type { VisionService, VerificationResult } from "./types";
import { authenticatedFetch, ApiError } from "../../lib/apiClient";

/**
 * Adapter that calls the Supabase Edge Function `verify-image`,
 * which proxies requests to the Google Gemini Vision API.
 *
 * Requires a valid user JWT — the edge function rejects unauthenticated calls.
 * The Gemini API key is stored server-side as a Supabase secret.
 */
export class GeminiVisionAdapter implements VisionService {
  readonly provider = "gemini" as const;
  private readonly endpoint: string;

  constructor(supabaseUrl: string) {
    this.endpoint = `${supabaseUrl}/functions/v1/verify-image`;
  }

  async analyze(imageBase64: string, claimType: string): Promise<VerificationResult> {
    let response: Response;

    try {
      response = await authenticatedFetch(this.endpoint, {
        method: "POST",
        body: JSON.stringify({ image: imageBase64, claimType }),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        throw new Error("Session expired. Please sign in again.");
      }
      if (err instanceof ApiError && err.status === 429) {
        throw new Error(err.message);
      }
      throw err;
    }

    if (!response.ok) {
      let errorMessage = `Vision API returned status ${response.status}.`;
      try {
        const errorBody = await response.json();
        if (errorBody?.error) {
          errorMessage = errorBody.error;
        }
      } catch {
        // use default message
      }
      throw new Error(errorMessage);
    }

    const result: VerificationResult = await response.json();

    if (
      typeof result.tree_count !== "number" ||
      typeof result.confidence_score !== "number" ||
      typeof result.explanation !== "string"
    ) {
      throw new Error("Vision API returned an unexpected response shape.");
    }

    return result;
  }
}
