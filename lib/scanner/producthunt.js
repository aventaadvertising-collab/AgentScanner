// ============================================================
// PRODUCT HUNT SCANNER
// Polls Product Hunt's unofficial API for AI product launches
// Uses the public website JSON endpoint (no API key needed)
// ============================================================

import { classifyAI, AI_THRESHOLD } from "./keywords";
import { categorize } from "./categorizer";
import { fetchWithRetry, createDeadline } from "./utils";

const PH_URL = "https://www.producthunt.com/frontend/graphql";

const QUERY = `
  query {
    posts(order: NEWEST, first: 20) {
      edges {
        node {
          id
          name
          tagline
          description
          url
          votesCount
          website
          createdAt
          topics {
            edges {
              node {
                name
              }
            }
          }
          makers {
            name
            username
          }
        }
      }
    }
  }
`;

export async function scanProductHunt(lastScanAt) {
  const timer = createDeadline(8000);
  const cutoff = lastScanAt ? new Date(lastScanAt) : new Date(0);

  let posts = [];
  try {
    const res = await fetchWithRetry(PH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AgentScreener-Scanner/1.0",
      },
      body: JSON.stringify({ query: QUERY }),
      timeout: 6000,
    });

    if (!res.ok) {
      // Fallback: try the simpler newest endpoint
      console.log(`[Scanner:PH] GraphQL ${res.status}, trying fallback`);
      return await scanPHFallback(lastScanAt, timer);
    }

    const data = await res.json();
    posts = (data?.data?.posts?.edges || []).map((e) => e.node);
  } catch (err) {
    console.log(`[Scanner:PH] Fetch error: ${err.message}, trying fallback`);
    return await scanPHFallback(lastScanAt, timer);
  }

  const discoveries = [];

  for (const post of posts) {
    if (!timer.hasTime()) break;
    if (!post.name) continue;

    // Filter by date
    if (post.createdAt && new Date(post.createdAt) < cutoff) continue;

    // Extract topics
    const topics = (post.topics?.edges || []).map((e) => e.node?.name).filter(Boolean);
    const topicStr = topics.join(" ");

    // Classify
    const text = `${post.name} ${post.tagline || ""} ${post.description || ""} ${topicStr}`;
    const { score, matchedKeywords } = classifyAI(text, post.name);

    // PH AI topic boost — if tagged as AI, lower threshold
    const isAITagged = topics.some((t) =>
      /artificial intelligence|machine learning|ai|developer tools/i.test(t)
    );
    const threshold = isAITagged ? 0.15 : AI_THRESHOLD;
    if (score < threshold) continue;

    const category = categorize(post.name, post.tagline || post.description, topics);
    const maker = post.makers?.[0];

    discoveries.push({
      external_id: `ph:${post.id}`,
      source: "producthunt",
      name: post.name,
      description: (post.tagline || post.description || "").slice(0, 500),
      url: post.website || post.url,
      category,
      ai_keywords: matchedKeywords,
      ai_confidence: Math.min(isAITagged ? score + 0.15 : score, 1),
      stars: 0,
      forks: 0,
      downloads: 0,
      upvotes: post.votesCount || 0,
      language: null,
      author: maker?.name || maker?.username || null,
      author_url: maker?.username
        ? `https://www.producthunt.com/@${maker.username}`
        : null,
      topics,
      license: null,
      source_created_at: post.createdAt || null,
    });
  }

  const newLastScanAt = new Date().toISOString();
  console.log(
    `[Scanner:PH] ${posts.length} posts → ${discoveries.length} AI products`
  );

  return { discoveries, newLastScanAt };
}

// Fallback: scrape the newest page as JSON
async function scanPHFallback(lastScanAt, timer) {
  try {
    if (!timer.hasTime()) return { discoveries: [], newLastScanAt: lastScanAt };

    const res = await fetchWithRetry(
      "https://www.producthunt.com/topics/artificial-intelligence",
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "AgentScreener-Scanner/1.0",
        },
        timeout: 6000,
      }
    );

    if (!res.ok) {
      console.log(`[Scanner:PH] Fallback also failed ${res.status}`);
      return { discoveries: [], newLastScanAt: lastScanAt || new Date().toISOString() };
    }

    // If we get HTML instead of JSON, just return empty
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("json")) {
      return { discoveries: [], newLastScanAt: new Date().toISOString() };
    }

    const data = await res.json();
    // Process if structured data available
    console.log(`[Scanner:PH] Fallback returned data`);
    return { discoveries: [], newLastScanAt: new Date().toISOString() };
  } catch {
    return { discoveries: [], newLastScanAt: lastScanAt || new Date().toISOString() };
  }
}
