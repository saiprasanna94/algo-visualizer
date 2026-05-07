import { useState, useCallback, useRef, useEffect } from "react";

const GRAPH = {
  A: ["B", "C"],
  B: ["A", "D", "E"],
  C: ["A", "F"],
  D: ["B"],
  E: ["B", "F"],
  F: ["C", "E"],
};

const NODE_POSITIONS = {
  A: { x: 200, y: 60 },
  B: { x: 80, y: 180 },
  C: { x: 320, y: 180 },
  D: { x: 30, y: 320 },
  E: { x: 170, y: 320 },
  F: { x: 320, y: 320 },
};

const EDGES = [
  ["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["E", "F"],
];

const PSEUDOCODE = [
  { id: 0, indent: 0, text: "BFS(graph, start):" },
  { id: 1, indent: 1, text: "visited ← { start }" },
  { id: 2, indent: 1, text: "queue ← [ start ]" },
  { id: 3, indent: 1, text: "order ← []" },
  { id: 4, indent: 1, text: "" },
  { id: 5, indent: 1, text: "while queue is not empty:" },
  { id: 6, indent: 2, text: "node ← queue.dequeue()" },
  { id: 7, indent: 2, text: "order.append(node)" },
  { id: 8, indent: 2, text: "" },
  { id: 9, indent: 2, text: "for neighbor in graph[node]:" },
  { id: 10, indent: 3, text: "if neighbor not in visited:" },
  { id: 11, indent: 4, text: "visited.add(neighbor)" },
  { id: 12, indent: 4, text: "queue.enqueue(neighbor)" },
  { id: 13, indent: 1, text: "" },
  { id: 14, indent: 1, text: "return order" },
];

function generateBFSSteps(graph, start) {
  const steps = [];
  const visited = new Set();
  const queue = [];
  const order = [];

  // Initial state
  steps.push({
    highlightLines: [0],
    visited: new Set(),
    queue: [],
    order: [],
    currentNode: null,
    currentNeighbor: null,
    processingEdge: null,
    description: `Starting BFS from node ${start}`,
    phase: "init",
  });

  visited.add(start);
  queue.push(start);

  steps.push({
    highlightLines: [1, 2, 3],
    visited: new Set(visited),
    queue: [...queue],
    order: [...order],
    currentNode: null,
    currentNeighbor: null,
    processingEdge: null,
    description: `Initialize: visited = {${start}}, queue = [${start}]`,
    phase: "init",
  });

  while (queue.length > 0) {
    const node = queue.shift();

    steps.push({
      highlightLines: [5, 6],
      visited: new Set(visited),
      queue: [...queue],
      order: [...order],
      currentNode: node,
      currentNeighbor: null,
      processingEdge: null,
      description: `Dequeue "${node}" from queue`,
      phase: "dequeue",
    });

    order.push(node);

    steps.push({
      highlightLines: [7],
      visited: new Set(visited),
      queue: [...queue],
      order: [...order],
      currentNode: node,
      currentNeighbor: null,
      processingEdge: null,
      description: `Append "${node}" to traversal order`,
      phase: "append",
    });

    const neighbors = graph[node] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        steps.push({
          highlightLines: [9, 10],
          visited: new Set(visited),
          queue: [...queue],
          order: [...order],
          currentNode: node,
          currentNeighbor: neighbor,
          processingEdge: [node, neighbor],
          description: `Check neighbor "${neighbor}" of "${node}" → not visited`,
          phase: "check-unvisited",
        });

        visited.add(neighbor);
        queue.push(neighbor);

        steps.push({
          highlightLines: [11, 12],
          visited: new Set(visited),
          queue: [...queue],
          order: [...order],
          currentNode: node,
          currentNeighbor: neighbor,
          processingEdge: [node, neighbor],
          description: `Add "${neighbor}" to visited and enqueue`,
          phase: "enqueue",
        });
      } else {
        steps.push({
          highlightLines: [9, 10],
          visited: new Set(visited),
          queue: [...queue],
          order: [...order],
          currentNode: node,
          currentNeighbor: neighbor,
          processingEdge: [node, neighbor],
          description: `Check neighbor "${neighbor}" of "${node}" → already visited, skip`,
          phase: "check-visited",
        });
      }
    }
  }

  steps.push({
    highlightLines: [14],
    visited: new Set(visited),
    queue: [],
    order: [...order],
    currentNode: null,
    currentNeighbor: null,
    processingEdge: null,
    description: `BFS complete! Order: [${order.join(" → ")}]`,
    phase: "done",
  });

  return steps;
}

const allSteps = generateBFSSteps(GRAPH, "A");

