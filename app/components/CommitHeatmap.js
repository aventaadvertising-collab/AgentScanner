"use client";
import { useState, useEffect, useRef, useMemo } from "react";

// ============================================================
// COMMIT ACTIVITY HEATMAP
// GitHub-style 52-week commit activity grid with live updates
// ============================================================

const CELL = 10;
const GAP = 2;
const ROWS = 7;
const COLS = 53;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Teal color scale matching app theme
const LEVELS = [
  "rgba(255,255,255,.03)",    // 0 commits
  "rgba(45,212,191,.15)",     // low
  "rgba(45,212,191,.35)",     // medium
  "rgba(45,212,191,.55)",     // high
  "rgba(45,212,191,.85)",     // very high
];

function getLevel(count, max) {
  if (!count) return 0;
  if (max <= 0) return 1;
  const pct = count / max;
  if (pct > 0.75) return 4;
  if (pct > 0.5) return 3;
  if (pct > 0.25) return 2;
  return 1;
}

function formatDate(ts, dayIdx) {
  const d = new Date(ts * 1000);
  d.setDate(d.getDate() + dayIdx);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getMostActiveDay(weeks) {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  for (const w of weeks) {
    for (let i = 0; i < 7; i++) totals[i] += (w.d?.[i] || 0);
  }
  const maxIdx = totals.indexOf(Math.max(...totals));
  return DAYS[maxIdx];
}

function getTrend(weeks) {
  if (weeks.length < 8) return null;
  const recent = weeks.slice(-4).reduce((s, w) => s + w.t, 0);
  const prev = weeks.slice(-8, -4).reduce((s, w) => s + w.t, 0);
  if (prev === 0 && recent === 0) return null;
  if (prev === 0) return { dir: "up", pct: 100 };
  const change = Math.round(((recent - prev) / prev) * 100);
  return { dir: change >= 0 ? "up" : "down", pct: Math.abs(change) };
}

// ────────────────────────────────────────────
// Full 52-week heatmap grid
// ────────────────────────────────────────────
export function CommitHeatmap({ weeks, fetchedAt }) {
  const [tooltip, setTooltip] = useState(null);
  const [tick, setTick] = useState(0);
  const svgRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  // Flatten weeks into per-day data
  const { cells, maxCommits, totalCommits, avgPerWeek, monthLabels } = useMemo(() => {
    if (!weeks || !weeks.length) return { cells: [], maxCommits: 0, totalCommits: 0, avgPerWeek: 0, monthLabels: [] };

    const allCells = [];
    let max = 0;
    let total = 0;
    const mLabels = [];
    let lastMonth = -1;

    for (let col = 0; col < weeks.length && col < COLS; col++) {
      const w = weeks[col];
      for (let row = 0; row < ROWS; row++) {
        const count = w.d?.[row] || 0;
        if (count > max) max = count;
        total += count;
        allCells.push({
          col,
          row,
          count,
          weekTs: w.w,
          dayIdx: row,
        });
      }
      // Month labels
      const d = new Date(w.w * 1000);
      const m = d.getMonth();
      if (m !== lastMonth) {
        mLabels.push({ col, label: MONTHS[m] });
        lastMonth = m;
      }
    }

    return {
      cells: allCells,
      maxCommits: max,
      totalCommits: total,
      avgPerWeek: weeks.length > 0 ? Math.round(total / weeks.length) : 0,
      monthLabels: mLabels,
    };
  }, [weeks]);

  const mostActive = weeks?.length ? getMostActiveDay(weeks) : null;
  const trend = weeks?.length ? getTrend(weeks) : null;

  // Check if today's cell
  const todayTs = Math.floor(Date.now() / 1000);
  const todayDay = new Date().getDay(); // 0=Sun

  // SVG dimensions
  const labelLeft = 26;
  const labelTop = 14;
  const svgW = labelLeft + COLS * (CELL + GAP) + 4;
  const svgH = labelTop + ROWS * (CELL + GAP) + 4;

  // Relative time for "last updated"
  const updatedAgo = fetchedAt ? (() => {
    const secs = Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 1000);
    if (secs < 60) return "just now";
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  })() : null;

  // Force re-render for relative time
  void tick;

  if (!weeks || !weeks.length) return null;

  return (
    <div style={{ position: "relative" }}>
      {/* Header with LIVE badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2DD4BF", animation: "lp 2s ease-in-out infinite", display: "inline-block" }} />
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", color: "var(--t3)", fontFamily: "var(--m)", textTransform: "uppercase" }}>Live</span>
        </div>
        {updatedAgo && (
          <span style={{ fontSize: 9, color: "var(--t4)", fontFamily: "var(--m)" }}>
            Updated {updatedAgo}
          </span>
        )}
      </div>

      {/* SVG Grid */}
      <div style={{ overflowX: "auto", overflowY: "hidden" }}>
        <svg
          ref={svgRef}
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ display: "block" }}
        >
          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={labelLeft + m.col * (CELL + GAP)}
              y={10}
              fill="var(--t4)"
              fontSize="8"
              fontFamily="var(--m)"
            >
              {m.label}
            </text>
          ))}

          {/* Day labels */}
          {[1, 3, 5].map(row => (
            <text
              key={row}
              x={0}
              y={labelTop + row * (CELL + GAP) + CELL - 2}
              fill="var(--t4)"
              fontSize="8"
              fontFamily="var(--m)"
            >
              {DAYS[row].slice(0, 3)}
            </text>
          ))}

          {/* Cells */}
          {cells.map((cell, i) => {
            const x = labelLeft + cell.col * (CELL + GAP);
            const y = labelTop + cell.row * (CELL + GAP);
            const level = getLevel(cell.count, maxCommits);
            const isToday = cell.col === weeks.length - 1 && cell.dayIdx === todayDay;

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={LEVELS[level]}
                  stroke={isToday ? "rgba(45,212,191,.6)" : "none"}
                  strokeWidth={isToday ? 1 : 0}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setTooltip({
                    x: x + CELL / 2,
                    y,
                    text: `${cell.count} commit${cell.count !== 1 ? "s" : ""} on ${formatDate(cell.weekTs, cell.dayIdx)}`,
                  })}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {isToday && (
                    <animate
                      attributeName="stroke-opacity"
                      values="0.3;1;0.3"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  )}
                </rect>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "absolute",
          left: tooltip.x,
          top: tooltip.y - 28,
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,.9)",
          color: "#fff",
          fontSize: 10,
          padding: "3px 8px",
          borderRadius: 4,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          fontFamily: "var(--m)",
          zIndex: 10,
        }}>
          {tooltip.text}
        </div>
      )}

      {/* Summary stats */}
      <div style={{
        display: "flex",
        gap: 16,
        marginTop: 8,
        flexWrap: "wrap",
      }}>
        <Stat label="Total" value={totalCommits.toLocaleString()} />
        <Stat label="Avg/wk" value={avgPerWeek.toLocaleString()} />
        {mostActive && <Stat label="Peak day" value={mostActive} />}
        {trend && (
          <Stat
            label="4wk trend"
            value={`${trend.dir === "up" ? "↑" : "↓"} ${trend.pct}%`}
            color={trend.dir === "up" ? "var(--up)" : "var(--dn)"}
          />
        )}
        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginLeft: "auto" }}>
          <span style={{ fontSize: 9, color: "var(--t4)", fontFamily: "var(--m)", marginRight: 2 }}>Less</span>
          {LEVELS.map((c, i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: 1.5, background: c, display: "inline-block" }} />
          ))}
          <span style={{ fontSize: 9, color: "var(--t4)", fontFamily: "var(--m)", marginLeft: 2 }}>More</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span style={{ fontSize: 9, color: "var(--t4)", fontFamily: "var(--m)", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: color || "var(--t1)", fontFamily: "var(--m)" }}>{value}</span>
    </div>
  );
}

