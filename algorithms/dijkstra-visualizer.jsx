import { useState, useCallback, useRef, useEffect } from "react";

// ─── Graph ───────────────────────────────────────
// Same 6-node layout as BFS/DFS, with edge weights added.
const GRAPH = {
  A: [["B", 4], ["C", 2]],
  B: [["A", 4], ["D", 5], ["E", 1]],
  C: [["A", 2], ["F", 6]],
  D: [["B", 5]],
  E: [["B", 1], ["F", 1]],
  F: [["C", 6], ["E", 1]],
};

const NODE_POSITIONS = {
  A: { x: 200, y: 60 },
  B: { x: 80, y: 180 },
  C: { x: 320, y: 180 },
  D: { x: 30, y: 320 },
  E: { x: 170, y: 320 },
  F: { x: 320, y: 320 },
};

// Each edge: [a, b, weight]
const EDGES = [
  ["A", "B", 4], ["A", "C", 2], ["B", "D", 5],
  ["B", "E", 1], ["C", "F", 6], ["E", "F", 1],
];

const START = "A";

// ─── Pseudocode ──────────────────────────────────
const PSEUDOCODE = [
  { id: 0, indent: 0, text: "Dijkstra(graph, start):" },
  { id: 1, indent: 1, text: "dist[start] ← 0" },
  { id: 2, indent: 1, text: "dist[v] ← ∞ for v ≠ start" },
  { id: 3, indent: 1, text: "prev[v] ← null for all v" },
  { id: 4, indent: 1, text: "pq ← priority queue, push (0, start)" },
  { id: 5, indent: 1, text: "settled ← {}" },
  { id: 6, indent: 1, text: "" },
  { id: 7, indent: 1, text: "while pq is not empty:" },
  { id: 8, indent: 2, text: "(d, u) ← pq.pop_min()" },
  { id: 9, indent: 2, text: "if u in settled: continue" },
  { id: 10, indent: 2, text: "settled.add(u)" },
  { id: 11, indent: 2, text: "" },
  { id: 12, indent: 2, text: "for (v, w) in graph[u]:" },
  { id: 13, indent: 3, text: "if v in settled: continue" },
  { id: 14, indent: 3, text: "if dist[u] + w < dist[v]:" },
  { id: 15, indent: 4, text: "dist[v] ← dist[u] + w" },
  { id: 16, indent: 4, text: "prev[v] ← u" },
  { id: 17, indent: 4, text: "pq.push((dist[v], v))" },
  { id: 18, indent: 1, text: "" },
  { id: 19, indent: 1, text: "return dist, prev" },
];

const INF = Infinity;

