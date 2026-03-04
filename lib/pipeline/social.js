// ============================================================
// SOCIAL PIPELINE
// Fetches social metrics from X/Twitter
// Requires X API Bearer Token (free Basic tier: 10k tweets/mo read)
// Fallback: Scrape follower counts from public profiles
// ============================================================

const X_API = "https://api.twitter.com/2";

// Fetch user metrics via X API v2
export async function fetchXMetrics(username, bearerToken) {
  if (!bearerToken) {
    return {
      username,
      error: "No X API bearer token configured. Add X_BEARER_TOKEN to env vars.",
      fetched_at: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch(
      `${X_API}/users/by/username/${username}?user.fields=public_metrics,description,created_at,profile_image_url`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "User-Agent": "AgentScreener/1.0",
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return { username, error: `X API ${res.status}: ${err}`, fetched_at: new Date().toISOString() };
    }

    const { data } = await res.json();
    if (!data) return { username, error: "User not found", fetched_at: new Date().toISOString() };

    return {
      username: data.username,
      name: data.name,
      description: data.description,
      profile_image: data.profile_image_url,
      followers: data.public_metrics.followers_count,
      following: data.public_metrics.following_count,
      tweet_count: data.public_metrics.tweet_count,
      listed_count: data.public_metrics.listed_count,
      created_at: data.created_at,
      fetched_at: new Date().toISOString(),
    };
  } catch (err) {
    return { username, error: err.message, fetched_at: new Date().toISOString() };
  }
}

// Fetch recent tweets for engagement analysis
export async function fetchRecentTweets(username, bearerToken, maxResults = 10) {
  if (!bearerToken) return { username, tweets: [], error: "No bearer token" };

  try {
    // First get user ID
    const userRes = await fetch(`${X_API}/users/by/username/${username}`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    const userData = await userRes.json();
    if (!userData.data) return { username, tweets: [], error: "User not found" };

    const userId = userData.data.id;

    // Fetch recent tweets with metrics
    const tweetsRes = await fetch(
      `${X_API}/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=public_metrics,created_at`,
      { headers: { Authorization: `Bearer ${bearerToken}` } }
    );
    const tweetsData = await tweetsRes.json();

    if (!tweetsData.data) return { username, tweets: [], error: "No tweets found" };

    const tweets = tweetsData.data.map(t => ({
      id: t.id,
      text: t.text.slice(0, 100),
      likes: t.public_metrics.like_count,
      retweets: t.public_metrics.retweet_count,
      replies: t.public_metrics.reply_count,
      impressions: t.public_metrics.impression_count,
      created_at: t.created_at,
    }));

    // Calculate engagement metrics
    const totalLikes = tweets.reduce((s, t) => s + t.likes, 0);
    const totalRetweets = tweets.reduce((s, t) => s + t.retweets, 0);
    const totalReplies = tweets.reduce((s, t) => s + t.replies, 0);
    const avgEngagement = Math.round((totalLikes + totalRetweets + totalReplies) / tweets.length);

    return {
      username,
      tweets,
      avg_engagement: avgEngagement,
      total_likes: totalLikes,
      total_retweets: totalRetweets,
      fetched_at: new Date().toISOString(),
    };
  } catch (err) {
    return { username, tweets: [], error: err.message };
  }
}
