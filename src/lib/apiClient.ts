import { getAccessToken } from "./supabase";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly headers?: Headers,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Authenticated fetch wrapper for Supabase Edge Functions.
 * Attaches JWT, handles 401/403/429 consistently.
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getAccessToken();

  if (!token) {
    throw new ApiError("Not authenticated.", 401);
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    throw new ApiError(
      retryAfter
        ? `Rate limit exceeded. Retry after ${retryAfter}s.`
        : "Rate limit exceeded. Please try again later.",
      429,
      response.headers,
    );
  }

  return response;
}