// ─── Step generator ──────────────────────────────
function generateDijkstraSteps(graph, start) {
  const steps = [];
  const nodes = Object.keys(graph);
  const dist = {};
  const prev = {};
  for (const n of nodes) { dist[n] = INF; prev[n] = null; }
  const settled = new Set();
  let pq = []; // array of [d, node], we'll sort and shift to simulate min-heap

  const cloneState = () => ({
    dist: { ...dist },
    prev: { ...prev },
    settled: new Set(settled),
    pq: pq.map(([d, n]) => [d, n]),
  });

  steps.push({
    ...cloneState(),
    currentNode: null, currentNeighbor: null,
    processingEdge: null, relaxed: null,
    description: `Initialize: dist[${start}] = 0, others = ∞, push (0, ${start}) into priority queue`,
    highlightLines: [0, 1, 2, 3, 4, 5],
    phase: "init",
  });

  dist[start] = 0;
  pq.push([0, start]);
  pq.sort((a, b) => a[0] - b[0]);

  steps.push({
    ...cloneState(),
    currentNode: null, currentNeighbor: null,
    processingEdge: null, relaxed: null,
    description: `Setup complete. dist = { ${start}: 0, … : ∞ }, pq = [(0, ${start})]`,
    highlightLines: [],
    phase: "init",
  });

  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift();

    steps.push({
      ...cloneState(),
      currentNode: u, currentNeighbor: null,
      processingEdge: null, relaxed: null,
      description: `Pop min from pq: (${d}, ${u})`,
      highlightLines: [7, 8],
      phase: "pop",
    });

    if (settled.has(u)) {
      steps.push({
        ...cloneState(),
        currentNode: u, currentNeighbor: null,
        processingEdge: null, relaxed: null,
        description: `${u} already settled (was reached with a better distance) → skip`,
        highlightLines: [9],
        phase: "skip-settled",
      });
      continue;
    }

    settled.add(u);
    steps.push({
      ...cloneState(),
      currentNode: u, currentNeighbor: null,
      processingEdge: null, relaxed: null,
      description: `Settle ${u} with distance ${d}. Its shortest distance is now final.`,
      highlightLines: [10],
      phase: "settle",
    });

    const neighbors = graph[u] || [];
    for (const [v, w] of neighbors) {
      if (settled.has(v)) {
        steps.push({
          ...cloneState(),
          currentNode: u, currentNeighbor: v,
          processingEdge: [u, v], relaxed: null,
          description: `Neighbor ${v} already settled → skip`,
          highlightLines: [12, 13],
          phase: "skip-neighbor-settled",
        });
        continue;
      }

      const newDist = dist[u] + w;
      const oldDist = dist[v];
      const improves = newDist < oldDist;

      steps.push({
        ...cloneState(),
        currentNode: u, currentNeighbor: v,
        processingEdge: [u, v], relaxed: null,
        description: `Examine edge ${u}—${v} (weight ${w}). Tentative: dist[${u}] + ${w} = ${newDist}. Current dist[${v}] = ${oldDist === INF ? "∞" : oldDist}.`,
        highlightLines: [12, 14],
        phase: "examine",
      });

      if (improves) {
        dist[v] = newDist;
        prev[v] = u;
        pq.push([newDist, v]);
        pq.sort((a, b) => a[0] - b[0]);

        steps.push({
          ...cloneState(),
          currentNode: u, currentNeighbor: v,
          processingEdge: [u, v], relaxed: true,
          description: `Relax! ${newDist} < ${oldDist === INF ? "∞" : oldDist} → dist[${v}] = ${newDist}, prev[${v}] = ${u}, push (${newDist}, ${v})`,
          highlightLines: [14, 15, 16, 17],
          phase: "relax",
        });
      } else {
        steps.push({
          ...cloneState(),
          currentNode: u, currentNeighbor: v,
          processingEdge: [u, v], relaxed: false,
          description: `${newDist} ≥ ${oldDist === INF ? "∞" : oldDist} → no improvement, leave dist[${v}] alone`,
          highlightLines: [14],
          phase: "no-relax",
        });
      }
    }
  }

  steps.push({
    ...cloneState(),
    currentNode: null, currentNeighbor: null,
    processingEdge: null, relaxed: null,
    description: `Done! Shortest distances from ${start}: ${nodes.map(n => `${n}=${dist[n]}`).join(", ")}`,
    highlightLines: [19],
    phase: "done",
  });

  return steps;
}

const allSteps = generateDijkstraSteps(GRAPH, START);

// ─── Colors ──────────────────────────────────────
const colors = {
  bg: "#0f1117",
  surface: "#181b24",
  surfaceAlt: "#1e2230",
  border: "#2a2e3d",
  text: "#e2e4ea",
  textDim: "#7a7f91",
  accent: "#22d3ee",                 // cyan
  accentSoft: "rgba(34,211,238,0.13)",
  highlight: "#f4c753",
  highlightSoft: "rgba(244,199,83,0.10)",
  current: "#e06c75",
  currentSoft: "rgba(224,108,117,0.18)",
  neighbor: "#f4c753",
  neighborSoft: "rgba(244,199,83,0.16)",
  inPQ: "#a78bfa",
  inPQSoft: "rgba(167,139,250,0.18)",
  settled: "#56d4a0",
  settledSoft: "rgba(86,212,160,0.18)",
  relaxYes: "#56d4a0",
  relaxNo: "#7a7f91",
  edge: "#3a3f52",
  edgeActive: "#f4c753",
  edgeRelax: "#56d4a0",
  edgeTree: "#22d3ee",
};