// ────────────────────────────────────────────
// Compact 12-week inline mini heatmap
// ────────────────────────────────────────────
export function CompactHeatmap({ weeks, w = 150, h = 40 }) {
  if (!weeks || weeks.length < 12) return null;

  const recent = weeks.slice(-12);
  const maxC = Math.max(...recent.flatMap(wk => wk.d || []), 1);
  const cellW = Math.floor((w - 2) / 12);
  const cellH = Math.floor((h - 2) / 7);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {recent.map((wk, col) =>
        (wk.d || []).map((count, row) => (
          <rect
            key={`${col}-${row}`}
            x={1 + col * cellW}
            y={1 + row * cellH}
            width={Math.max(cellW - 1, 1)}
            height={Math.max(cellH - 1, 1)}
            rx={1}
            fill={LEVELS[getLevel(count, maxC)]}
          />
        ))
      )}
    </svg>
  );
}

// ────────────────────────────────────────────
// Data-fetching loader wrapper with polling
// ────────────────────────────────────────────
export function CommitHeatmapLoader({ productId, repo, commitActivity }) {
  const [data, setData] = useState(commitActivity ? { weeks: commitActivity } : null);
  const [loading, setLoading] = useState(!commitActivity);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(null);

  // Fetch from API
  const doFetch = async () => {
    let url = "/api/commit-activity?";
    if (productId) url += `product_id=${encodeURIComponent(productId)}`;
    else if (repo) url += `repo=${encodeURIComponent(repo)}`;
    else return;

    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const d = await res.json();
      if (d.weeks) {
        setData({ weeks: d.weeks });
        setFetchedAt(d.fetched_at);
        setLoading(false);

        // Flash on update (but not initial load)
        if (prevRef.current && JSON.stringify(prevRef.current) !== JSON.stringify(d.weeks)) {
          setFlash(true);
          setTimeout(() => setFlash(false), 800);
        }
        prevRef.current = d.weeks;
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  // If commitActivity prop is passed (dashboard real-time), use it directly
  useEffect(() => {
    if (commitActivity) {
      // Check for updates from real-time subscription
      if (prevRef.current && JSON.stringify(prevRef.current) !== JSON.stringify(commitActivity)) {
        setFlash(true);
        setTimeout(() => setFlash(false), 800);
      }
      setData({ weeks: commitActivity });
      setLoading(false);
      prevRef.current = commitActivity;
    }
  }, [commitActivity]);

  // Fetch on mount + poll every 60s (only if no prop-based data)
  useEffect(() => {
    if (commitActivity) return; // Data comes from prop, no need to fetch
    doFetch();
    const interval = setInterval(doFetch, 60_000);
    return () => clearInterval(interval);
  }, [productId, repo]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{
        height: 120,
        borderRadius: 8,
        background: "rgba(255,255,255,.02)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: "60%",
          height: 4,
          borderRadius: 2,
          background: "rgba(255,255,255,.04)",
          overflow: "hidden",
          position: "relative",
        }}>
          <div style={{
            width: "30%",
            height: "100%",
            borderRadius: 2,
            background: "rgba(45,212,191,.3)",
            position: "absolute",
            animation: "scan 1.5s ease-in-out infinite",
          }} />
        </div>
      </div>
    );
  }

  if (!data?.weeks) {
    return (
      <div style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--t4)",
        fontSize: 11,
        fontFamily: "var(--m)",
      }}>
        No commit data available
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 8,
      border: flash ? "1px solid rgba(45,212,191,.4)" : "1px solid transparent",
      transition: "border-color 0.3s ease",
      padding: 2,
    }}>
      <CommitHeatmap weeks={data.weeks} fetchedAt={fetchedAt} />
    </div>
  );
}
