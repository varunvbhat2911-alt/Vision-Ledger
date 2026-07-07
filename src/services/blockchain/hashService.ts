/**
 * Cryptographic hash service for VisionLedger.
 *
 * Uses the Web Crypto API (SubtleCrypto) for SHA-256 hashing.
 * No external dependencies required — runs natively in the browser.
 */

export class HashService {
  /**
   * Generate a SHA-256 hash of a string.
   */
  static async sha256(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return this.bufferToHex(hashBuffer);
  }

  /**
   * Generate a SHA-256 hash of a JSON-serializable object.
   * Object keys are sorted for deterministic output.
   */
  static async hashObject(obj: Record<string, unknown>): Promise<string> {
    const sorted = this.sortKeys(obj);
    const json = JSON.stringify(sorted);
    return this.sha256(json);
  }

  /**
   * Generate an evidence hash from an image URL + claim metadata.
   * This creates a unique fingerprint of the submitted evidence.
   */
  static async generateEvidenceHash(
    imageUrl: string,
    claimType: string,
    description: string,
  ): Promise<string> {
    const payload = JSON.stringify({
      imageUrl,
      claimType,
      description,
      timestamp: new Date().toISOString(),
    });
    return this.sha256(payload);
  }

  /**
   * Generate a verification hash combining evidence + AI results.
   * This creates a cryptographically-secure link between the
   * original evidence and the AI verification outcome.
   */
  static async generateVerificationHash(
    evidenceHash: string,
    treeCount: number,
    confidenceScore: number,
    explanation: string,
  ): Promise<string> {
    const payload = JSON.stringify({
      evidenceHash,
      treeCount,
      confidenceScore,
      explanation,
      timestamp: new Date().toISOString(),
    });
    return this.sha256(payload);
  }

  /**
   * Verify that a hash matches its expected value.
   */
  static async verifyHash(input: string, expectedHash: string): Promise<boolean> {
    const computed = await this.sha256(input);
    return computed === expectedHash;
  }

  // ── Private ──

  private static bufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Recursively sort object keys for deterministic JSON serialization.
   */
  private static sortKeys(obj: Record<string, unknown>): Record<string, unknown> {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      const value = obj[key];
      sorted[key] =
        value && typeof value === "object" && !Array.isArray(value)
          ? this.sortKeys(value as Record<string, unknown>)
          : value;
    }
    return sorted;
  }
}
