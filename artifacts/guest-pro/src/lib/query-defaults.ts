function getHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("status" in error)) return undefined;
  const status = (error as { status: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

/** Limit retries when API is down or restarting — avoids console/proxy spam. */
export function defaultQueryRetry(failureCount: number, error: unknown): boolean {
  const status = getHttpStatus(error);
  if (status === 401 || status === 403 || status === 404) return false;
  if (status !== undefined && status >= 500) return failureCount < 1;
  return failureCount < 2;
}

export const defaultQueryRetryDelay = (attempt: number) =>
  Math.min(1_000 * 2 ** attempt, 15_000);
