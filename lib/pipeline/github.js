// ============================================================
// GITHUB PIPELINE
// Fetches: stars, forks, contributors, commit velocity, open issues
// Rate limit: 5000 req/hr with token, 60/hr without
// ============================================================

const GITHUB_API = "https://api.github.com";

async function ghFetch(path, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "AgentScreener/1.0",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${GITHUB_API}${path}`, { headers, next: { revalidate: 0 } });
  if (!res.ok) {
    console.error(`GitHub API error: ${res.status} for ${path}`);
    return null;
  }
  return res.json();
}

// Separate stats fetcher with 202-retry logic
// GitHub Stats API returns 202 (computing) on first request for cold caches
async function ghFetchStats(path, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "AgentScreener/1.0",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res = await fetch(`${GITHUB_API}${path}`, { headers, next: { revalidate: 0 } });
  if (res.status === 202) {
    await new Promise(r => setTimeout(r, 2000));
    res = await fetch(`${GITHUB_API}${path}`, { headers, next: { revalidate: 0 } });
  }
  if (!res.ok) return null;
  return res.json();
}

// Fetch 52 weeks of daily commit activity for a repo
// Returns compact format: { weeks: [{ w, t, d }, ...] } or null
export async function fetchGitHubCommitActivity(owner, repo, token) {
  try {
    const raw = await ghFetchStats(`/repos/${owner}/${repo}/stats/commit_activity`, token);
    if (!raw || !Array.isArray(raw)) return null;
    return {
      weeks: raw.map(w => ({
        w: w.week,       // Unix timestamp (start of week)
        t: w.total,      // Total commits that week
        d: w.days,       // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
      })),
    };
  } catch (err) {
    console.error(`GitHub commit activity error for ${owner}/${repo}:`, err);
    return null;
  }
}

export async function fetchGitHubMetrics(owner, repo, token) {
  try {
    // Parallel fetch all endpoints
    const [repoData, contributors, commits, issues] = await Promise.all([
      ghFetch(`/repos/${owner}/${repo}`, token),
      ghFetch(`/repos/${owner}/${repo}/contributors?per_page=1&anon=true`, token),
      ghFetch(`/repos/${owner}/${repo}/commits?per_page=100`, token),
      ghFetch(`/repos/${owner}/${repo}/issues?state=open&per_page=1`, token),
    ]);

    if (!repoData) return null;

    // Calculate commit velocity (commits in last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCommits = commits
      ? commits.filter(c => new Date(c.commit?.author?.date) > weekAgo).length
      : 0;

    // Calculate star velocity (need activity endpoint)
    // Stars per week approximation from stargazers count over repo age
    const createdAt = new Date(repoData.created_at);
    const ageWeeks = Math.max(1, (Date.now() - createdAt) / (7 * 24 * 60 * 60 * 1000));
    const starVelocity = Math.round(repoData.stargazers_count / ageWeeks);

    return {
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      open_issues: repoData.open_issues_count,
      watchers: repoData.subscribers_count,
      language: repoData.language,
      size_kb: repoData.size,
      created_at: repoData.created_at,
      updated_at: repoData.updated_at,
      pushed_at: repoData.pushed_at,
      star_velocity_per_week: starVelocity,
      commit_velocity_7d: recentCommits,
      description: repoData.description,
      topics: repoData.topics || [],
      license: repoData.license?.spdx_id || null,
      fetched_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`GitHub fetch error for ${owner}/${repo}:`, err);
    return null;
  }
}
