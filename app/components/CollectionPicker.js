"use client";

import { useState, useEffect, useRef } from "react";

export default function CollectionPicker({ userId, discoveryId, position, onClose }) {
  const [collections, setCollections] = useState([]);
  const [itemMap, setItemMap] = useState({}); // discovery_id → [collection_ids]
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  // Fetch collections + item map
  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetch(`/api/collections?user_id=${userId}`).then((r) => r.json()),
      fetch(`/api/collections/items?user_id=${userId}&map=1`).then((r) => r.json()),
    ]).then(([colData, mapData]) => {
      setCollections(colData.collections || []);
      setItemMap(mapData.map || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId]);

  const isInCollection = (collectionId) => {
    return (itemMap[discoveryId] || []).includes(collectionId);
  };

  const toggleItem = async (collectionId) => {
    const wasIn = isInCollection(collectionId);

    // Optimistic update
    setItemMap((prev) => {
      const next = { ...prev };
      const ids = [...(next[discoveryId] || [])];
      if (wasIn) {
        next[discoveryId] = ids.filter((id) => id !== collectionId);
      } else {
        ids.push(collectionId);
        next[discoveryId] = ids;
      }
      return next;
    });

    try {
      await fetch("/api/collections/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection_id: collectionId, discovery_id: discoveryId }),
      });
    } catch {
      // Revert on error
      setItemMap((prev) => {
        const next = { ...prev };
        const ids = [...(next[discoveryId] || [])];
        if (wasIn) {
          ids.push(collectionId);
          next[discoveryId] = ids;
        } else {
          next[discoveryId] = ids.filter((id) => id !== collectionId);
        }
        return next;
      });
    }
  };

  const createCollection = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, name: newName.trim() }),
      });
      const { collection } = await res.json();
      if (collection) {
        setCollections((prev) => [...prev, { ...collection, item_count: 0 }]);
        setNewName("");
      }
    } catch { /* silent */ }
    setCreating(false);
  };

  const style = {
    position: "absolute",
    ...(position || { top: "100%", right: 0 }),
    minWidth: 240, maxWidth: 300,
    background: "#12141C", border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 10, padding: 0, zIndex: 100,
    boxShadow: "0 12px 40px rgba(0,0,0,.5)",
    animation: "fi .15s ease",
  };

  return (
    <div ref={ref} style={style} onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid rgba(255,255,255,.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--m)", color: "rgba(242,242,247,.65)", letterSpacing: ".04em" }}>
          ADD TO COLLECTION
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(242,242,247,.35)", fontSize: 12, cursor: "pointer", padding: "2px 4px" }}>x</button>
      </div>

      {/* Collection list */}
      <div style={{ maxHeight: 220, overflowY: "auto", padding: "6px 0" }}>
        {loading ? (
          <div style={{ padding: "16px", textAlign: "center", fontSize: 11, color: "rgba(242,242,247,.35)" }}>Loading...</div>
        ) : collections.length === 0 ? (
          <div style={{ padding: "16px", textAlign: "center", fontSize: 11, color: "rgba(242,242,247,.35)" }}>No collections yet</div>
        ) : (
          collections.map((col) => {
            const active = isInCollection(col.id);
            return (
              <button
                key={col.id}
                onClick={() => toggleItem(col.id)}
                style={{
                  width: "100%", padding: "8px 14px", border: "none",
                  background: active ? "rgba(45,212,191,.04)" : "transparent",
                  color: active ? "#2DD4BF" : "rgba(242,242,247,.65)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                  transition: "background .12s",
                }}
                onMouseEnter={(e) => { if (!active) e.target.style.background = "rgba(255,255,255,.03)"; }}
                onMouseLeave={(e) => { if (!active) e.target.style.background = "transparent"; }}
              >
                <span style={{ width: 16, height: 16, borderRadius: 3, border: `1.5px solid ${active ? "#2DD4BF" : "rgba(255,255,255,.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0, transition: "all .12s", background: active ? "rgba(45,212,191,.1)" : "transparent" }}>
                  {active ? "+" : ""}
                </span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {col.icon} {col.name}
                </span>
                <span style={{ fontSize: 10, color: "rgba(242,242,247,.25)", fontFamily: "var(--m)", flexShrink: 0 }}>
                  {col.item_count || 0}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Quick-create */}
      <div style={{ padding: "8px 10px 10px", borderTop: "1px solid rgba(255,255,255,.04)", display: "flex", gap: 6 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createCollection()}
          placeholder="New collection..."
          style={{
            flex: 1, padding: "7px 10px", fontSize: 12, borderRadius: 6,
            border: "1px solid rgba(255,255,255,.08)", background: "#0A0B10",
            color: "#F2F2F7", outline: "none", fontFamily: "var(--m)",
          }}
        />
        <button
          onClick={createCollection}
          disabled={creating || !newName.trim()}
          style={{
            padding: "7px 12px", borderRadius: 6, border: "none",
            background: newName.trim() ? "#2DD4BF" : "rgba(255,255,255,.04)",
            color: newName.trim() ? "#0A0B10" : "rgba(242,242,247,.25)",
            fontSize: 11, fontWeight: 800, fontFamily: "var(--m)",
            cursor: newName.trim() ? "pointer" : "default",
            transition: "all .15s",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
