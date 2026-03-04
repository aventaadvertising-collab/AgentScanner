// ============================================================
// UPTIME PIPELINE
// Pings each product's website, measures latency and status
// Stores history for uptime % calculation
// ============================================================

export async function checkUptime(url) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "AgentScreener-Monitor/1.0" },
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - start;
    return {
      url,
      status: res.status,
      ok: res.ok,
      latency_ms: latencyMs,
      redirected: res.redirected,
      final_url: res.url,
      checked_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      url,
      status: 0,
      ok: false,
      latency_ms: Date.now() - start,
      error: err.name === "AbortError" ? "timeout" : err.message,
      checked_at: new Date().toISOString(),
    };
  }
}

export async function batchCheckUptime(urls) {
  const results = await Promise.allSettled(
    urls.map(url => checkUptime(url))
  );
  return results.map(r => r.status === "fulfilled" ? r.value : { ok: false, error: "failed" });
}

// Calculate uptime percentage from check history
export function calcUptimePercent(checks, windowDays = 30) {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const recent = checks.filter(c => new Date(c.checked_at).getTime() > cutoff);
  if (recent.length === 0) return null;
  const upCount = recent.filter(c => c.ok).length;
  return Math.round((upCount / recent.length) * 10000) / 100; // 2 decimal places
}

// Calculate P50 latency from check history
export function calcP50Latency(checks, windowDays = 30) {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const latencies = checks
    .filter(c => new Date(c.checked_at).getTime() > cutoff && c.ok)
    .map(c => c.latency_ms)
    .sort((a, b) => a - b);
  if (latencies.length === 0) return null;
  return latencies[Math.floor(latencies.length / 2)];
}