export default function DijkstraVisualizer() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1100);
  const timerRef = useRef(null);
  const cur = allSteps[step];

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setStep((s) => {
          if (s >= allSteps.length - 1) { setIsPlaying(false); return s; }
          return s + 1;
        });
      }, speed);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, speed]);

  const reset = useCallback(() => { setIsPlaying(false); setStep(0); }, []);

  const inPQ = (n) => cur.pq.some(([, x]) => x === n);

  const nodeStrokeColor = (n) => {
    if (cur.currentNode === n) return colors.current;
    if (cur.currentNeighbor === n) return colors.neighbor;
    if (cur.settled.has(n)) return colors.settled;
    if (inPQ(n)) return colors.inPQ;
    return colors.textDim;
  };

  const nodeFillColor = (n) => {
    if (cur.currentNode === n) return colors.currentSoft;
    if (cur.currentNeighbor === n) return colors.neighborSoft;
    if (cur.settled.has(n)) return colors.settledSoft;
    if (inPQ(n)) return colors.inPQSoft;
    return "transparent";
  };

  const isProcessingEdge = (a, b) => {
    if (!cur.processingEdge) return false;
    const [x, y] = cur.processingEdge;
    return (x === a && y === b) || (x === b && y === a);
  };

  // After completion, edges that are on the shortest-path tree (prev[v] = u or vice versa).
  const isTreeEdge = (a, b) => {
    if (cur.phase !== "done") return false;
    return cur.prev[a] === b || cur.prev[b] === a;
  };

  const edgeColor = (a, b) => {
    if (isProcessingEdge(a, b)) {
      return cur.relaxed === true ? colors.edgeRelax
           : cur.relaxed === false ? colors.relaxNo
           : colors.edgeActive;
    }
    if (isTreeEdge(a, b)) return colors.edgeTree;
    // Settled tree edges (predecessor links shown progressively)
    if (cur.prev[a] === b || cur.prev[b] === a) {
      const settledEdge = cur.settled.has(a) && cur.settled.has(b);
      if (settledEdge) return colors.edgeTree + "aa";
    }
    return colors.edge;
  };

  const edgeWidth = (a, b) => {
    if (isProcessingEdge(a, b)) return 2.6;
    if (isTreeEdge(a, b)) return 2.4;
    if ((cur.prev[a] === b || cur.prev[b] === a) &&
        cur.settled.has(a) && cur.settled.has(b)) return 2.0;
    return 1.2;
  };

  const fmt = (d) => d === INF ? "∞" : String(d);

  return (
    <div style={{
      minHeight: "100vh", background: colors.bg, color: colors.text,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      padding: "24px 20px", boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: colors.accent,
          margin: 0, letterSpacing: "0.04em",
        }}>
          Dijkstra — Shortest Paths
        </h1>
        <p style={{ color: colors.textDim, fontSize: 12, margin: "6px 0 0" }}>
          Single-source shortest path on a weighted graph · Greedy with priority queue
        </p>
        <div style={{
          marginTop: 12, fontSize: 12, color: colors.textDim,
        }}>
          Source: <span style={{ color: colors.accent, fontWeight: 600 }}>{START}</span>
        </div>
      </div>

      {/* Main layout */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18,
        maxWidth: 980, margin: "0 auto",
      }}>
        {/* LEFT: Pseudocode */}
        <div style={{
          background: colors.surface, border: `1px solid ${colors.border}`,
          borderRadius: 10, padding: "16px 0", overflow: "hidden",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: colors.textDim,
            padding: "0 16px 10px", borderBottom: `1px solid ${colors.border}`,
            marginBottom: 6,
          }}>Pseudocode</div>
          <div style={{ padding: "0 6px" }}>
            {PSEUDOCODE.map((line) => {
              const isHL = cur.highlightLines.includes(line.id);
              return (
                <div key={line.id} style={{
                  display: "flex", alignItems: "center", padding: "2px 8px",
                  borderRadius: 4,
                  background: isHL ? colors.highlightSoft : "transparent",
                  borderLeft: isHL ? `3px solid ${colors.highlight}` : "3px solid transparent",
                  transition: "all 0.2s", minHeight: line.text ? 24 : 8,
                }}>
                  <span style={{
                    color: colors.textDim, fontSize: 9, width: 20,
                    textAlign: "right", marginRight: 8, opacity: 0.45, flexShrink: 0,
                  }}>{line.text ? line.id : ""}</span>
                  <span style={{
                    paddingLeft: line.indent * 16, fontSize: 12,
                    color: isHL ? colors.highlight : colors.text,
                    fontWeight: isHL ? 600 : 400, transition: "color 0.2s",
                    whiteSpace: "nowrap",
                  }}>{line.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Graph */}
        <div style={{
          background: colors.surface, border: `1px solid ${colors.border}`,
          borderRadius: 10, padding: 16, display: "flex", flexDirection: "column",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: colors.textDim,
            paddingBottom: 10, borderBottom: `1px solid ${colors.border}`,
            marginBottom: 10,
          }}>Weighted Graph</div>

          <svg viewBox="-10 10 420 360" style={{ width: "100%", flex: 1 }}>
            {/* Edges */}
            {EDGES.map(([a, b, w]) => {
              const pa = NODE_POSITIONS[a];
              const pb = NODE_POSITIONS[b];
              const mx = (pa.x + pb.x) / 2;
              const my = (pa.y + pb.y) / 2;
              return (
                <g key={`${a}-${b}`}>
                  <line
                    x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke={edgeColor(a, b)}
                    strokeWidth={edgeWidth(a, b)}
                    style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
                  />
                  {/* Weight label */}
                  <g transform={`translate(${mx}, ${my})`}>
                    <rect x={-12} y={-10} width={24} height={20} rx={4}
                      fill={colors.bg} stroke={colors.border} strokeWidth={1} />
                    <text x={0} y={1} textAnchor="middle" dominantBaseline="central"
                      fill={isProcessingEdge(a, b) ? colors.highlight : colors.text}
                      fontSize={11} fontWeight={700}
                      fontFamily="'JetBrains Mono', monospace">{w}</text>
                  </g>
                </g>
              );
            })}
            {/* Nodes */}
            {Object.entries(NODE_POSITIONS).map(([n, pos]) => (
              <g key={n}>
                <circle cx={pos.x} cy={pos.y} r={26}
                  fill={nodeFillColor(n)}
                  stroke={nodeStrokeColor(n)}
                  strokeWidth={cur.currentNode === n ? 2.5 : 1.5}
                  style={{ transition: "all 0.3s ease" }} />
                <text x={pos.x} y={pos.y - 3} textAnchor="middle" dominantBaseline="central"
                  fill={nodeStrokeColor(n)} fontSize={15} fontWeight={700}
                  fontFamily="'JetBrains Mono', monospace"
                  style={{ transition: "fill 0.3s" }}>{n}</text>
                <text x={pos.x} y={pos.y + 11} textAnchor="middle" dominantBaseline="central"
                  fill={cur.dist[n] === INF ? colors.textDim : colors.accent}
                  fontSize={10} fontWeight={700}
                  fontFamily="'JetBrains Mono', monospace">
                  {fmt(cur.dist[n])}
                </text>
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div style={{
            display: "flex", gap: 12, flexWrap: "wrap",
            marginTop: 6, paddingTop: 10, borderTop: `1px solid ${colors.border}`,
          }}>
            {[
              { label: "Current", color: colors.current },
              { label: "Neighbor", color: colors.neighbor },
              { label: "In PQ", color: colors.inPQ },
              { label: "Settled", color: colors.settled },
              { label: "Tree edge", color: colors.edgeTree },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
                <span style={{ fontSize: 10, color: colors.textDim }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* State Panels */}
      <div style={{
        maxWidth: 980, margin: "16px auto 0",
        display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14,
      }}>
        {/* Distance + prev table */}
        <div style={{
          background: colors.surface, border: `1px solid ${colors.border}`,
          borderRadius: 8, padding: "12px 14px",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.1em", color: colors.textDim, marginBottom: 8,
          }}>Distances & Predecessors</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
            {Object.keys(GRAPH).map((n) => {
              const isSettled = cur.settled.has(n);
              const isCurrent = cur.currentNode === n;
              const isNeighbor = cur.currentNeighbor === n;
              const accent = isCurrent ? colors.current
                          : isNeighbor ? colors.neighbor
                          : isSettled ? colors.settled
                          : inPQ(n) ? colors.inPQ
                          : colors.textDim;
              return (
                <div key={n} style={{
                  background: colors.surfaceAlt,
                  border: `1px solid ${accent}55`,
                  borderRadius: 6, padding: "6px 4px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: accent }}>{n}</div>
                  <div style={{ fontSize: 13, fontWeight: 700,
                    color: cur.dist[n] === INF ? colors.textDim : colors.accent,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>{fmt(cur.dist[n])}</div>
                  <div style={{ fontSize: 9, color: colors.textDim, marginTop: 2 }}>
                    via {cur.prev[n] || "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Queue */}
        <div style={{
          background: colors.surface, border: `1px solid ${colors.border}`,
          borderRadius: 8, padding: "12px 14px",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.1em", color: colors.textDim, marginBottom: 8,
          }}>Priority Queue (min)</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 28 }}>
            {cur.pq.length === 0 ? (
              <span style={{ fontSize: 12, color: colors.textDim, opacity: 0.5 }}>empty</span>
            ) : (
              [...cur.pq].sort((a, b) => a[0] - b[0]).map(([d, n], i) => (
                <span key={`${n}-${i}`} style={{
                  background: i === 0 ? colors.accentSoft : colors.inPQSoft,
                  color: i === 0 ? colors.accent : colors.inPQ,
                  border: `1px solid ${(i === 0 ? colors.accent : colors.inPQ)}55`,
                  borderRadius: 5, padding: "3px 8px", fontSize: 12, fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>({d}, {n})</span>
              ))
            )}
          </div>
        </div>

        {/* Settled */}
        <div style={{
          background: colors.surface, border: `1px solid ${colors.border}`,
          borderRadius: 8, padding: "12px 14px",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.1em", color: colors.textDim, marginBottom: 8,
          }}>Settled</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 28 }}>
            {cur.settled.size === 0 ? (
              <span style={{ fontSize: 12, color: colors.textDim, opacity: 0.5 }}>empty</span>
            ) : (
              [...cur.settled].map((n) => (
                <span key={n} style={{
                  background: colors.settledSoft, color: colors.settled,
                  border: `1px solid ${colors.settled}55`,
                  borderRadius: 5, padding: "3px 10px", fontSize: 13, fontWeight: 600,
                }}>{n}</span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{
        maxWidth: 980, margin: "14px auto 0",
        background: colors.surfaceAlt, border: `1px solid ${colors.border}`,
        borderRadius: 8, padding: "12px 16px", fontSize: 13, color: colors.text,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{
          background: colors.accentSoft, color: colors.accent,
          borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700, flexShrink: 0,
        }}>STEP {step + 1}/{allSteps.length}</span>
        <span>{cur.description}</span>
      </div>

      {/* Controls */}
      <div style={{
        maxWidth: 980, margin: "14px auto 0",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      }}>
        <button onClick={reset} style={{
          background: colors.surfaceAlt, color: colors.textDim,
          border: `1px solid ${colors.border}`, borderRadius: 6,
          padding: "8px 16px", fontSize: 12, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>↺ Reset</button>
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          style={{
            background: colors.surfaceAlt,
            color: step === 0 ? colors.textDim + "44" : colors.text,
            border: `1px solid ${colors.border}`, borderRadius: 6,
            padding: "8px 14px", fontSize: 13,
            cursor: step === 0 ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}>◀</button>
        <button onClick={() => setIsPlaying(!isPlaying)} style={{
          background: isPlaying ? colors.currentSoft : colors.accentSoft,
          color: isPlaying ? colors.current : colors.accent,
          border: `1px solid ${isPlaying ? colors.current + "44" : colors.accent + "44"}`,
          borderRadius: 8, padding: "8px 28px", fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em",
        }}>{isPlaying ? "⏸ Pause" : "▶ Play"}</button>
        <button onClick={() => setStep((s) => Math.min(allSteps.length - 1, s + 1))}
          disabled={step === allSteps.length - 1}
          style={{
            background: colors.surfaceAlt,
            color: step === allSteps.length - 1 ? colors.textDim + "44" : colors.text,
            border: `1px solid ${colors.border}`, borderRadius: 6,
            padding: "8px 14px", fontSize: 13,
            cursor: step === allSteps.length - 1 ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}>▶</button>
        <div style={{ marginLeft: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: colors.textDim }}>Speed:</span>
          {[{ l: "0.5×", v: 2200 }, { l: "1×", v: 1100 }, { l: "2×", v: 550 }].map(({ l, v }) => (
            <button key={l} onClick={() => setSpeed(v)} style={{
              background: speed === v ? colors.accentSoft : "transparent",
              color: speed === v ? colors.accent : colors.textDim,
              border: `1px solid ${speed === v ? colors.accent + "44" : colors.border}`,
              borderRadius: 4, padding: "4px 10px", fontSize: 11,
              cursor: "pointer", fontFamily: "inherit",
              fontWeight: speed === v ? 600 : 400,
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Scrubber */}
      <div style={{ maxWidth: 980, margin: "14px auto 0", padding: "0 4px" }}>
        <input type="range" min={0} max={allSteps.length - 1} value={step}
          onChange={(e) => { setIsPlaying(false); setStep(Number(e.target.value)); }}
          style={{ width: "100%", accentColor: colors.accent, cursor: "pointer" }}
        />
      </div>

      {/* Why Dijkstra footer */}
      <div style={{
        maxWidth: 980, margin: "20px auto 0",
        background: colors.surfaceAlt, border: `1px solid ${colors.border}`,
        borderRadius: 8, padding: "14px 18px",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: colors.accent, marginBottom: 6,
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>Why Dijkstra?</div>
        <div style={{ fontSize: 12, color: colors.textDim, lineHeight: 1.7 }}>
          BFS finds shortest paths only when edges are <em>unweighted</em>.
          Dijkstra generalizes it: instead of FIFO, pop the node with the
          <span style={{ color: colors.accent, fontWeight: 600 }}> smallest tentative distance</span>.
          Each pop yields a node whose shortest distance is now final — that's
          the <span style={{ color: colors.settled, fontWeight: 600 }}>settled</span> set.
          For each neighbor, we try to <em>relax</em> the edge: if going through the
          current node is shorter, update <code>dist</code> and <code>prev</code>.
          Time: <span style={{ color: colors.accent, fontWeight: 600 }}>O((V + E) log V)</span> with
          a binary heap. Requires non-negative weights — for negatives, reach for Bellman-Ford.
        </div>
      </div>
    </div>
  );
}
