"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { CommitHeatmapLoader } from "@/app/components/CommitHeatmap";
import { Sparkline, GrowthBadge, VelocityBadge } from "@/app/components/Sparkline";
import AlertBuilder from "@/app/components/AlertBuilder";
import CollectionPicker from "@/app/components/CollectionPicker";

// ─── Helpers ───
function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtN(n) {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

function sourceLabel(url) {
  if (!url) return null;
  if (url.includes("github.com")) return "Repository";
  if (url.includes("pypi.org")) return "Package";
  if (url.includes("npmjs.com") || url.includes("npmjs.org")) return "Package";
  if (url.includes("huggingface.co/spaces")) return "Space";
  if (url.includes("huggingface.co")) return "Model";
  if (url.includes("ycombinator.com") || url.includes("news.ycombinator")) return "Discussion";
  if (url.includes("reddit.com")) return "Thread";
  if (url.includes("producthunt.com")) return "Launch";
  if (url.includes("arxiv.org")) return "Paper";
  if (url.includes("dev.to")) return "Article";
  if (url.includes("lobste.rs")) return "Link";
  if (url.includes("play.google.com")) return "Android App";
  if (url.includes("apps.apple.com")) return "iOS App";
  if (url.includes("chromewebstore.google.com") || url.includes("chrome.google.com/webstore")) return "Extension";
  if (url.includes("x.com") || url.includes("twitter.com")) return "Tweet";
  return "Source";
}

function sourceType(item) {
  const src = item.source || "";
  const url = item.url || "";
  if (src.startsWith("github") || url.includes("github.com")) return "github";
  if (src === "huggingface" || url.includes("huggingface.co")) return "huggingface";
  if (src === "npm" || url.includes("npmjs.com")) return "npm";
  if (src === "pypi" || url.includes("pypi.org")) return "pypi";
  if (src === "producthunt" || url.includes("producthunt.com")) return "producthunt";
  if (src === "hackernews" || url.includes("ycombinator.com")) return "hackernews";
  if (src === "reddit" || url.includes("reddit.com")) return "reddit";
  return "other";
}

const SOURCE_FILTERS = [
  { value: "all", label: "All Sources" },
  { value: "github", label: "GitHub" },
  { value: "huggingface", label: "HuggingFace" },
  { value: "npm", label: "npm" },
  { value: "pypi", label: "PyPI" },
  { value: "producthunt", label: "ProductHunt" },
  { value: "hackernews", label: "HN" },
  { value: "reddit", label: "Reddit" },
  { value: "other", label: "Other" },
];

const SORT_OPTIONS = [
  { value: "new", label: "New", icon: "⏱" },
  { value: "hot", label: "Hot", icon: "🔥" },
  { value: "stars", label: "★ Stars", icon: "★" },
  { value: "downloads", label: "↓ Downloads", icon: "↓" },
];

function formatName(rawName) {
  if (!rawName) return "";
  let clean = rawName.replace(/^@[\w.-]+\//, "");
  clean = clean.replace(/[-_]+/g, " ");
  return clean.replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
}

function formatSubtitle(item) {
  const parts = [];
  if (item.category) parts.push(item.category);
  const sl = sourceLabel(item.url);
  if (sl) parts.push(sl);
  return parts.join(" · ") || item.source || "";
}

function extractRepoPath(item) {
  if (!item.url) return null;
  const m = item.url.match(/github\.com\/([^/]+\/[^/]+)/);
  return m ? m[1] : null;
}

// ─── Export Helpers ───
function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCSV(items) {
  const headers = ["name", "category", "source", "description", "url", "author", "stars", "downloads", "language", "discovered_at"];
  const escape = (v) => {
    if (v == null) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = items.map((d) => headers.map((h) => escape(d[h])).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  downloadBlob(csv, `agentscreener-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
}

function exportJSON(items) {
  const data = items.map((d) => ({
    name: d.name, category: d.category, source: d.source,
    description: d.description, url: d.url, author: d.author,
    stars: d.stars, downloads: d.downloads, language: d.language,
    discovered_at: d.discovered_at,
  }));
  downloadBlob(JSON.stringify(data, null, 2), `agentscreener-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
}

// ─── Main Component ───
export default function ScreenerClient() {
  const [discoveries, setDiscoveries] = useState([]);
  const [stats, setStats] = useState({ today: 0, this_hour: 0 });
  const [catFilter, setCatFilter] = useState("All");
  const [sortBy, setSortBy] = useState("new"); // new | hot | stars | downloads
  const [sourceFilter, setSourceFilter] = useState("all"); // all | github | huggingface | npm | pypi | producthunt | other
  const [q, setQ] = useState("");
  const [, setTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState("feed"); // feed | grid
  const [selectedItem, setSelectedItem] = useState(null);
  const [newCount, setNewCount] = useState(0);

  // ── Upvote + Saved state ──
  const [voterId, setVoterId] = useState(null);
  const [userVotes, setUserVotes] = useState(new Set());
  const [showSaved, setShowSaved] = useState(false);

  // ── Export dropdown ──
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef(null);

  // ── Pagination (history) ──
  const [historyItems, setHistoryItems] = useState([]);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(null);

  // ── Inline Analytics ──
  const [analyticsMap, setAnalyticsMap] = useState({});

  // ── Alerts + Collections + Notifications ──
  const [showAlertBuilder, setShowAlertBuilder] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef(null);
  const [collPickerTarget, setCollPickerTarget] = useState(null); // { discoveryId, rect }
  const [userCollections, setUserCollections] = useState([]);
  const [activeCollectionId, setActiveCollectionId] = useState(null); // null = all saved
  const [collectionItemIds, setCollectionItemIds] = useState(null); // Set of discovery IDs in active collection

  // ── Auth + Bookmarks ──
  const { user } = useAuth();
  const [userBookmarks, setUserBookmarks] = useState(new Set());
  const [showAuthMenu, setShowAuthMenu] = useState(false);

  const supabase = useMemo(() => getSupabase(), []);

  const fetchFeed = useCallback(() => {
    return fetch("/api/scanner?limit=300&fresh=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.discoveries) {
          setDiscoveries((prev) => {
            const byId = new Map(prev.map((item) => [item.id || item.external_id, item]));
            for (const item of d.discoveries) byId.set(item.id || item.external_id, item);
            return [...byId.values()]
              .sort((a, b) => new Date(b.discovered_at) - new Date(a.discovered_at))
              .slice(0, 300);
          });
          setStats(d.stats);
          if (d.total != null) setTotalCount(d.total);
          if (d.has_more != null) setHasMore(d.has_more);
        }
      })
      .catch(() => {});
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeed().finally(() => setTimeout(() => setRefreshing(false), 500));
  }, [fetchFeed]);

  useEffect(() => { fetchFeed(); const i = setInterval(fetchFeed, 15_000); return () => clearInterval(i); }, [fetchFeed]);

  // ── Self-healing: trigger scans from client to keep data fresh ──
  useEffect(() => {
    const triggerScan = () => {
      fetch("/api/scanner?trigger=1").catch(() => {});
    };
    triggerScan();
    const i = setInterval(triggerScan, 60_000);
    return () => clearInterval(i);
  }, []);

  // ── Realtime subscription ──
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase.channel("scanner-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "scanner_discoveries" },
        (p) => {
          setDiscoveries((prev) => {
            const id = p.new.id || p.new.external_id;
            if (prev.some((d) => (d.id || d.external_id) === id)) return prev;
            return [p.new, ...prev].slice(0, 300);
          });
          setStats((prev) => ({ today: prev.today + 1, this_hour: prev.this_hour + 1 }));
          setNewCount((prev) => prev + 1);
        })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") console.log("[Screener] Realtime connected");
        if (status === "CHANNEL_ERROR") console.warn("[Screener] Realtime channel error");
      });
    return () => supabase.removeChannel(ch);
  }, [supabase]);

  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 10_000); return () => clearInterval(id); }, []);

  // ── Escape to close detail panel ──
  useEffect(() => {
    if (!selectedItem) return;
    const onKey = (e) => { if (e.key === "Escape") setSelectedItem(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedItem]);

  // ── Lock body scroll when panel is open ──
  useEffect(() => {
    document.body.style.overflow = selectedItem ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedItem]);

  // ── Voter fingerprint init ──
  useEffect(() => {
    let id = localStorage.getItem("as_voter_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("as_voter_id", id);
    }
    setVoterId(id);
    fetch(`/api/vote?voter_id=${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.votes) setUserVotes(new Set(d.votes)); })
      .catch(() => {});
  }, []);

  // ── Vote handler (optimistic) — also toggles bookmark when logged in ──
  const handleVote = useCallback(async (e, discoveryId) => {
    e.stopPropagation();
    if (!voterId) return;
    const wasVoted = userVotes.has(discoveryId);
    setUserVotes((prev) => {
      const n = new Set(prev);
      wasVoted ? n.delete(discoveryId) : n.add(discoveryId);
      return n;
    });
    setDiscoveries((prev) =>
      prev.map((d) => d.id === discoveryId ? { ...d, upvotes: (d.upvotes || 0) + (wasVoted ? -1 : 1) } : d)
    );
    // Optimistic bookmark toggle
    if (user) {
      setUserBookmarks((prev) => {
        const n = new Set(prev);
        wasVoted ? n.delete(discoveryId) : n.add(discoveryId);
        return n;
      });
    }
    try {
      const r = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discovery_id: discoveryId, voter_id: voterId, user_id: user?.id }),
      });
      if (!r.ok) throw new Error();
      // Also toggle persistent bookmark if logged in
      if (user) {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, discovery_id: discoveryId }),
        });
      }
    } catch {
      setUserVotes((prev) => {
        const n = new Set(prev);
        wasVoted ? n.add(discoveryId) : n.delete(discoveryId);
        return n;
      });
      setDiscoveries((prev) =>
        prev.map((d) => d.id === discoveryId ? { ...d, upvotes: (d.upvotes || 0) + (wasVoted ? 1 : -1) } : d)
      );
      if (user) {
        setUserBookmarks((prev) => {
          const n = new Set(prev);
          wasVoted ? n.add(discoveryId) : n.delete(discoveryId);
          return n;
        });
      }
    }
  }, [voterId, userVotes, user]);

  // ── Fetch bookmarks when logged in ──
  useEffect(() => {
    if (!user) { setUserBookmarks(new Set()); return; }
    fetch(`/api/bookmarks?user_id=${user.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.bookmarks) setUserBookmarks(new Set(d.bookmarks)); })
      .catch(() => {});
  }, [user]);

  // ── Migrate anonymous votes to user on first login ──
  useEffect(() => {
    if (!user || !voterId) return;
    const migKey = `as_votes_migrated_${user.id}`;
    if (localStorage.getItem(migKey)) return;
    fetch("/api/vote/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voter_id: voterId, user_id: user.id }),
    }).then(() => {
      localStorage.setItem(migKey, "1");
      // Re-fetch bookmarks after migration
      fetch(`/api/bookmarks?user_id=${user.id}`)
        .then((r) => r.json())
        .then((d) => { if (d.bookmarks) setUserBookmarks(new Set(d.bookmarks)); })
        .catch(() => {});
    }).catch(() => {});
  }, [user, voterId]);

  // ── Close export dropdown on outside click ──
  useEffect(() => {
    if (!showExport) return;
    const onClick = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showExport]);

  // ── Fetch batch analytics for visible discoveries ──
  useEffect(() => {
    if (discoveries.length === 0) return;
    const ids = discoveries.slice(0, 50).map((d) => d.id).filter(Boolean).join(",");
    if (!ids) return;
    fetch(`/api/discovery-analytics?ids=${ids}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.analytics) setAnalyticsMap(d.analytics);
      })
      .catch(() => {});
  }, [discoveries.length]);

  // ── Fetch notifications when logged in ──
  useEffect(() => {
    if (!user) { setNotifications([]); setUnreadCount(0); return; }
    const fetchNotifs = () => {
      fetch(`/api/alerts/notifications?user_id=${user.id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.notifications) setNotifications(d.notifications);
          if (d.unread != null) setUnreadCount(d.unread);
        })
        .catch(() => {});
    };
    fetchNotifs();
    const i = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(i);
  }, [user]);

  // ── Fetch collections when logged in ──
  useEffect(() => {
    if (!user) { setUserCollections([]); return; }
    fetch(`/api/collections?user_id=${user.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.collections) setUserCollections(d.collections); })
      .catch(() => {});
  }, [user]);

  // ── Fetch collection items when a specific collection is active ──
  useEffect(() => {
    if (!activeCollectionId) { setCollectionItemIds(null); return; }
    fetch(`/api/collections/items?collection_id=${activeCollectionId}`)
      .then((r) => r.json())
      .then((d) => {
        const ids = new Set((d.items || []).map((i) => i.discovery_id));
        setCollectionItemIds(ids);
      })
      .catch(() => setCollectionItemIds(new Set()));
  }, [activeCollectionId]);

  // ── Close notification panel on outside click ──
  useEffect(() => {
    if (!showNotifPanel) return;
    const onClick = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifPanel(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showNotifPanel]);

  // ── Alert save handler ──
  const handleAlertSave = useCallback(async (alertData) => {
    if (!user) throw new Error("Sign in to create alerts");
    const isEdit = !!alertData.id;
    const res = await fetch("/api/alerts", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...alertData, user_id: user.id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to save alert");
    }
  }, [user]);

  // ── Mark notification read ──
  const markNotifRead = useCallback(async (notifId) => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    fetch("/api/alerts/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, id: notifId }),
    }).catch(() => {});
  }, [user]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    fetch("/api/alerts/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, mark_all: true }),
    }).catch(() => {});
  }, [user]);

  // ── Load more (pagination) ──
  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextOffset = discoveries.length + historyOffset;
      const params = new URLSearchParams({ limit: "50", offset: String(nextOffset) });
      if (catFilter !== "All") params.set("category", catFilter);
      if (q) params.set("q", q);
      const r = await fetch(`/api/scanner?${params}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      if (d.discoveries) {
        setHistoryItems((prev) => [...prev, ...d.discoveries]);
        setHistoryOffset((prev) => prev + d.discoveries.length);
        if (d.has_more != null) setHasMore(d.has_more);
        else setHasMore(d.discoveries.length >= 50);
        if (d.total != null) setTotalCount(d.total);
      }
    } catch { /* silent */ }
    setLoadingMore(false);
  }, [loadingMore, discoveries.length, historyOffset, catFilter, q]);

  // ── Reset history when filters change ──
  useEffect(() => {
    setHistoryItems([]);
    setHistoryOffset(0);
    setHasMore(false);
  }, [catFilter, q]);

  // ── Merge live feed + history items, dedup ──
  const allItems = useMemo(() => {
    const byId = new Map();
    for (const d of discoveries) byId.set(d.id || d.external_id, d);
    for (const d of historyItems) {
      const key = d.id || d.external_id;
      if (!byId.has(key)) byId.set(key, d);
    }
    return [...byId.values()].sort((a, b) => new Date(b.discovered_at) - new Date(a.discovered_at));
  }, [discoveries, historyItems]);

  const catCounts = useMemo(() => {
    const c = {};
    for (const d of allItems) if (d.category) c[d.category] = (c[d.category] || 0) + 1;
    return c;
  }, [allItems]);

  const topCats = useMemo(() =>
    Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([cat]) => cat),
  [catCounts]);

  const savedSet = user ? userBookmarks : userVotes;
  const savedCount = savedSet.size;

  // ── Source counts for source filter badges ──
  const sourceCounts = useMemo(() => {
    const c = {};
    for (const d of allItems) {
      const st = sourceType(d);
      c[st] = (c[st] || 0) + 1;
    }
    return c;
  }, [allItems]);

  const filtered = useMemo(() => {
    let items = allItems;

    // Saved / Collection filter
    if (showSaved) {
      if (activeCollectionId && collectionItemIds) {
        items = items.filter((d) => collectionItemIds.has(d.id));
      } else {
        items = items.filter((d) => savedSet.has(d.id));
      }
    }

    // Category filter
    if (catFilter !== "All") items = items.filter((d) => d.category === catFilter);

    // Source filter
    if (sourceFilter !== "all") items = items.filter((d) => sourceType(d) === sourceFilter);

    // Search filter
    if (q) { const lq = q.toLowerCase(); items = items.filter((d) => d.name?.toLowerCase().includes(lq) || d.description?.toLowerCase().includes(lq) || d.category?.toLowerCase().includes(lq) || d.author?.toLowerCase().includes(lq)); }

    // Duplicate grouping: keep highest-engagement version of items sharing the same name+author
    const grouped = new Map();
    for (const item of items) {
      const key = (item.name || "").toLowerCase().replace(/[-_\s]+/g, "") + "|" + (item.author || "").toLowerCase();
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, item);
      } else {
        // Keep the one with more engagement (stars + downloads + upvotes)
        const existingScore = (existing.stars || 0) + (existing.downloads || 0) + (existing.upvotes || 0);
        const newScore = (item.stars || 0) + (item.downloads || 0) + (item.upvotes || 0);
        if (newScore > existingScore) grouped.set(key, item);
      }
    }
    items = [...grouped.values()];

    // Sort
    if (sortBy === "hot") {
      items.sort((a, b) => {
        const scoreA = (a.upvotes || 0) * 3 + (a.stars || 0) + (a.downloads || 0) * 0.01;
        const scoreB = (b.upvotes || 0) * 3 + (b.stars || 0) + (b.downloads || 0) * 0.01;
        return scoreB - scoreA;
      });
    } else if (sortBy === "stars") {
      items.sort((a, b) => (b.stars || 0) - (a.stars || 0));
    } else if (sortBy === "downloads") {
      items.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    }
    // "new" sort is the default (already sorted by discovered_at in allItems)

    return items;
  }, [allItems, catFilter, sourceFilter, sortBy, q, showSaved, savedSet, activeCollectionId, collectionItemIds]);

  const sourceCount = useMemo(() => {
    const s = new Set();
    for (const d of allItems) if (d.source) s.add(d.source);
    return s.size;
  }, [allItems]);

  return (
    <div style={{ "--bg": "#0A0B10", "--s1": "#12141C", "--s2": "#1A1D28", "--b1": "rgba(255,255,255,.06)", "--b2": "rgba(255,255,255,.10)", "--b3": "rgba(255,255,255,.14)", "--t1": "#F2F2F7", "--t2": "rgba(242,242,247,.6)", "--t3": "rgba(242,242,247,.35)", "--g": "#2DD4BF", "--gg": "rgba(45,212,191,.1)", "--gd": "rgba(45,212,191,.04)", "--em": "#2DD4BF", "--m": "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace", "--f": "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: "var(--bg)", color: "var(--t1)", fontFamily: "var(--f)" }}>

      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes fi { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fi-scale { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: scale(1) } }
        @keyframes lp { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
        @keyframes sl { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        @keyframes glow-pulse { 0%,100% { box-shadow: 0 0 15px rgba(45,212,191,.03) } 50% { box-shadow: 0 0 25px rgba(45,212,191,.06) } }
        @keyframes scan-line { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes ring-rotate { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slide-in-right { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes new-glow { 0%,100% { box-shadow: inset 3px 0 12px -4px rgba(45,212,191,.04) } 50% { box-shadow: inset 3px 0 12px -4px rgba(45,212,191,.1) } }
        @keyframes vote-pop { 0% { transform: scale(1) } 50% { transform: scale(1.3) } 100% { transform: scale(1) } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(45,212,191,.12); }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.06); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.12); }
        .card { transition: all .2s cubic-bezier(.4,0,.2,1); border: 1px solid var(--b1); border-left: 2px solid transparent; cursor: pointer; position: relative; }
        .card:hover { border-left-color: rgba(45,212,191,.4); background: rgba(255,255,255,.015) !important; box-shadow: 0 2px 16px rgba(0,0,0,.15); }
        .card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent); opacity: 0; transition: opacity .25s; pointer-events: none; }
        .card:hover::after { opacity: 1; }
        .pill { transition: all .15s; cursor: pointer; user-select: none; }
        .pill:hover { background: rgba(255,255,255,.06) !important; }
        .pill.on { background: var(--gd) !important; border-color: var(--gg) !important; color: var(--g) !important; }
        .link-hover { transition: all .15s; text-decoration: none; }
        .link-hover:hover { color: var(--g) !important; }
        .ghost-btn { transition: all .15s; cursor: pointer; border: 1px solid var(--b1); background: transparent; }
        .ghost-btn:hover { background: rgba(255,255,255,.04); border-color: var(--b2); }
        .stat-card { background: var(--s1); border: 1px solid var(--b1); border-radius: 10px; padding: 14px 18px; position: relative; overflow: hidden; }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.04), transparent); }
        .detail-panel::-webkit-scrollbar { width: 4px; }
        .detail-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 2px; }
        .vote-btn { transition: all .15s; cursor: pointer; border: none; background: transparent; }
        .vote-btn:hover { background: rgba(255,255,255,.04) !important; }
        .vote-btn:active .vote-arrow { animation: vote-pop .2s ease; }
        @media (max-width: 768px) {
          .screener-header { padding: 0 12px !important; }
          .screener-header-right .dash-link { display: none !important; }
          .screener-header-right .screener-badge { display: none !important; }
          .screener-stats { grid-template-columns: repeat(2, 1fr) !important; padding: 12px !important; }
          .screener-toolbar { padding: 0 12px 12px !important; flex-direction: column !important; align-items: stretch !important; }
          .screener-pills { max-width: 100% !important; overflow-x: auto !important; }
          .screener-search-row { width: 100% !important; }
          .screener-search-row input { width: 100% !important; }
          .screener-feed { padding: 0 12px 40px !important; }
          .screener-grid { grid-template-columns: 1fr !important; }
          .screener-footer { padding: 16px 12px !important; flex-direction: column !important; gap: 6px !important; text-align: center !important; }
          .screener-new-banner { margin: 0 12px 8px !important; }
          .detail-panel { width: 100% !important; max-width: 100% !important; }
        }
      `}</style>

      {/* ─── Ambient Background ─── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "20%", width: "40vw", height: "40vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(45,212,191,.02) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "30%", right: "10%", width: "30vw", height: "30vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,.015) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "40%", width: "35vw", height: "35vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(45,212,191,.01) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      {/* ─── HEADER ─── */}
      <header className="screener-header" style={{ padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--b1)", background: "rgba(10,11,16,.88)", backdropFilter: "blur(24px) saturate(180%)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--t1)" }}>
            <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--m)", letterSpacing: "-.02em" }}>
              agent<span style={{ color: "var(--g)" }}>screener</span>
            </span>
          </a>
          <div className="screener-badge" style={{ height: 20, width: 1, background: "var(--b2)" }} />
          <span className="screener-badge" style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t2)", letterSpacing: ".06em", padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>SCREENER</span>
        </div>
        <div className="screener-header-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Scanning indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 14px", borderRadius: 4, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2DD4BF", animation: "lp 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", fontFamily: "var(--m)", letterSpacing: ".04em" }}>LIVE</span>
            <div style={{ width: 30, height: 2, borderRadius: 1, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
              <div style={{ width: "30%", height: "100%", background: "rgba(45,212,191,.4)", animation: "scan-line 2s ease-in-out infinite" }} />
            </div>
          </div>
          <button className="ghost-btn" onClick={handleRefresh} disabled={refreshing} style={{ padding: "6px 14px", borderRadius: 6, color: "var(--t2)", fontSize: 12, fontWeight: 600, fontFamily: "var(--m)", display: "flex", alignItems: "center", gap: 6, opacity: refreshing ? 0.5 : 1 }}>
            <span style={{ display: "inline-block", fontSize: 14, animation: refreshing ? "spin .5s linear infinite" : "none" }}>⟳</span>
            Refresh
          </button>
          <a href="/activity" className="link-hover dash-link" style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--b1)", color: "var(--t2)", fontSize: 12, fontWeight: 600 }}>Activity</a>
          <a href="/dashboard" className="link-hover dash-link" style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--b1)", color: "var(--t2)", fontSize: 12, fontWeight: 600 }}>Dashboard</a>
          {/* Notification bell */}
          {user && (
            <div ref={notifRef} style={{ position: "relative" }}>
              <button className="ghost-btn" onClick={() => setShowNotifPanel(!showNotifPanel)} style={{ padding: "6px 10px", borderRadius: 6, color: "var(--t2)", fontSize: 15, position: "relative", display: "flex", alignItems: "center" }}>
                <span role="img" aria-label="notifications">&#x1F514;</span>
                {unreadCount > 0 && (
                  <span style={{ position: "absolute", top: 2, right: 4, minWidth: 14, height: 14, borderRadius: 7, background: "#EF4444", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", fontFamily: "var(--m)" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifPanel && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 340, maxHeight: 400, background: "#12141C", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, boxShadow: "0 12px 40px rgba(0,0,0,.5)", zIndex: 200, animation: "fi .15s ease", overflowY: "auto" }}>
                  <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid rgba(255,255,255,.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ background: "none", border: "none", color: "var(--g)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--m)" }}>Mark all read</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 12, color: "var(--t3)" }}>No notifications yet. Create alerts to get notified.</div>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <div key={n.id} onClick={() => { markNotifRead(n.id); if (n.discovery_id) { const item = allItems.find((d) => d.id === n.discovery_id); if (item) setSelectedItem(item); } setShowNotifPanel(false); }} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,.02)", cursor: "pointer", background: n.read ? "transparent" : "rgba(45,212,191,.02)", transition: "background .12s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,.02)"} onMouseLeave={(e) => e.currentTarget.style.background = n.read ? "transparent" : "rgba(45,212,191,.02)"}>
                        <div style={{ fontSize: 12, fontWeight: n.read ? 500 : 700, color: n.read ? "var(--t2)" : "var(--t1)", marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: 11, color: "var(--t3)" }}>{n.body}</div>
                        <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 4, fontFamily: "var(--m)" }}>{n.created_at ? timeAgo(n.created_at) : ""}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          {user ? (
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #2DD4BF, #A78BFA)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0A0B10", cursor: "default", flexShrink: 0 }} title={user.email}>
              {(user.user_metadata?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
            </div>
          ) : (
            <a href="/auth/login" className="ghost-btn" style={{ padding: "6px 14px", borderRadius: 6, color: "var(--g)", fontSize: 12, fontWeight: 700, fontFamily: "var(--m)", textDecoration: "none" }}>Sign In</a>
          )}
        </div>
      </header>

      {/* ─── HERO STATS ─── */}
      <div className="screener-stats" style={{ padding: "20px 32px", position: "relative", zIndex: 1 }}>
        <div className="screener-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Detected Today", value: stats.today, icon: "◈", color: "#2DD4BF" },
            { label: "This Hour", value: stats.this_hour, icon: "⏱", color: "#A78BFA" },
            { label: "In Feed", value: filtered.length, icon: "◉", color: "#38BDF8" },
            { label: "Sources Active", value: sourceCount || 11, icon: "⊛", color: "#FBBF24" },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ animation: `fi .4s ease ${i * 0.06}s both` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 6, fontFamily: "var(--m)" }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--m)", color: "var(--t1)", letterSpacing: "-.02em", lineHeight: 1 }}>{s.value}</div>
                </div>
                <span style={{ fontSize: 18, color: s.color, opacity: 0.5 }}>{s.icon}</span>
              </div>
              <div style={{ marginTop: 10, height: 2, borderRadius: 1, background: "rgba(255,255,255,.04)" }}>
                <div style={{ width: `${Math.min((s.value / Math.max(stats.today || 1, 1)) * 100, 100)}%`, height: "100%", background: s.color, borderRadius: 1, transition: "width .5s ease", minWidth: s.value > 0 ? "4%" : "0%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── TOOLBAR ─── */}
      <div className="screener-toolbar" style={{ padding: "0 32px 16px", display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 }}>
        {/* Row 1: Sort tabs + Category pills */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", overflowX: "auto", flex: 1, paddingBottom: 2 }}>
            {/* Sort tabs */}
            <div style={{ display: "flex", borderRadius: 6, border: "1px solid var(--b1)", overflow: "hidden", flexShrink: 0, marginRight: 6 }}>
              {SORT_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setSortBy(opt.value)} style={{ padding: "6px 12px", border: "none", background: sortBy === opt.value ? "rgba(45,212,191,.08)" : "transparent", color: sortBy === opt.value ? "var(--g)" : "var(--t3)", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .12s", fontFamily: "var(--m)", whiteSpace: "nowrap", letterSpacing: ".02em" }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Divider */}
            <div style={{ width: 1, height: 20, background: "var(--b1)", flexShrink: 0 }} />
            {/* Saved + Collections + Category pills */}
            <button className={`pill${showSaved && !activeCollectionId ? " on" : ""}`} onClick={() => { setActiveCollectionId(null); setShowSaved(!showSaved || !!activeCollectionId); if (!showSaved) setCatFilter("All"); }} style={{ padding: "6px 14px", borderRadius: 4, border: (showSaved && !activeCollectionId) ? "1px solid rgba(255,255,255,.12)" : "1px solid var(--b1)", background: (showSaved && !activeCollectionId) ? "rgba(45,212,191,.04)" : "transparent", fontSize: 12, fontWeight: 700, fontFamily: "var(--m)", color: (showSaved && !activeCollectionId) ? "var(--g)" : "var(--t2)", whiteSpace: "nowrap" }}>
              ★ Saved
              {savedCount > 0 && <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.5, fontFamily: "var(--m)" }}>{savedCount}</span>}
            </button>
            {user && userCollections.map((col) => (
              <button key={col.id} className={`pill${activeCollectionId === col.id ? " on" : ""}`} onClick={() => { setActiveCollectionId(activeCollectionId === col.id ? null : col.id); setShowSaved(true); setCatFilter("All"); }} style={{ padding: "6px 14px", borderRadius: 4, border: activeCollectionId === col.id ? "1px solid rgba(255,255,255,.12)" : "1px solid var(--b1)", background: activeCollectionId === col.id ? "rgba(45,212,191,.04)" : "transparent", fontSize: 12, fontWeight: 600, fontFamily: "var(--m)", color: activeCollectionId === col.id ? "var(--g)" : "var(--t2)", whiteSpace: "nowrap" }}>
                {col.icon} {col.name}
                {col.item_count > 0 && <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.5, fontFamily: "var(--m)" }}>{col.item_count}</span>}
              </button>
            ))}
            <button className={`pill${catFilter === "All" && !showSaved ? " on" : ""}`} onClick={() => { setCatFilter("All"); setShowSaved(false); setActiveCollectionId(null); }} style={{ padding: "6px 14px", borderRadius: 4, border: "1px solid var(--b1)", fontSize: 12, fontWeight: 600, fontFamily: "var(--m)", color: "var(--t2)", whiteSpace: "nowrap", background: "transparent" }}>All</button>
            {topCats.map((cat) => (
              <button key={cat} className={`pill${catFilter === cat ? " on" : ""}`} onClick={() => setCatFilter(catFilter === cat ? "All" : cat)} style={{ padding: "6px 14px", borderRadius: 4, border: "1px solid var(--b1)", fontSize: 12, fontWeight: 600, fontFamily: "var(--m)", color: "var(--t2)", whiteSpace: "nowrap", background: "transparent" }}>
                {cat}
                <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.5, fontFamily: "var(--m)" }}>{catCounts[cat]}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Row 2: Source filters + Search + Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", gap: 4, alignItems: "center", overflowX: "auto" }}>
            {SOURCE_FILTERS.filter((sf) => sf.value === "all" || (sourceCounts[sf.value] || 0) > 0).map((sf) => (
              <button key={sf.value} className={`pill${sourceFilter === sf.value ? " on" : ""}`} onClick={() => setSourceFilter(sourceFilter === sf.value ? "all" : sf.value)} style={{ padding: "5px 10px", borderRadius: 4, border: "1px solid var(--b1)", fontSize: 10, fontWeight: 600, fontFamily: "var(--m)", color: sourceFilter === sf.value ? "var(--g)" : "var(--t3)", whiteSpace: "nowrap", background: "transparent", letterSpacing: ".03em", textTransform: "uppercase" }}>
                {sf.label}
                {sf.value !== "all" && sourceCounts[sf.value] > 0 && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.5 }}>{sourceCounts[sf.value]}</span>}
              </button>
            ))}
          </div>
          <div className="screener-search-row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--t3)", pointerEvents: "none" }}>⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." style={{ width: "100%", padding: "8px 12px 8px 32px", fontSize: 12, borderRadius: 6, border: "1px solid var(--b1)", background: "var(--s1)", color: "var(--t1)", outline: "none", fontFamily: "var(--m)", transition: "border-color .15s" }} onFocus={(e) => e.target.style.borderColor = "var(--b2)"} onBlur={(e) => e.target.style.borderColor = "var(--b1)"} />
          </div>
          {/* Export dropdown */}
          <div ref={exportRef} style={{ position: "relative" }}>
            <button className="ghost-btn" onClick={() => setShowExport(!showExport)} style={{ padding: "8px 12px", borderRadius: 6, color: "var(--t2)", fontSize: 12, fontWeight: 600, fontFamily: "var(--m)", display: "flex", alignItems: "center", gap: 5 }}>
              ↓ Export
            </button>
            {showExport && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, minWidth: 180, background: "var(--s1)", border: "1px solid var(--b2)", borderRadius: 8, padding: 4, zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,.4)", animation: "fi .15s ease" }}>
                <button onClick={() => { exportCSV(filtered); setShowExport(false); }} style={{ width: "100%", padding: "10px 14px", border: "none", background: "transparent", color: "var(--t1)", fontSize: 12, fontWeight: 600, fontFamily: "var(--m)", cursor: "pointer", textAlign: "left", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background .12s" }} onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,.04)"} onMouseLeave={(e) => e.target.style.background = "transparent"}>
                  <span>CSV</span><span style={{ fontSize: 10, color: "var(--t3)" }}>{filtered.length} items</span>
                </button>
                <button onClick={() => { exportJSON(filtered); setShowExport(false); }} style={{ width: "100%", padding: "10px 14px", border: "none", background: "transparent", color: "var(--t1)", fontSize: 12, fontWeight: 600, fontFamily: "var(--m)", cursor: "pointer", textAlign: "left", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background .12s" }} onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,.04)"} onMouseLeave={(e) => e.target.style.background = "transparent"}>
                  <span>JSON</span><span style={{ fontSize: 10, color: "var(--t3)" }}>{filtered.length} items</span>
                </button>
              </div>
            )}
          </div>
          {user && (
            <button className="ghost-btn" onClick={() => { setEditingAlert(null); setShowAlertBuilder(true); }} style={{ padding: "8px 12px", borderRadius: 6, color: "var(--g)", fontSize: 12, fontWeight: 700, fontFamily: "var(--m)", display: "flex", alignItems: "center", gap: 5, border: "1px solid rgba(45,212,191,.15)" }}>
              + Alert
            </button>
          )}
          <div style={{ display: "flex", borderRadius: 4, border: "1px solid var(--b1)", overflow: "hidden" }}>
            {["feed", "grid"].map((v) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 10px", border: "none", background: view === v ? "rgba(255,255,255,.06)" : "transparent", color: view === v ? "var(--t1)" : "var(--t3)", fontSize: 12, cursor: "pointer", transition: "all .12s", fontFamily: "var(--m)" }}>{v === "feed" ? "☰" : "⊞"}</button>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* ─── NEW PRODUCTS BANNER ─── */}
      {newCount > 0 && (
        <div className="screener-new-banner" style={{ position: "sticky", top: 56, zIndex: 50, margin: "0 32px 12px", padding: "10px 20px", borderRadius: 6, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(12px)", animation: "fi .3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2DD4BF", animation: "lp 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)", fontFamily: "var(--m)" }}>
              {newCount} new product{newCount > 1 ? "s" : ""} discovered
            </span>
          </div>
          <button onClick={() => { setNewCount(0); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ padding: "5px 14px", borderRadius: 4, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "var(--t1)", fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", cursor: "pointer", letterSpacing: ".04em" }}>
            SHOW ↑
          </button>
        </div>
      )}

      {/* ─── FEED / GRID ─── */}
      <div className="screener-feed" style={{ padding: "0 32px 60px", position: "relative", zIndex: 1 }}>
        {filtered.length === 0 && showSaved ? (
          <div style={{ padding: "80px 0", textAlign: "center", animation: "fi .5s ease both" }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>★</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--t1)", marginBottom: 8, fontFamily: "var(--m)" }}>No saved products yet</div>
            <div style={{ fontSize: 13, color: "var(--t2)", maxWidth: 380, margin: "0 auto" }}>
              {user ? "Upvote products to bookmark them. Your saves persist across devices." : "Upvote products to save them. Sign in to sync saves across devices."}
            </div>
            {!user && (
              <a href="/auth/login" style={{ display: "inline-block", marginTop: 16, padding: "10px 24px", borderRadius: 6, background: "var(--g)", color: "#0A0B10", fontSize: 13, fontWeight: 800, fontFamily: "var(--m)", textDecoration: "none", letterSpacing: ".02em" }}>
                Sign In to Sync
              </a>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : view === "feed" ? (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            {filtered.map((d, i) => <FeedCard key={d.id || d.external_id} item={d} index={i} onSelect={setSelectedItem} voted={savedSet.has(d.id)} onVote={handleVote} analytics={analyticsMap[d.id]} user={user} onCollectionPick={(rect) => setCollPickerTarget({ discoveryId: d.id, rect })} />)}
          </div>
        ) : (
          <div className="screener-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
            {filtered.map((d, i) => <GridCard key={d.id || d.external_id} item={d} index={i} onSelect={setSelectedItem} voted={savedSet.has(d.id)} onVote={handleVote} analytics={analyticsMap[d.id]} user={user} onCollectionPick={(rect) => setCollPickerTarget({ discoveryId: d.id, rect })} />)}
          </div>
        )}

        {/* ─── Load More Button ─── */}
        {!showSaved && filtered.length > 0 && (hasMore || historyItems.length === 0) && (
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <button className="ghost-btn" onClick={loadMore} disabled={loadingMore} style={{ padding: "12px 32px", borderRadius: 8, color: "var(--t2)", fontSize: 13, fontWeight: 700, fontFamily: "var(--m)", display: "inline-flex", alignItems: "center", gap: 8, opacity: loadingMore ? 0.5 : 1 }}>
              {loadingMore ? (
                <><span style={{ display: "inline-block", animation: "spin .6s linear infinite" }}>⟳</span> Loading...</>
              ) : (
                <>Load older discoveries{totalCount != null && ` (${totalCount.toLocaleString()} total)`}</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="screener-footer" style={{ padding: "20px 32px", borderTop: "1px solid var(--b1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--m)", letterSpacing: ".06em" }}>AGENTSCREENER v1.0</span>
          <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--t3)" }} />
          <span style={{ fontSize: 10, color: "var(--t3)" }}>21 intelligence sources</span>
        </div>
        <span style={{ fontSize: 10, color: "var(--t3)", fontStyle: "italic" }}>Real-time AI ecosystem intelligence</span>
      </footer>

      {/* ─── DETAIL PANEL ─── */}
      {selectedItem && <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} voted={savedSet.has(selectedItem.id)} onVote={handleVote} user={user} onCollectionPick={(rect) => setCollPickerTarget({ discoveryId: selectedItem.id, rect })} onCreateAlert={() => { setEditingAlert(null); setShowAlertBuilder(true); }} />}

      {/* ─── ALERT BUILDER MODAL ─── */}
      {showAlertBuilder && (
        <AlertBuilder
          onClose={() => { setShowAlertBuilder(false); setEditingAlert(null); }}
          onSave={handleAlertSave}
          editAlert={editingAlert}
        />
      )}

      {/* ─── COLLECTION PICKER (floating) ─── */}
      {collPickerTarget && user && (
        <div style={{ position: "fixed", inset: 0, zIndex: 150 }} onClick={() => setCollPickerTarget(null)}>
          <div style={{ position: "absolute", top: collPickerTarget.rect?.top || 200, left: collPickerTarget.rect?.left || 200 }} onClick={(e) => e.stopPropagation()}>
            <CollectionPicker
              userId={user.id}
              discoveryId={collPickerTarget.discoveryId}
              onClose={() => setCollPickerTarget(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upvote Button ───
function UpvoteButton({ item, voted, onVote, size = "sm" }) {
  const isLg = size === "lg";
  return (
    <button
      className="vote-btn"
      onClick={(e) => onVote(e, item.id)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
        padding: isLg ? "8px 14px" : "4px 8px", borderRadius: 4,
        border: `1px solid ${voted ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.06)"}`,
        background: voted ? "rgba(45,212,191,.04)" : "transparent",
        minWidth: isLg ? 48 : 36,
      }}
    >
      <span className="vote-arrow" style={{
        fontSize: isLg ? 16 : 12, lineHeight: 1,
        color: voted ? "#2DD4BF" : "var(--t3)",
        transition: "color .15s",
      }}>
        {voted ? "▲" : "△"}
      </span>
      <span style={{
        fontSize: isLg ? 12 : 10, fontWeight: 700, fontFamily: "var(--m)",
        color: voted ? "#2DD4BF" : "var(--t3)",
        transition: "color .15s",
      }}>
        {item.upvotes || 0}
      </span>
    </button>
  );
}