// ─── Styles ──────────────────────────────────────
const colors = {
  bg: "#0f1117",
  surface: "#181b24",
  surfaceAlt: "#1e2230",
  border: "#2a2e3d",
  text: "#e2e4ea",
  textDim: "#7a7f91",
  accent: "#56d4a0",
  accentSoft: "rgba(86,212,160,0.12)",
  highlight: "#f4c753",
  highlightSoft: "rgba(244,199,83,0.10)",
  current: "#e06c75",
  currentSoft: "rgba(224,108,117,0.18)",
  queued: "#61afef",
  queuedSoft: "rgba(97,175,239,0.15)",
  visited: "#56d4a0",
  edge: "#3a3f52",
  edgeActive: "#f4c753",
};

export default function BFSVisualizer() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const timerRef = useRef(null);
  const current = allSteps[step];

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setStep(0);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setStep((s) => {
          if (s >= allSteps.length - 1) {
            setIsPlaying(false);
            return s;
          }
          return s + 1;
        });
      }, speed);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, speed]);

  const getNodeColor = (node) => {
    if (current.currentNode === node) return colors.current;
    if (current.currentNeighbor === node) return colors.highlight;
    if (current.queue.includes(node)) return colors.queued;
    if (current.visited.has(node)) return colors.visited;
    return colors.textDim;
  };

  const getNodeBg = (node) => {
    if (current.currentNode === node) return colors.currentSoft;
    if (current.currentNeighbor === node) return colors.highlightSoft;
    if (current.queue.includes(node)) return colors.queuedSoft;
    if (current.visited.has(node)) return colors.accentSoft;
    return "transparent";
  };

  const getEdgeColor = (a, b) => {
    if (
      current.processingEdge &&
      ((current.processingEdge[0] === a && current.processingEdge[1] === b) ||
        (current.processingEdge[0] === b && current.processingEdge[1] === a))
    ) {
      return colors.edgeActive;
    }
    return colors.edge;
  };

  const getEdgeWidth = (a, b) => {
    if (
      current.processingEdge &&
      ((current.processingEdge[0] === a && current.processingEdge[1] === b) ||
        (current.processingEdge[0] === b && current.processingEdge[1] === a))
    ) {
      return 2.5;
    }
    return 1.2;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.bg,
      color: colors.text,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      padding: "24px 20px",
      boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: colors.accent,
          margin: 0,
          letterSpacing: "0.04em",
        }}>
          BFS — Breadth-First Search
        </h1>
        <p style={{ color: colors.textDim, fontSize: 12, margin: "6px 0 0" }}>
          Interactive algorithm visualizer
        </p>
      </div>

      {/* Main layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 18,
        maxWidth: 960,
        margin: "0 auto",
      }}>
        {/* LEFT: Pseudocode */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          padding: "18px 0",
          overflow: "hidden",
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: colors.textDim,
            padding: "0 18px 12px",
            borderBottom: `1px solid ${colors.border}`,
            marginBottom: 8,
          }}>
            Pseudocode
          </div>
          <div style={{ padding: "0 8px" }}>
            {PSEUDOCODE.map((line) => {
              const isHighlighted = current.highlightLines.includes(line.id);
              return (
                <div
                  key={line.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "3px 10px",
                    borderRadius: 5,
                    background: isHighlighted ? colors.highlightSoft : "transparent",
                    borderLeft: isHighlighted ? `3px solid ${colors.highlight}` : "3px solid transparent",
                    transition: "all 0.25s ease",
                    minHeight: line.text ? 26 : 10,
                  }}
                >
                  <span style={{
                    color: colors.textDim,
                    fontSize: 10,
                    width: 22,
                    textAlign: "right",
                    marginRight: 10,
                    opacity: 0.5,
                    flexShrink: 0,
                  }}>
                    {line.text ? line.id : ""}
                  </span>
                  <span style={{
                    paddingLeft: line.indent * 20,
                    fontSize: 13,
                    color: isHighlighted ? colors.highlight : colors.text,
                    fontWeight: isHighlighted ? 600 : 400,
                    transition: "color 0.2s",
                  }}>
                    {line.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Graph */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          padding: 18,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: colors.textDim,
            paddingBottom: 12,
            borderBottom: `1px solid ${colors.border}`,
            marginBottom: 12,
          }}>
            Graph Visualization
          </div>
          <svg viewBox="-10 10 420 360" style={{ width: "100%", flex: 1 }}>
            {/* Edges */}
            {EDGES.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={NODE_POSITIONS[a].x}
                y1={NODE_POSITIONS[a].y}
                x2={NODE_POSITIONS[b].x}
                y2={NODE_POSITIONS[b].y}
                stroke={getEdgeColor(a, b)}
                strokeWidth={getEdgeWidth(a, b)}
                style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
              />
            ))}
            {/* Nodes */}
            {Object.entries(NODE_POSITIONS).map(([node, pos]) => (
              <g key={node}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={26}
                  fill={getNodeBg(node)}
                  stroke={getNodeColor(node)}
                  strokeWidth={current.currentNode === node ? 2.5 : 1.5}
                  style={{ transition: "all 0.3s ease" }}
                />
                <text
                  x={pos.x}
                  y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={getNodeColor(node)}
                  fontSize={16}
                  fontWeight={700}
                  fontFamily="'JetBrains Mono', monospace"
                  style={{ transition: "fill 0.3s" }}
                >
                  {node}
                </text>
                {/* Order badge */}
                {current.order.indexOf(node) !== -1 && (
                  <g>
                    <circle
                      cx={pos.x + 20}
                      cy={pos.y - 20}
                      r={10}
                      fill={colors.accent}
                    />
                    <text
                      x={pos.x + 20}
                      y={pos.y - 19}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={colors.bg}
                      fontSize={10}
                      fontWeight={800}
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {current.order.indexOf(node) + 1}
                    </text>
                  </g>
                )}
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            marginTop: 8,
            paddingTop: 10,
            borderTop: `1px solid ${colors.border}`,
          }}>
            {[
              { label: "Current", color: colors.current },
              { label: "Neighbor", color: colors.highlight },
              { label: "In Queue", color: colors.queued },
              { label: "Visited", color: colors.visited },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: item.color,
                }} />
                <span style={{ fontSize: 10, color: colors.textDim }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* State Panel */}
      <div style={{
        maxWidth: 960,
        margin: "18px auto 0",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 14,
      }}>
        {[
          { label: "Queue", items: current.queue, color: colors.queued, bgColor: colors.queuedSoft },
          { label: "Visited", items: [...current.visited], color: colors.visited, bgColor: colors.accentSoft },
          { label: "Traversal Order", items: current.order, color: colors.highlight, bgColor: colors.highlightSoft },
        ].map(({ label, items, color, bgColor }) => (
          <div key={label} style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: "12px 14px",
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: colors.textDim,
              marginBottom: 8,
            }}>
              {label}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 28 }}>
              {items.length === 0 ? (
                <span style={{ fontSize: 12, color: colors.textDim, opacity: 0.5 }}>empty</span>
              ) : (
                items.map((item, i) => (
                  <span
                    key={`${item}-${i}`}
                    style={{
                      background: bgColor,
                      color: color,
                      border: `1px solid ${color}33`,
                      borderRadius: 5,
                      padding: "3px 10px",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {item}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div style={{
        maxWidth: 960,
        margin: "14px auto 0",
        background: colors.surfaceAlt,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: "12px 16px",
        fontSize: 13,
        color: colors.text,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <span style={{
          background: colors.accentSoft,
          color: colors.accent,
          borderRadius: 4,
          padding: "2px 8px",
          fontSize: 10,
          fontWeight: 700,
          flexShrink: 0,
        }}>
          STEP {step + 1}/{allSteps.length}
        </span>
        <span>{current.description}</span>
      </div>

      {/* Controls */}
      <div style={{
        maxWidth: 960,
        margin: "16px auto 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}>
        <button
          onClick={reset}
          style={{
            background: colors.surfaceAlt,
            color: colors.textDim,
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ↺ Reset
        </button>
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{
            background: colors.surfaceAlt,
            color: step === 0 ? colors.textDim + "44" : colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            padding: "8px 14px",
            fontSize: 13,
            cursor: step === 0 ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          ◀
        </button>
        <button
          onClick={isPlaying ? pause : play}
          style={{
            background: isPlaying ? colors.currentSoft : colors.accentSoft,
            color: isPlaying ? colors.current : colors.accent,
            border: `1px solid ${isPlaying ? colors.current + "44" : colors.accent + "44"}`,
            borderRadius: 8,
            padding: "8px 28px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.04em",
          }}
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          onClick={() => setStep((s) => Math.min(allSteps.length - 1, s + 1))}
          disabled={step === allSteps.length - 1}
          style={{
            background: colors.surfaceAlt,
            color: step === allSteps.length - 1 ? colors.textDim + "44" : colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            padding: "8px 14px",
            fontSize: 13,
            cursor: step === allSteps.length - 1 ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          ▶
        </button>

        {/* Speed control */}
        <div style={{
          marginLeft: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span style={{ fontSize: 10, color: colors.textDim }}>Speed:</span>
          {[
            { label: "0.5×", val: 2000 },
            { label: "1×", val: 1000 },
            { label: "2×", val: 500 },
          ].map(({ label, val }) => (
            <button
              key={label}
              onClick={() => setSpeed(val)}
              style={{
                background: speed === val ? colors.accentSoft : "transparent",
                color: speed === val ? colors.accent : colors.textDim,
                border: `1px solid ${speed === val ? colors.accent + "44" : colors.border}`,
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: speed === val ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Step scrubber */}
      <div style={{
        maxWidth: 960,
        margin: "14px auto 0",
        padding: "0 4px",
      }}>
        <input
          type="range"
          min={0}
          max={allSteps.length - 1}
          value={step}
          onChange={(e) => {
            setIsPlaying(false);
            setStep(Number(e.target.value));
          }}
          style={{
            width: "100%",
            accentColor: colors.accent,
            cursor: "pointer",
          }}
        />
      </div>
    </div>
  );
}
