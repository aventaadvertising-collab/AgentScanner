// ============================================================
// JOBS PIPELINE
// Scrapes career pages to count open positions
// Open roles = proxy for team growth velocity
// Role types indicate company focus areas
// ============================================================

// Common job board patterns to detect open positions
const JOB_BOARD_PATTERNS = {
  lever: /lever\.co/,
  greenhouse: /boards\.greenhouse\.io/,
  ashby: /jobs\.ashbyhq\.com/,
  workable: /apply\.workable\.com/,
};

export async function scrapeJobCount(careersUrl) {
  if (!careersUrl) return null;

  try {
    const res = await fetch(careersUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AgentScreener/1.0)",
        Accept: "text/html",
      },
      redirect: "follow",
    });

    if (!res.ok) return { url: careersUrl, error: `HTTP ${res.status}`, jobs: null };

    const html = await res.text();

    // Count job listings based on common patterns
    let jobCount = 0;
    let categories = {};

    // Lever-style: count <div class="posting"> elements
    const leverMatches = html.match(/class="posting"/g);
    if (leverMatches) jobCount = leverMatches.length;

    // Greenhouse-style: count job openings
    const ghMatches = html.match(/class="opening"/g);
    if (ghMatches) jobCount = Math.max(jobCount, ghMatches.length);

    // Generic: count common job listing markers
    const genericPatterns = [
      /class="job[-_]?listing"/gi,
      /class="job[-_]?card"/gi,
      /class="position[-_]?card"/gi,
      /class="career[-_]?item"/gi,
      /class="role[-_]?card"/gi,
      /data-job-id/gi,
    ];

    for (const pattern of genericPatterns) {
      const matches = html.match(pattern);
      if (matches) jobCount = Math.max(jobCount, matches.length);
    }

    // If no structured matches, try counting by common heading patterns
    if (jobCount === 0) {
      // Count links that look like job titles
      const linkMatches = html.match(/<a[^>]*href="[^"]*(?:job|position|role|career|apply)[^"]*"[^>]*>/gi);
      if (linkMatches) jobCount = linkMatches.length;
    }

    // Categorize by department (rough)
    const engineeringKeywords = /engineer|developer|sre|devops|backend|frontend|fullstack|infrastructure/gi;
    const productKeywords = /product\s*manager|designer|ux|ui|research/gi;
    const salesKeywords = /sales|business\s*dev|account|customer|growth|marketing/gi;

    const engMatches = html.match(engineeringKeywords);
    const prodMatches = html.match(productKeywords);
    const salesMatches = html.match(salesKeywords);

    categories = {
      engineering: engMatches ? Math.round(engMatches.length / 2) : 0, // rough dedup
      product: prodMatches ? Math.round(prodMatches.length / 2) : 0,
      sales: salesMatches ? Math.round(salesMatches.length / 2) : 0,
    };

    return {
      url: careersUrl,
      total_openings: jobCount,
      categories,
      fetched_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      url: careersUrl,
      error: err.message,
      total_openings: null,
      fetched_at: new Date().toISOString(),
    };
  }
}

// Batch scrape all career pages
export async function batchScrapeJobs(products) {
  const results = {};
  // Sequential to be respectful of rate limits
  for (const product of products) {
    if (product.careers) {
      results[product.id] = await scrapeJobCount(product.careers);
      // Small delay between requests
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return results;
}