// ─── Feed Card (list view) ───
function FeedCard({ item, index, onSelect, voted, onVote, analytics, user, onCollectionPick }) {
  const age = item.discovered_at ? timeAgo(item.discovered_at) : "—";
  const isVeryNew = item.discovered_at && (Date.now() - new Date(item.discovered_at).getTime()) < 120_000;
  const isNew = item.discovered_at && (Date.now() - new Date(item.discovered_at).getTime()) < 600_000;
  const repoPath = extractRepoPath(item);

  return (
    <div className="card" onClick={() => onSelect?.(item)} style={{
      padding: "16px 20px", borderRadius: 6, background: "var(--s1)", marginBottom: 8,
      animation: `fi .35s ease ${Math.min(index * 0.04, 0.6)}s both`,
      borderLeftColor: isVeryNew ? "#2DD4BF" : undefined,
      ...(isVeryNew ? { animation: `fi .35s ease ${Math.min(index * 0.04, 0.6)}s both, new-glow 2s ease-in-out infinite` } : {}),
    }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>{formatName(item.name)}</span>
            {isNew && <span style={{ fontSize: 8, fontWeight: 800, fontFamily: "var(--m)", color: "#2DD4BF", letterSpacing: ".06em" }}>NEW</span>}
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{formatSubtitle(item)}</span>
            {repoPath && <span style={{ fontFamily: "var(--m)", fontSize: 10, opacity: 0.6 }}>{repoPath}</span>}
            {item.author && (
              item.author_url
                ? <a href={item.author_url} target="_blank" rel="noopener noreferrer" className="link-hover" onClick={(e) => e.stopPropagation()} style={{ fontSize: 11, color: "var(--t3)", fontWeight: 500 }}>by {item.author}</a>
                : <span style={{ fontSize: 11, color: "var(--t3)", fontWeight: 500 }}>by {item.author}</span>
            )}
          </div>

          {/* Description — 2-line clamp */}
          {item.description && (
            <div style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</div>
          )}

          {/* Metadata row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {item.category && (
              <span style={{ padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", fontSize: 11, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--m)" }}>{item.category}</span>
            )}
            {item.language && (
              <span style={{ padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", fontSize: 11, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--m)" }}>{item.language}</span>
            )}
            {item.stars > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", fontFamily: "var(--m)" }}>★ {fmtN(item.stars)}</span>}
            {item.downloads > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", fontFamily: "var(--m)" }}>↓ {fmtN(item.downloads)}</span>}
            {/* Inline analytics */}
            {analytics?.sparkline?.length > 1 && (
              <Sparkline data={analytics.sparkline} width={56} height={16} color="auto" showDot={true} />
            )}
            {analytics?.growth?.stars_pct_7d != null && Math.abs(analytics.growth.stars_pct_7d) >= 0.5 && (
              <GrowthBadge pct={analytics.growth.stars_pct_7d} />
            )}
            {analytics?.velocity?.stars_24h > 0 && (
              <VelocityBadge delta={analytics.velocity.stars_24h} icon="★" />
            )}
            <span style={{ fontSize: 11, color: "var(--t3)" }}>·</span>
            {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="link-hover" onClick={(e) => e.stopPropagation()} style={{ fontSize: 11, fontWeight: 500, color: "var(--t3)" }}>{sourceLabel(item.url)} ↗</a>}
          </div>
        </div>

        {/* Right column: upvote + time + collection */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <UpvoteButton item={item} voted={voted} onVote={onVote} />
          <div style={{ fontSize: 11, fontWeight: 600, color: isNew ? "#2DD4BF" : "var(--t3)", fontFamily: "var(--m)" }}>{age}</div>
          {user && (
            <button className="ghost-btn" onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); onCollectionPick?.({ top: rect.bottom + 4, left: rect.left - 200 }); }} style={{ padding: "3px 8px", borderRadius: 4, color: "var(--t3)", fontSize: 10, fontWeight: 600, fontFamily: "var(--m)", border: "1px solid rgba(255,255,255,.06)" }} title="Add to collection">
              + List
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Grid Card ───
function GridCard({ item, index, onSelect, voted, onVote, analytics, user, onCollectionPick }) {
  const isVeryNew = item.discovered_at && (Date.now() - new Date(item.discovered_at).getTime()) < 120_000;
  const isNew = item.discovered_at && (Date.now() - new Date(item.discovered_at).getTime()) < 600_000;

  return (
    <div className="card" onClick={() => onSelect?.(item)} style={{
      padding: "18px 20px", borderRadius: 8, background: "var(--s1)",
      animation: `fi-scale .3s ease ${Math.min(index * 0.04, 0.5)}s both`,
      borderLeftColor: isVeryNew ? "#2DD4BF" : undefined,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>{formatName(item.name)}</span>
              {isNew && <span style={{ fontSize: 8, fontWeight: 800, fontFamily: "var(--m)", color: "#2DD4BF", letterSpacing: ".06em" }}>NEW</span>}
            </div>
            <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 1, fontFamily: "var(--m)" }}>{formatSubtitle(item)}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", fontFamily: "var(--m)" }}>{item.discovered_at ? timeAgo(item.discovered_at) : "—"}</div>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.55, marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</div>
      )}

      {/* Metrics bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, padding: "10px 14px", borderRadius: 6, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)" }}>
        {[
          item.stars > 0 && { label: "Stars", value: fmtN(item.stars) },
          item.downloads > 0 && { label: "Downloads", value: fmtN(item.downloads) },
          item.language && { label: "Language", value: item.language },
        ].filter(Boolean).slice(0, 3).map((m, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 2, fontFamily: "var(--m)" }}>{m.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--m)", color: "var(--t1)" }}>{m.value}</div>
          </div>
        ))}
        {![item.stars, item.downloads].some(v => v > 0) && !item.language && (
          <div style={{ flex: 1, fontSize: 10, color: "var(--t3)", fontStyle: "italic", fontFamily: "var(--m)" }}>Newly detected</div>
        )}
      </div>

      {/* Analytics row */}
      {analytics?.sparkline?.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "6px 14px", borderRadius: 6, background: "rgba(255,255,255,.015)" }}>
          <Sparkline data={analytics.sparkline} width={100} height={22} color="auto" showArea={true} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {analytics.growth?.stars_pct_7d != null && Math.abs(analytics.growth.stars_pct_7d) >= 0.5 && (
              <GrowthBadge pct={analytics.growth.stars_pct_7d} />
            )}
            {analytics.velocity?.stars_24h > 0 && (
              <VelocityBadge delta={analytics.velocity.stars_24h} icon="★" />
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {item.category && <span style={{ padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", fontSize: 10, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--m)" }}>{item.category}</span>}
          <UpvoteButton item={item} voted={voted} onVote={onVote} />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {user && (
            <button className="ghost-btn" onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); onCollectionPick?.({ top: rect.bottom + 4, left: rect.left }); }} style={{ padding: "3px 8px", borderRadius: 4, color: "var(--t3)", fontSize: 10, fontWeight: 600, fontFamily: "var(--m)", border: "1px solid rgba(255,255,255,.06)" }} title="Add to collection">
              + List
            </button>
          )}
          {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="link-hover" onClick={(e) => e.stopPropagation()} style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,.06)" }}>{sourceLabel(item.url)} ↗</a>}
          {item.author_url && <a href={item.author_url} target="_blank" rel="noopener noreferrer" className="link-hover" onClick={(e) => e.stopPropagation()} style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,.06)" }}>Profile</a>}
        </div>
      </div>
    </div>
  );
}

