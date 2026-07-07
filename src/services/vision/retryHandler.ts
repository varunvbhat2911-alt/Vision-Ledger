/**
 * Generic retry handler with exponential backoff.
 *
 * Used by VisionService adapters to gracefully handle transient failures
 * (rate limits, network issues, server errors).
 */

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3). */
  maxRetries: number;
  /** Base delay in milliseconds before first retry (default: 1000). */
  baseDelayMs: number;
  /** Maximum total delay in milliseconds (default: 30000). */
  maxDelayMs: number;
  /** Whether to use exponential backoff (default: true). */
  exponential: boolean;
  /** Optional callback invoked before each retry with attempt number and delay. */
  onRetry?: (attempt: number, delayMs: number, error: Error) => void;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  exponential: true,
};

/**
 * Determine whether an error is retryable.
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true; // network error
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("429") || msg.includes("rate limit")) return true;
    if (msg.includes("500") || msg.includes("502") || msg.includes("503") || msg.includes("504"))
      return true;
    if (msg.includes("timeout") || msg.includes("network")) return true;
    if (msg.includes("temporarily")) return true;
  }
  return false;
}

/**
 * Execute an async operation with retry logic.
 *
 * @param operation - The async function to execute.
 * @param config - Retry configuration (partial, merged with defaults).
 * @returns The operation's result.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const cfg: RetryConfig = { ...DEFAULT_CONFIG, ...config };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt === cfg.maxRetries || !isRetryableError(lastError)) {
        throw lastError;
      }

      const delayMs = cfg.exponential
        ? Math.min(cfg.baseDelayMs * Math.pow(2, attempt), cfg.maxDelayMs)
        : cfg.baseDelayMs;

      cfg.onRetry?.(attempt + 1, delayMs, lastError);

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError ?? new Error("Retry exhausted with no error captured.");
}