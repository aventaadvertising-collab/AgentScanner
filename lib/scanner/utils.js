// ============================================================
// SCANNER UTILITIES
// Shared helpers: fetchWithRetry, time budget, URL normalizer
// ============================================================

const DEFAULT_TIMEOUT = 5000; // 5s per request

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch with exponential backoff and rate-limit handling
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(options.timeout || DEFAULT_TIMEOUT),
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") || "5");
        if (attempt < maxRetries) {
          await sleep(retryAfter * 1000 + Math.random() * 1000);
          continue;
        }
      }

      if (res.status >= 500 && attempt < maxRetries) {
        await sleep(Math.pow(2, attempt) * 1000 + Math.random() * 500);
        continue;
      }

      return res;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await sleep(Math.pow(2, attempt) * 1000 + Math.random() * 500);
    }
  }
}

/**
 * Time-budget guard — returns true if there's still time left
 */
export function createDeadline(budgetMs = 8000) {
  const deadline = Date.now() + budgetMs;
  return {
    hasTime: () => Date.now() < deadline,
    remaining: () => Math.max(0, deadline - Date.now()),
  };
}

/**
 * Normalize URL for cross-source deduplication
 */
export function normalizeUrl(url) {
  if (!url) return null;
  try {
    return url
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\.git$/, "")
      .replace(/\/+$/, "")
      .replace(/\?.*$/, "")
      .replace(/#.*$/, "");
  } catch {
    return null;
  }
}
