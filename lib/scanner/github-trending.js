// ============================================================
// GITHUB TRENDING SCANNER
// Scrapes GitHub Trending page for AI/ML repos
// No API key needed — uses public trending page
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

const TRENDING_URL = "https://github.com/trending";

// Regex-based extraction from trending page HTML
function parseTrendingHTML(html) {
  const repos = [];
  // Each repo is in an <article> block
  const articles = html.match(/<article class="Box-row"[\s\S]*?<\/article>/g);
  if (!articles) return repos;

  for (const article of articles) {
    // Repo full name (owner/name)
    const nameMatch = article.match(/href="\/([^"]+?)"\s/);
    const fullName = nameMatch?.[1]?.trim();
    if (!fullName) continue;

    const [owner, name] = fullName.split("/");

    // Description
    const descMatch = article.match(/<p class="col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    const description = descMatch?.[1]?.trim().replace(/<[^>]*>/g, "").replace(/\s+/g, " ") || "";

    // Language
    const langMatch = article.match(/itemprop="programmingLanguage">([^<]+)/);
    const language = langMatch?.[1]?.trim() || null;

    // Stars total
    const starsMatch = article.match(/href="\/[^"]*\/stargazers"[^>]*>\s*([\d,]+)/);
    const stars = starsMatch ? parseInt(starsMatch[1].replace(/,/g, "")) : 0;

    // Stars today
    const todayMatch = article.match(/([\d,]+)\s+stars\s+today/i);
    const starsToday = todayMatch ? parseInt(todayMatch[1].replace(/,/g, "")) : 0;

    repos.push({
      fullName,
      owner,
      name,
      description,
      language,
      stars,
      starsToday,
      url: `https://github.com/${fullName}`,
    });
  }
  return repos;
}

export async function scanGitHubTrending(lastScanAt) {
  const timer = createDeadline(8000);
  const discoveries = [];
  const seen = new Set();

  // Fetch trending for multiple languages/topics
  const pages = [
    TRENDING_URL + "?since=daily",
    TRENDING_URL + "/python?since=daily",
    TRENDING_URL + "/typescript?since=daily",
    TRENDING_URL + "/jupyter-notebook?since=daily",
  ];

  const fetchPromises = pages.map(async (url) => {
    if (!timer.hasTime()) return [];
    try {
      const res = await fetchWithRetry(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AgentScreener/1.0)",
          Accept: "text/html",
        },
        timeout: 6000,
      });
      if (!res.ok) return [];
      const html = await res.text();
      return parseTrendingHTML(html);
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(fetchPromises);
  const allRepos = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  for (const repo of allRepos) {
    if (!timer.hasTime()) break;
    if (seen.has(repo.fullName)) continue;
    seen.add(repo.fullName);

    // Classify
    const text = `${repo.name} ${repo.description} ${repo.language || ""}`;
    const { score, matchedKeywords } = classifyAI(text, repo.name);
    if (score < AI_THRESHOLD) continue;

    // Boost for high star velocity
    const velocityBoost = repo.starsToday > 100 ? 0.15 : repo.starsToday > 50 ? 0.1 : 0;
    const confidence = Math.min(score + velocityBoost, 1);

    const category = categorize(repo.name, repo.description, []);

    discoveries.push({
      external_id: `gh-trending:${repo.fullName}`,
      source: "github-trending",
      name: repo.name,
      description: repo.description.slice(0, 500),
      url: repo.url,
      category,
      ai_keywords: matchedKeywords,
      ai_confidence: confidence,
      stars: repo.stars,
      forks: 0,
      downloads: 0,
      upvotes: repo.starsToday,
      language: repo.language,
      author: repo.owner,
      author_url: `https://github.com/${repo.owner}`,
      topics: ["trending", ...(repo.starsToday > 100 ? ["hot"] : [])],
      license: null,
      source_created_at: new Date().toISOString(),
    });
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:GH-Trending] ${allRepos.length} trending repos → ${discoveries.length} AI projects`
  );

  return { discoveries, newLastScanAt };
}