// ─── Detail Panel (slide-out from right) ───
function DetailPanel({ item, onClose, voted, onVote, user, onCollectionPick, onCreateAlert }) {
  if (!item) return null;

  const repoPath = extractRepoPath(item);
  const sl = sourceLabel(item.url);

  const metrics = [
    { label: "Stars", value: fmtN(item.stars), show: item.stars > 0 },
    { label: "Forks", value: fmtN(item.forks), show: item.forks > 0 },
    { label: "Downloads", value: fmtN(item.downloads), show: item.downloads > 0 },
    { label: "Language", value: item.language, show: !!item.language },
    { label: "License", value: item.license, show: !!item.license },
  ].filter((m) => m.show);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", zIndex: 200, animation: "fade-in .2s ease" }} />

      {/* Panel */}
      <div className="detail-panel" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 460, maxWidth: "90vw", background: "#12141C", borderLeft: "1px solid rgba(255,255,255,.06)", zIndex: 201, overflowY: "auto", animation: "slide-in-right .25s cubic-bezier(.4,0,.2,1)", boxShadow: "-20px 0 60px rgba(0,0,0,.4)" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,.04)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#F2F2F7", margin: 0, letterSpacing: "-.02em", lineHeight: 1.3 }}>
              {formatName(item.name)}
            </h2>
            <div style={{ fontSize: 12, color: "rgba(242,242,247,.38)", marginTop: 4, fontFamily: "var(--m)" }}>
              {formatSubtitle(item)}
            </div>
            {repoPath && (
              <div style={{ fontSize: 11, fontFamily: "var(--m)", color: "rgba(242,242,247,.38)", marginTop: 2, opacity: 0.7 }}>
                {repoPath}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", color: "rgba(242,242,247,.65)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12 }}>
            ✕
          </button>
        </div>

        {/* Badges */}
        <div style={{ padding: "16px 24px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
          {sl && <span style={{ padding: "4px 12px", borderRadius: 4, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", fontSize: 11, fontWeight: 600, color: "rgba(242,242,247,.65)", fontFamily: "var(--m)" }}>{sl}</span>}
          {item.category && <span style={{ padding: "4px 12px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", fontSize: 11, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--m)" }}>{item.category}</span>}
        </div>

        {/* Author */}
        {item.author && (
          <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,.04)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--t2)", fontFamily: "var(--m)" }}>
              {item.author[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#F2F2F7" }}>{item.author}</div>
              <div style={{ fontSize: 10, color: "rgba(242,242,247,.38)", fontFamily: "var(--m)" }}>Author</div>
            </div>
            {item.author_url && (
              <a href={item.author_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: "rgba(242,242,247,.38)", textDecoration: "none", padding: "4px 10px", borderRadius: 4, border: "1px solid rgba(255,255,255,.08)", transition: "all .15s", fontFamily: "var(--m)" }}>
                Profile ↗
              </a>
            )}
          </div>
        )}

        {/* Description */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(242,242,247,.38)", marginBottom: 8, fontFamily: "var(--m)" }}>Description</div>
          <div style={{ fontSize: 13, color: "rgba(242,242,247,.65)", lineHeight: 1.65 }}>
            {item.description || "No description available."}
          </div>
        </div>

        {/* Metrics grid */}
        {metrics.length > 0 && (
          <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(242,242,247,.38)", marginBottom: 10, fontFamily: "var(--m)" }}>Metrics</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {metrics.map((m, i) => (
                <div key={i} style={{ padding: "10px 12px", borderRadius: 6, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)" }}>
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(242,242,247,.38)", marginBottom: 3, fontFamily: "var(--m)" }}>{m.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--m)", color: "#F2F2F7" }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commit Activity Heatmap */}
        {repoPath && (
          <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(242,242,247,.38)", marginBottom: 10, fontFamily: "var(--m)" }}>Commit Activity</div>
            <CommitHeatmapLoader repo={repoPath} />
          </div>
        )}

        {/* Topics */}
        {item.topics?.length > 0 && (
          <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(242,242,247,.38)", marginBottom: 8, fontFamily: "var(--m)" }}>Topics</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {item.topics.map((t, i) => (
                <span key={i} style={{ padding: "4px 10px", borderRadius: 4, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", fontSize: 11, fontWeight: 500, color: "rgba(242,242,247,.65)", fontFamily: "var(--m)" }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* AI Keywords */}
        {item.ai_keywords?.length > 0 && (
          <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(242,242,247,.38)", marginBottom: 8, fontFamily: "var(--m)" }}>AI Classification</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {item.ai_keywords.map((kw, i) => (
                <span key={i} style={{ padding: "4px 10px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", fontSize: 11, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--m)" }}>{kw}</span>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,.04)", display: "flex", gap: 24 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(242,242,247,.38)", marginBottom: 3, fontFamily: "var(--m)" }}>Discovered</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#F2F2F7", fontFamily: "var(--m)" }}>{item.discovered_at ? timeAgo(item.discovered_at) : "—"}</div>
            {item.discovered_at && <div style={{ fontSize: 10, color: "rgba(242,242,247,.38)", marginTop: 1, fontFamily: "var(--m)" }}>{new Date(item.discovered_at).toLocaleDateString()}</div>}
          </div>
          {item.source_created_at && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(242,242,247,.38)", marginBottom: 3, fontFamily: "var(--m)" }}>Created</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#F2F2F7", fontFamily: "var(--m)" }}>{timeAgo(item.source_created_at)}</div>
              <div style={{ fontSize: 10, color: "rgba(242,242,247,.38)", marginTop: 1, fontFamily: "var(--m)" }}>{new Date(item.source_created_at).toLocaleDateString()}</div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ padding: "20px 24px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <UpvoteButton item={item} voted={voted} onVote={onVote} size="lg" />
          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "12px 0", borderRadius: 6, background: "#2DD4BF", color: "#0A0B10", fontSize: 13, fontWeight: 800, textDecoration: "none", textAlign: "center", display: "block", transition: "opacity .15s", fontFamily: "var(--m)", letterSpacing: ".02em" }}>
            Open Product →
          </a>
          {item.author_url && (
            <a href={item.author_url} target="_blank" rel="noopener noreferrer" style={{ padding: "12px 20px", borderRadius: 6, background: "transparent", border: "1px solid rgba(255,255,255,.12)", color: "rgba(242,242,247,.65)", fontSize: 13, fontWeight: 600, textDecoration: "none", textAlign: "center", transition: "all .15s" }}>
              View Author
            </a>
          )}
        </div>
        {/* Collection & Alert actions */}
        {user && (
          <div style={{ padding: "0 24px 20px", display: "flex", gap: 10 }}>
            <button onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); onCollectionPick?.({ top: rect.bottom + 4, left: rect.left }); }} style={{ flex: 1, padding: "10px 0", borderRadius: 6, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)", color: "rgba(242,242,247,.65)", fontSize: 12, fontWeight: 600, fontFamily: "var(--m)", cursor: "pointer", transition: "all .15s" }}>
              + Add to Collection
            </button>
            <button onClick={() => onCreateAlert?.()} style={{ flex: 1, padding: "10px 0", borderRadius: 6, border: "1px solid rgba(45,212,191,.15)", background: "rgba(45,212,191,.02)", color: "#2DD4BF", fontSize: 12, fontWeight: 600, fontFamily: "var(--m)", cursor: "pointer", transition: "all .15s" }}>
              + Create Alert
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Empty State ───
function EmptyState() {
  return (
    <div style={{ padding: "100px 0", textAlign: "center", animation: "fi .5s ease both" }}>
      <div style={{ position: "relative", display: "inline-block", marginBottom: 32, width: 100, height: 100 }}>
        <div style={{ position: "absolute", inset: 10, borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,255,255,.04), rgba(167,139,250,.02))", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 32, filter: "saturate(0) brightness(1.2)", animation: "float 3s ease-in-out infinite" }}>⌕</span>
        </div>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(255,255,255,.08)", animation: "ring-rotate 8s linear infinite" }}>
          <div style={{ position: "absolute", top: -3, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: "#2DD4BF" }} />
        </div>
        <div style={{ position: "absolute", inset: -5, borderRadius: "50%", border: "1px dashed rgba(167,139,250,.1)", animation: "ring-rotate 12s linear infinite reverse" }} />
      </div>

      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--m)", color: "var(--t1)", marginBottom: 10, letterSpacing: "-.02em" }}>
        Screening the AI ecosystem
      </div>
      <div style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.7, maxWidth: 460, margin: "0 auto 32px" }}>
        Our intelligence engine monitors 11 sources across the internet for new AI products, agents, models, and tools. Discoveries appear here in real-time.
      </div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 20px", borderRadius: 6, background: "var(--s1)", border: "1px solid var(--b1)" }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2DD4BF", animation: "lp 2s ease-in-out infinite" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--m)" }}>Intelligence engine active — awaiting first screening cycle</span>
      </div>
    </div>
  );
}
