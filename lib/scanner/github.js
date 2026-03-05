// ============================================================
// GITHUB SCANNER v3 — SEARCH API + EVENTS API
// Uses GitHub Search API for targeted AI repo discovery (high volume)
// Plus Events API to catch brand-new repos the moment they're created
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

// ── Search queries for AI products/tools/agents ──
function getSearchQueries() {
  const yesterday = new Date(Date.now() - 48 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return [
    // New AI repos created recently
    `ai agent created:>${yesterday} stars:>0`,
    `llm created:>${yesterday} stars:>0`,
    `machine learning tool created:>${yesterday} stars:>0`,
    `chatbot framework created:>${yesterday} stars:>0`,
    `ai automation created:>${yesterday} stars:>0`,
    // Active AI repos with recent pushes
    `langchain OR llamaindex OR crewai pushed:>${yesterday} stars:>5`,
    `vector database embedding pushed:>${yesterday} stars:>5`,
    `text-to-image OR stable-diffusion pushed:>${yesterday} stars:>3`,
    `autonomous agent OR multi-agent pushed:>${yesterday} stars:>3`,
    `ai sdk OR ai api OR ai platform pushed:>${yesterday} stars:>3`,
    // Specific trending AI topics
    `openai OR anthropic OR gemini tool pushed:>${yesterday} stars:>5`,
    `rag retrieval augmented pushed:>${yesterday} stars:>3`,
  ];
}

const EVENTS_URL = "https://api.github.com/events?per_page=100";
const SEARCH_URL = "https://api.github.com/search/repositories";

export async function scanGitHub(ghToken, lastEventId) {
  const timer = createDeadline(25000); // 25s budget (maxDuration=55)
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "AgentScreener-Scanner/1.0",
  };
  if (ghToken) headers.Authorization = `Bearer ${ghToken}`;

  const seen = new Set();
  const allDiscoveries = [];

  // ── PHASE 1: Search API (high volume, targeted) ──
  const queries = getSearchQueries();

  // Run queries in batches of 4 to avoid rate limits
  for (let i = 0; i < queries.length; i += 4) {
    if (!timer.hasTime()) break;

    const batch = queries.slice(i, i + 4);
    const searchPromises = batch.map(async (q) => {
      if (!timer.hasTime()) return [];
      try {
        const url = `${SEARCH_URL}?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=30`;
        const res = await fetchWithRetry(url, { headers, timeout: 8000 });
        if (!res.ok) {
          if (res.status === 403 || res.status === 429) {
            console.log(`[Scanner:GitHub] Search rate limited (${res.status})`);
          }
          return [];
        }
        const data = await res.json();
        return data.items || [];
      } catch {
        return [];
      }
    });

    const results = await Promise.allSettled(searchPromises);
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      for (const repo of r.value) {
        if (seen.has(repo.full_name)) continue;
        seen.add(repo.full_name);

        const text = [
          repo.name || "",
          repo.description || "",
          ...(repo.topics || []),
        ].join(" ");
        const { score, matchedKeywords } = classifyAI(text, repo.name);
        if (score < AI_THRESHOLD) continue;

        const category = categorize(repo.name, repo.description, repo.topics);

        allDiscoveries.push({
          external_id: `github:${repo.full_name}`,
          source: "github",
          name: repo.name,
          description: (repo.description || "").slice(0, 500),
          url: repo.html_url,
          category,
          ai_keywords: matchedKeywords,
          ai_confidence: score,
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          downloads: 0,
          upvotes: 0,
          language: repo.language,
          author: repo.owner?.login,
          author_url: repo.owner?.html_url,
          topics: repo.topics || [],
          license: repo.license?.spdx_id || null,
          source_created_at: repo.created_at,
        });
      }
    }

    // Small delay between search batches to respect rate limits
    if (i + 4 < queries.length && timer.hasTime()) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // ── PHASE 2: Events API (catch brand-new repos immediately) ──
  let newLastEventId = lastEventId;

  if (timer.hasTime()) {
    try {
      const res = await fetchWithRetry(EVENTS_URL, { headers, timeout: 5000 });
      if (res.ok) {
        const events = await res.json();
        const createEvents = events.filter(
          (e) =>
            e.type === "CreateEvent" && e.payload?.ref_type === "repository"
        );

        for (const event of createEvents) {
          if (event.id === lastEventId) break;
          if (!newLastEventId || event.id > newLastEventId)
            newLastEventId = event.id;

          const repoName = event.repo?.name;
          if (!repoName || seen.has(repoName)) continue;
          seen.add(repoName);

          // Quick name pre-filter
          const { score: nameScore } = classifyAI(
            repoName.toLowerCase(),
            repoName.split("/").pop()
          );
          if (nameScore < 0.1) continue;

          // Fetch full details
          if (!timer.hasTime()) break;
          try {
            const repoRes = await fetchWithRetry(
              `https://api.github.com/repos/${repoName}`,
              { headers, timeout: 5000 }
            );
            if (!repoRes.ok) continue;
            const repo = await repoRes.json();

            const text = [
              repo.name || "",
              repo.description || "",
              ...(repo.topics || []),
            ].join(" ");
            const { score, matchedKeywords } = classifyAI(text, repo.name);
            if (score < AI_THRESHOLD) continue;

            const category = categorize(
              repo.name,
              repo.description,
              repo.topics
            );

            allDiscoveries.push({
              external_id: `github:${repoName}`,
              source: "github",
              name: repo.name,
              description: (repo.description || "").slice(0, 500),
              url: repo.html_url,
              category,
              ai_keywords: matchedKeywords,
              ai_confidence: score,
              stars: repo.stargazers_count || 0,
              forks: repo.forks_count || 0,
              downloads: 0,
              upvotes: 0,
              language: repo.language,
              author: repo.owner?.login,
              author_url: repo.owner?.html_url,
              topics: repo.topics || [],
              license: repo.license?.spdx_id || null,
              source_created_at: repo.created_at,
            });
          } catch {
            continue;
          }
        }
      }
    } catch (err) {
      console.log(`[Scanner:GitHub] Events fetch error: ${err.message}`);
    }
  }

  console.log(
    `[Scanner:GitHub] Search+Events → ${allDiscoveries.length} AI repos (${seen.size} total checked)`
  );

  return { discoveries: allDiscoveries, newLastEventId: newLastEventId };
}
