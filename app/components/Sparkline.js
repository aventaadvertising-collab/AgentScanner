"use client";

/**
 * Sparkline — tiny inline SVG line chart
 * @param {number[]} data — array of values
 * @param {number} width — SVG width (default 80)
 * @param {number} height — SVG height (default 24)
 * @param {string} color — stroke color (default --g / #2DD4BF)
 * @param {boolean} showDot — show dot at last point
 * @param {boolean} showArea — show filled area under line
 */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = "#2DD4BF",
  showDot = true,
  showArea = false,
}) {
  if (!data || data.length < 2) return null;

  const padY = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - padY - ((v - min) / range) * (height - padY * 2);
    return [x, y];
  });

  const polyline = points.map(([x, y]) => `${x},${y}`).join(" ");
  const [lastX, lastY] = points[points.length - 1];

  // Trend color: compare last vs first value
  const trend = data[data.length - 1] - data[0];
  const effectiveColor = color === "auto"
    ? (trend >= 0 ? "#00C853" : "#FF1744")
    : color;

  // Area fill path
  let areaPath = "";
  if (showArea) {
    areaPath = `M${points[0][0]},${height} ` +
      points.map(([x, y]) => `L${x},${y}`).join(" ") +
      ` L${lastX},${height} Z`;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", overflow: "visible" }}
    >
      {showArea && (
        <path d={areaPath} fill={effectiveColor} opacity="0.1" />
      )}
      <polyline
        points={polyline}
        fill="none"
        stroke={effectiveColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot && (
        <circle cx={lastX} cy={lastY} r="2" fill={effectiveColor} />
      )}
    </svg>
  );
}

/**
 * GrowthBadge — shows a colored percentage with arrow
 * @param {number} pct — percentage change
 * @param {string} period — time period label (e.g. "7d", "24h")
 */
export function GrowthBadge({ pct, period = "7d" }) {
  if (pct == null || isNaN(pct)) return null;

  const isUp = pct >= 0;
  const color = isUp ? "#00C853" : "#FF1744";
  const arrow = isUp ? "\u2191" : "\u2193"; // ↑ or ↓

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "var(--m)",
        color,
        letterSpacing: ".02em",
        whiteSpace: "nowrap",
      }}
    >
      {arrow}{Math.abs(pct).toFixed(pct > 100 ? 0 : 1)}%
      <span style={{ color: "var(--t3, #64748B)", fontWeight: 500, fontSize: 9 }}>
        {period}
      </span>
    </span>
  );
}

/**
 * VelocityBadge — shows "+N today" style absolute change
 * @param {number} delta — absolute change value
 * @param {string} label — label text (e.g. "today", "7d")
 * @param {string} icon — prefix icon (e.g. "★", "↓")
 */
export function VelocityBadge({ delta, label = "today", icon = "" }) {
  if (!delta || delta <= 0) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        fontSize: 10,
        fontWeight: 600,
        fontFamily: "var(--m)",
        color: "#00C853",
        whiteSpace: "nowrap",
      }}
    >
      {icon}+{formatDelta(delta)}
      <span style={{ color: "var(--t3, #64748B)", fontWeight: 500, fontSize: 9 }}>
        {label}
      </span>
    </span>
  );
}

function formatDelta(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}
