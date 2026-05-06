import { useState, useRef, useEffect } from "react";

// ─── Example Data ────────────────────────────────
const PARTITION_INPUT = [3, 8, 2, 5, 1, 4, 7, 6];
const QS_INPUT = [5, 2, 8, 1, 9, 3, 7, 4, 6];

// ─── Pseudocode ──────────────────────────────────
const PARTITION_PSEUDO = [
  { id: 0, indent: 0, text: "partition(arr, low, high):" },
  { id: 1, indent: 1, text: "pivot ← arr[high]" },
  { id: 2, indent: 1, text: "i ← low - 1" },
  { id: 3, indent: 1, text: "" },
  { id: 4, indent: 1, text: "for j from low to high - 1:" },
  { id: 5, indent: 2, text: "if arr[j] ≤ pivot:" },
  { id: 6, indent: 3, text: "i ← i + 1" },
  { id: 7, indent: 3, text: "swap arr[i], arr[j]" },
  { id: 8, indent: 1, text: "" },
  { id: 9, indent: 1, text: "swap arr[i + 1], arr[high]" },
  { id: 10, indent: 1, text: "return i + 1" },
];

const QS_PSEUDO = [
  { id: 0, indent: 0, text: "quicksort(arr, low, high):" },
  { id: 1, indent: 1, text: "if low < high:" },
  { id: 2, indent: 2, text: "p ← partition(arr, low, high)" },
  { id: 3, indent: 2, text: "quicksort(arr, low, p - 1)" },
  { id: 4, indent: 2, text: "quicksort(arr, p + 1, high)" },
  { id: 5, indent: 1, text: "" },
  { id: 6, indent: 0, text: "partition(arr, low, high):" },
  { id: 7, indent: 1, text: "pivot ← arr[high]; i ← low - 1" },
  { id: 8, indent: 1, text: "for j from low to high - 1:" },
  { id: 9, indent: 2, text: "if arr[j] ≤ pivot:" },
  { id: 10, indent: 3, text: "i ← i + 1; swap arr[i], arr[j]" },
  { id: 11, indent: 1, text: "swap arr[i + 1], arr[high]" },
  { id: 12, indent: 1, text: "return i + 1" },
];

// ─── Step generators ─────────────────────────────
function generatePartitionSteps(initial) {
  const arr = [...initial];
  const low = 0;
  const high = arr.length - 1;
  const steps = [];
  const pivot = arr[high];
  let i = low - 1;

  steps.push({
    array: [...arr],
    pivotIdx: high, pivotValue: pivot,
    i, j: null,
    comparing: null, swapping: null,
    settled: [],
    description: `pivot = arr[${high}] = ${pivot}, i = ${i} (one before low)`,
    highlightLines: [1, 2],
    phase: "init",
  });

  for (let j = low; j < high; j++) {
    steps.push({
      array: [...arr],
      pivotIdx: high, pivotValue: pivot,
      i, j,
      comparing: { idx: j, val: arr[j] },
      swapping: null,
      settled: [],
      description: `Compare arr[${j}] = ${arr[j]} with pivot = ${pivot}`,
      highlightLines: [4, 5],
      phase: "compare",
    });

    if (arr[j] <= pivot) {
      i++;
      if (i !== j) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        steps.push({
          array: [...arr],
          pivotIdx: high, pivotValue: pivot,
          i, j,
          comparing: null,
          swapping: [i, j],
          settled: [],
          description: `arr[${j}] ≤ pivot → i = ${i}, swap arr[${i}] ↔ arr[${j}]`,
          highlightLines: [6, 7],
          phase: "swap",
        });
      } else {
        steps.push({
          array: [...arr],
          pivotIdx: high, pivotValue: pivot,
          i, j,
          comparing: null,
          swapping: null,
          settled: [],
          description: `arr[${j}] ≤ pivot → i = ${i} (same as j, no swap needed)`,
          highlightLines: [6, 7],
          phase: "advance",
        });
      }
    } else {
      steps.push({
        array: [...arr],
        pivotIdx: high, pivotValue: pivot,
        i, j,
        comparing: null,
        swapping: null,
        settled: [],
        description: `arr[${j}] = ${arr[j]} > pivot → leave on the right side`,
        highlightLines: [4],
        phase: "skip",
      });
    }
  }

  const finalPivot = i + 1;
  [arr[finalPivot], arr[high]] = [arr[high], arr[finalPivot]];
  steps.push({
    array: [...arr],
    pivotIdx: finalPivot, pivotValue: pivot,
    i, j: null,
    comparing: null,
    swapping: [finalPivot, high],
    settled: [finalPivot],
    description: `Place pivot: swap arr[${finalPivot}] ↔ arr[${high}]. Pivot lands at index ${finalPivot}`,
    highlightLines: [9],
    phase: "place-pivot",
  });

  steps.push({
    array: [...arr],
    pivotIdx: finalPivot, pivotValue: pivot,
    i: null, j: null,
    comparing: null, swapping: null,
    settled: [finalPivot],
    description: `Done. Everything left of index ${finalPivot} is ≤ ${pivot}, everything right is > ${pivot}. return ${finalPivot}`,
    highlightLines: [10],
    phase: "done",
  });

  return steps;
}

function generateQuicksortSteps(initial) {
  const arr = [...initial];
  const steps = [];
  const tree = []; // {id, parent, low, high, depth, status, pivotIdx?}
  const settled = new Set();
  let nextId = 0;

  function snap(extra) {
    steps.push({
      array: [...arr],
      tree: tree.map((n) => ({ ...n })),
      settled: [...settled],
      ...extra,
    });
  }

  function quicksort(low, high, parent, depth) {
    const id = nextId++;
    tree.push({ id, parent, low, high, depth, status: "active" });

    if (low > high) {
      tree[id].status = "done";
      return;
    }

    if (low === high) {
      settled.add(low);
      snap({
        nodeId: id,
        currentRange: { low, high },
        pivotIdx: null, i: null, j: null,
        comparing: null, swapping: null,
        description: `quicksort(${low}, ${high}) — single element, already in place`,
        highlightLines: [1],
        phase: "leaf",
      });
      tree[id].status = "done";
      return;
    }

    snap({
      nodeId: id,
      currentRange: { low, high },
      pivotIdx: null, i: null, j: null,
      comparing: null, swapping: null,
      description: `quicksort(${low}, ${high}) — process sub-array of length ${high - low + 1}`,
      highlightLines: [0, 1, 2],
      phase: "enter",
    });

    // ── partition inline ──
    const pivot = arr[high];
    let i = low - 1;

    snap({
      nodeId: id,
      currentRange: { low, high },
      pivotIdx: high, pivotValue: pivot,
      i, j: null,
      comparing: null, swapping: null,
      description: `partition(${low}, ${high}): pivot = arr[${high}] = ${pivot}`,
      highlightLines: [6, 7],
      phase: "partition-init",
    });

    for (let j = low; j < high; j++) {
      snap({
        nodeId: id,
        currentRange: { low, high },
        pivotIdx: high, pivotValue: pivot,
        i, j,
        comparing: { idx: j, val: arr[j] },
        swapping: null,
        description: `Compare arr[${j}] = ${arr[j]} with pivot = ${pivot}`,
        highlightLines: [8, 9],
        phase: "compare",
      });

      if (arr[j] <= pivot) {
        i++;
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          snap({
            nodeId: id,
            currentRange: { low, high },
            pivotIdx: high, pivotValue: pivot,
            i, j,
            comparing: null,
            swapping: [i, j],
            description: `arr[${j}] ≤ pivot → i = ${i}, swap arr[${i}] ↔ arr[${j}]`,
            highlightLines: [10],
            phase: "swap",
          });
        }
      }
    }

    const p = i + 1;
    if (p !== high) {
      [arr[p], arr[high]] = [arr[high], arr[p]];
    }
    settled.add(p);
    tree[id].pivotIdx = p;

    snap({
      nodeId: id,
      currentRange: { low, high },
      pivotIdx: p, pivotValue: pivot,
      i, j: null,
      comparing: null,
      swapping: p !== high ? [p, high] : null,
      description: `Place pivot: arr[${p}] ↔ arr[${high}]. Pivot ${pivot} settled at index ${p}`,
      highlightLines: [11, 12],
      phase: "place-pivot",
    });

    snap({
      nodeId: id,
      currentRange: { low, high },
      pivotIdx: p, pivotValue: pivot,
      i: null, j: null,
      comparing: null, swapping: null,
      description: `Recurse left on [${low}..${p - 1}]`,
      highlightLines: [3],
      phase: "recurse-left",
    });

    quicksort(low, p - 1, id, depth + 1);

    snap({
      nodeId: id,
      currentRange: { low, high },
      pivotIdx: p, pivotValue: pivot,
      i: null, j: null,
      comparing: null, swapping: null,
      description: `Recurse right on [${p + 1}..${high}]`,
      highlightLines: [4],
      phase: "recurse-right",
    });

    quicksort(p + 1, high, id, depth + 1);

    tree[id].status = "done";
  }

  snap({
    nodeId: null,
    currentRange: null,
    pivotIdx: null, i: null, j: null,
    comparing: null, swapping: null,
    description: `Initial array — call quicksort(0, ${arr.length - 1})`,
    highlightLines: [0],
    phase: "start",
  });

  quicksort(0, arr.length - 1, -1, 0);

  // mark all settled at end
  for (let k = 0; k < arr.length; k++) settled.add(k);
  snap({
    nodeId: null,
    currentRange: null,
    pivotIdx: null, i: null, j: null,
    comparing: null, swapping: null,
    description: `Sorted: [${arr.join(", ")}]`,
    highlightLines: [],
    phase: "done",
  });

  return steps;
}

const partitionSteps = generatePartitionSteps(PARTITION_INPUT);
const qsSteps = generateQuicksortSteps(QS_INPUT);

// ─── Colors ──────────────────────────────────────
const C = {
  bg: "#0f1117",
  surface: "#181b24",
  surfaceAlt: "#1e2230",
  border: "#2a2e3d",
  text: "#e2e4ea",
  textDim: "#7a7f91",
  accent: "#ec4899",          // rose/pink — quicksort theme
  accentSoft: "rgba(236,72,153,0.13)",
  highlight: "#f472b6",
  highlightSoft: "rgba(244,114,182,0.10)",
  pivot: "#ec4899",
  pivotSoft: "rgba(236,72,153,0.18)",
  compare: "#61afef",
  compareSoft: "rgba(97,175,239,0.18)",
  swap: "#f4c753",
  swapSoft: "rgba(244,199,83,0.18)",
  settled: "#56d4a0",
  settledSoft: "rgba(86,212,160,0.16)",
  outOfRange: "#3a3f52",
  outOfRangeSoft: "rgba(58,63,82,0.35)",
  mismatch: "#e06c75",
  mismatchSoft: "rgba(224,108,117,0.16)",
};

// ─── Shared Components ───────────────────────────
function PseudocodePanel({ lines, highlightLines, title }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "16px 0", overflow: "hidden", minWidth: 0,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.12em", color: C.textDim,
        padding: "0 16px 10px", borderBottom: `1px solid ${C.border}`, marginBottom: 6,
      }}>{title}</div>
      <div style={{ padding: "0 6px" }}>
        {lines.map((line) => {
          const isHL = highlightLines.includes(line.id);
          return (
            <div key={line.id} style={{
              display: "flex", alignItems: "center", padding: "2px 8px",
              borderRadius: 4,
              background: isHL ? C.highlightSoft : "transparent",
              borderLeft: isHL ? `3px solid ${C.highlight}` : "3px solid transparent",
              transition: "all 0.2s", minHeight: line.text ? 24 : 8,
            }}>
              <span style={{
                color: C.textDim, fontSize: 9, width: 20,
                textAlign: "right", marginRight: 8, opacity: 0.45, flexShrink: 0,
              }}>{line.text ? line.id : ""}</span>
              <span style={{
                paddingLeft: line.indent * 16, fontSize: 12,
                color: isHL ? C.highlight : C.text,
                fontWeight: isHL ? 600 : 400, transition: "color 0.2s",
                whiteSpace: "nowrap",
              }}>{line.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Controls({ step, setStep, total, isPlaying, setIsPlaying, speed, setSpeed }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setStep((s) => {
          if (s >= total - 1) { setIsPlaying(false); return s; }
          return s + 1;
        });
      }, speed);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, speed, total, setStep, setIsPlaying]);

  const btn = (onClick, label, disabled, extra = {}) => (
    <button onClick={onClick} disabled={disabled} style={{
      background: C.surfaceAlt, color: disabled ? C.textDim + "44" : C.text,
      border: `1px solid ${C.border}`, borderRadius: 6,
      padding: "7px 13px", fontSize: 12, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", fontWeight: 600, ...extra,
    }}>{label}</button>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
      {btn(() => { setIsPlaying(false); setStep(0); }, "↺ Reset", false)}
      {btn(() => setStep((s) => Math.max(0, s - 1)), "◀", step === 0)}
      <button onClick={() => setIsPlaying(!isPlaying)} style={{
        background: isPlaying ? C.mismatchSoft : C.accentSoft,
        color: isPlaying ? C.mismatch : C.accent,
        border: `1px solid ${isPlaying ? C.mismatch + "44" : C.accent + "44"}`,
        borderRadius: 8, padding: "7px 24px", fontSize: 12, fontWeight: 700,
        cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em",
      }}>{isPlaying ? "⏸ Pause" : "▶ Play"}</button>
      {btn(() => setStep((s) => Math.min(total - 1, s + 1)), "▶", step === total - 1)}
      <div style={{ marginLeft: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, color: C.textDim }}>Speed:</span>
        {[{ l: "0.5×", v: 2000 }, { l: "1×", v: 1000 }, { l: "2×", v: 500 }].map(({ l, v }) => (
          <button key={l} onClick={() => setSpeed(v)} style={{
            background: speed === v ? C.accentSoft : "transparent",
            color: speed === v ? C.accent : C.textDim,
            border: `1px solid ${speed === v ? C.accent + "44" : C.border}`,
            borderRadius: 4, padding: "3px 8px", fontSize: 10,
            cursor: "pointer", fontFamily: "inherit", fontWeight: speed === v ? 600 : 400,
          }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function StepBar({ step, total, description, setStep, setIsPlaying, accentColor }) {
  return (
    <>
      <div style={{
        background: C.surfaceAlt, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.text,
        display: "flex", alignItems: "center", gap: 10, marginTop: 12,
      }}>
        <span style={{
          background: (accentColor || C.accent) + "20",
          color: accentColor || C.accent,
          borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700, flexShrink: 0,
        }}>STEP {step + 1}/{total}</span>
        <span>{description}</span>
      </div>
      <div style={{ padding: "0 2px", marginTop: 8 }}>
        <input type="range" min={0} max={total - 1} value={step}
          onChange={(e) => { setIsPlaying(false); setStep(Number(e.target.value)); }}
          style={{ width: "100%", accentColor: accentColor || C.accent, cursor: "pointer" }}
        />
      </div>
    </>
  );
}

// ─── Array Bars ──────────────────────────────────
function ArrayBars({ array, snapshot, range, fullRangeWidth }) {
  const max = Math.max(...array);
  const barW = 50;
  const gap = 6;
  const maxH = 130;

  const styleFor = (idx) => {
    const inRange = !range || (idx >= range.low && idx <= range.high);
    const isPivot = snapshot.pivotIdx === idx;
    const isI = snapshot.i === idx;
    const isJ = snapshot.j === idx;
    const isComparing = snapshot.comparing && snapshot.comparing.idx === idx;
    const isSwapping = snapshot.swapping && snapshot.swapping.includes(idx);
    const isSettled = snapshot.settled && snapshot.settled.includes(idx);

    if (isSettled && !isPivot) {
      return { bg: C.settledSoft, border: C.settled, label: C.settled };
    }
    if (isSwapping) {
      return { bg: C.swapSoft, border: C.swap, label: C.swap };
    }
    if (isPivot) {
      return { bg: C.pivotSoft, border: C.pivot, label: C.pivot };
    }
    if (isComparing) {
      return { bg: C.compareSoft, border: C.compare, label: C.compare };
    }
    if (!inRange) {
      return { bg: C.outOfRangeSoft, border: C.outOfRange, label: C.textDim };
    }
    if (isI || isJ) {
      return { bg: C.surfaceAlt, border: C.accent + "55", label: C.text };
    }
    return { bg: C.surfaceAlt, border: C.border, label: C.text };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Pointer labels row */}
      <div style={{ display: "flex", gap, height: 22, paddingLeft: 0 }}>
        {array.map((_, idx) => {
          const labels = [];
          if (snapshot.pivotIdx === idx) labels.push({ t: "pivot", c: C.pivot });
          if (snapshot.i === idx) labels.push({ t: "i", c: C.accent });
          if (snapshot.j === idx) labels.push({ t: "j", c: C.compare });
          return (
            <div key={idx} style={{
              width: barW, display: "flex", justifyContent: "center", alignItems: "flex-end",
              gap: 4, fontSize: 10, fontWeight: 700,
            }}>
              {labels.map((l, k) => (
                <span key={k} style={{
                  color: l.c, background: l.c + "20",
                  border: `1px solid ${l.c}55`, borderRadius: 3,
                  padding: "1px 5px",
                }}>{l.t}</span>
              ))}
            </div>
          );
        })}
      </div>

      {/* Bars row */}
      <div style={{ display: "flex", gap, alignItems: "flex-end", height: maxH + 4 }}>
        {array.map((v, idx) => {
          const s = styleFor(idx);
          const h = Math.max(20, Math.round((v / max) * maxH));
          return (
            <div key={idx} style={{
              width: barW, height: h,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 4, transition: "all 0.25s ease",
              background: s.bg, border: `1.5px solid ${s.border}`,
              fontWeight: 700, fontSize: 14, color: s.label,
              fontFamily: "'JetBrains Mono', monospace",
            }}>{v}</div>
          );
        })}
      </div>

      {/* Index row */}
      <div style={{ display: "flex", gap }}>
        {array.map((_, idx) => (
          <div key={idx} style={{
            width: barW, textAlign: "center",
            fontSize: 10, color: C.textDim,
          }}>{idx}</div>
        ))}
      </div>

      {/* Range bracket */}
      {range && (
        <div style={{
          display: "flex", gap, marginTop: 2,
          paddingLeft: range.low * (barW + gap),
        }}>
          <div style={{
            width: (range.high - range.low + 1) * barW + (range.high - range.low) * gap,
            borderTop: `2px solid ${C.accent}66`,
            position: "relative", height: 14,
          }}>
            <span style={{
              position: "absolute", left: "50%", top: 2, transform: "translateX(-50%)",
              fontSize: 10, color: C.accent, fontWeight: 600,
              background: C.bg, padding: "0 6px",
            }}>[{range.low}..{range.high}]</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Recursion Tree ──────────────────────────────
function RecursionTree({ tree, activeId, array, settled }) {
  if (!tree || tree.length === 0) {
    return <div style={{ fontSize: 11, color: C.textDim }}>No calls yet</div>;
  }

  const renderNode = (node) => {
    const isActive = node.id === activeId;
    const isDone = node.status === "done";
    const slice = array.slice(node.low, node.high + 1);
    const sizeLabel = node.high < node.low ? "∅" : `[${node.low}..${node.high}]`;
    return (
      <div key={node.id} style={{
        marginLeft: node.depth * 16, marginTop: 4,
        padding: "5px 9px", borderRadius: 5,
        border: `1px solid ${isActive ? C.accent : isDone ? C.settled + "33" : C.border}`,
        background: isActive ? C.accentSoft : isDone ? C.settledSoft : C.surfaceAlt,
        display: "flex", alignItems: "center", gap: 8, fontSize: 11,
      }}>
        <span style={{
          color: isActive ? C.accent : isDone ? C.settled : C.textDim,
          fontWeight: 700, minWidth: 60,
        }}>{sizeLabel}</span>
        <span style={{ color: C.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
          {slice.length === 0 ? "—" : slice.join(", ")}
        </span>
        {node.pivotIdx !== undefined && (
          <span style={{
            marginLeft: "auto", fontSize: 9, fontWeight: 700,
            background: C.pivotSoft, color: C.pivot,
            border: `1px solid ${C.pivot}44`, borderRadius: 3, padding: "1px 5px",
          }}>pivot @ {node.pivotIdx}</span>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxHeight: 300, overflowY: "auto" }}>
      {tree.map(renderNode)}
    </div>
  );
}

// ─── Phase 1: Partition Visualizer ───────────────
function PartitionPhase({ onComplete }) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const cur = partitionSteps[step];

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14,
      }}>
        <PseudocodePanel lines={PARTITION_PSEUDO} highlightLines={cur.highlightLines}
          title="Phase 1 — Lomuto Partition" />

        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: C.textDim,
            paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
          }}>Array State</div>

          <div style={{ overflowX: "auto", paddingBottom: 4 }}>
            <ArrayBars array={cur.array} snapshot={cur} range={null} />
          </div>

          {/* Pointers */}
          <div style={{
            display: "flex", gap: 18, paddingTop: 8, flexWrap: "wrap",
            borderTop: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 12, color: C.pivot }}>
              <span style={{ fontWeight: 700 }}>pivot</span> = {cur.pivotValue}
              {cur.pivotIdx !== null && (
                <span style={{ color: C.textDim, marginLeft: 4 }}>(idx {cur.pivotIdx})</span>
              )}
            </div>
            {cur.i !== null && (
              <div style={{ fontSize: 12, color: C.accent }}>
                <span style={{ fontWeight: 700 }}>i</span> = {cur.i}
              </div>
            )}
            {cur.j !== null && (
              <div style={{ fontSize: 12, color: C.compare }}>
                <span style={{ fontWeight: 700 }}>j</span> = {cur.j}
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{
            display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 8,
            borderTop: `1px solid ${C.border}`,
          }}>
            {[
              { label: "Pivot", color: C.pivot },
              { label: "Comparing", color: C.compare },
              { label: "Swapping", color: C.swap },
              { label: "Settled", color: C.settled },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                <span style={{ fontSize: 10, color: C.textDim }}>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={{
            fontSize: 11, color: C.textDim, lineHeight: 1.6,
            paddingTop: 8, borderTop: `1px solid ${C.border}`,
          }}>
            Lomuto walks <span style={{ color: C.compare, fontWeight: 600 }}>j</span> across the array. <span style={{ color: C.accent, fontWeight: 600 }}>i</span> tracks the boundary of values
            ≤ pivot. After the loop, the pivot is swapped into <code>i+1</code> — the boundary itself.
          </div>
        </div>
      </div>

      <StepBar step={step} total={partitionSteps.length} description={cur.description}
        setStep={setStep} setIsPlaying={setIsPlaying} accentColor={C.accent} />
      <div style={{ marginTop: 10 }}>
        <Controls step={step} setStep={setStep} total={partitionSteps.length}
          isPlaying={isPlaying} setIsPlaying={setIsPlaying} speed={speed} setSpeed={setSpeed} />
      </div>

      {cur.phase === "done" && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={onComplete} style={{
            background: C.settledSoft, color: C.settled,
            border: `1px solid ${C.settled}55`, borderRadius: 8,
            padding: "10px 28px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em",
          }}>Continue to Phase 2: Full Quicksort →</button>
        </div>
      )}
    </div>
  );
}

// ─── Phase 2: Full Quicksort ─────────────────────
function QuicksortPhase({ onBack }) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);
  const cur = qsSteps[step];

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14,
      }}>
        <PseudocodePanel lines={QS_PSEUDO} highlightLines={cur.highlightLines}
          title="Phase 2 — Quicksort + Partition" />

        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: C.textDim,
            paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
          }}>Array State</div>

          <div style={{ overflowX: "auto", paddingBottom: 4 }}>
            <ArrayBars array={cur.array} snapshot={cur} range={cur.currentRange} />
          </div>

          {/* Pointers */}
          <div style={{
            display: "flex", gap: 18, paddingTop: 8, flexWrap: "wrap",
            borderTop: `1px solid ${C.border}`,
          }}>
            {cur.currentRange && (
              <div style={{ fontSize: 12, color: C.accent }}>
                <span style={{ fontWeight: 700 }}>range</span> = [{cur.currentRange.low}..{cur.currentRange.high}]
              </div>
            )}
            {cur.pivotIdx !== null && cur.pivotIdx !== undefined && (
              <div style={{ fontSize: 12, color: C.pivot }}>
                <span style={{ fontWeight: 700 }}>pivot</span> = {cur.pivotValue} (idx {cur.pivotIdx})
              </div>
            )}
            {cur.i !== null && cur.i !== undefined && (
              <div style={{ fontSize: 12, color: C.accent }}>
                <span style={{ fontWeight: 700 }}>i</span> = {cur.i}
              </div>
            )}
            {cur.j !== null && cur.j !== undefined && (
              <div style={{ fontSize: 12, color: C.compare }}>
                <span style={{ fontWeight: 700 }}>j</span> = {cur.j}
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{
            display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 8,
            borderTop: `1px solid ${C.border}`,
          }}>
            {[
              { label: "Pivot", color: C.pivot },
              { label: "Comparing", color: C.compare },
              { label: "Swapping", color: C.swap },
              { label: "Settled", color: C.settled },
              { label: "Out of range", color: C.outOfRange },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                <span style={{ fontSize: 10, color: C.textDim }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recursion tree */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: 16, marginBottom: 14,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.12em", color: C.textDim,
          paddingBottom: 10, borderBottom: `1px solid ${C.border}`, marginBottom: 6,
        }}>Recursion Tree (active call highlighted)</div>
        <RecursionTree tree={cur.tree} activeId={cur.nodeId}
          array={cur.array} settled={cur.settled} />
      </div>

      <StepBar step={step} total={qsSteps.length} description={cur.description}
        setStep={setStep} setIsPlaying={setIsPlaying} accentColor={C.accent} />
      <div style={{ marginTop: 10 }}>
        <Controls step={step} setStep={setStep} total={qsSteps.length}
          isPlaying={isPlaying} setIsPlaying={setIsPlaying} speed={speed} setSpeed={setSpeed} />
      </div>

      <div style={{ textAlign: "center", marginTop: 14 }}>
        <button onClick={onBack} style={{
          background: C.surfaceAlt, color: C.textDim,
          border: `1px solid ${C.border}`, borderRadius: 6,
          padding: "8px 20px", fontSize: 11, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>← Back to Phase 1: Partition</button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────
export default function QuicksortVisualizer() {
  const [phase, setPhase] = useState(1);

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      padding: "24px 16px", boxSizing: "border-box",
    }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: C.accent,
          margin: 0, letterSpacing: "0.04em",
        }}>
          Quicksort — Lomuto Partition
        </h1>
        <p style={{ color: C.textDim, fontSize: 12, margin: "6px 0 0" }}>
          Average O(n log n) divide-and-conquer · Two-phase interactive visualizer
        </p>
        <div style={{
          display: "inline-flex", gap: 4, marginTop: 12,
          background: C.surfaceAlt, borderRadius: 6, padding: 3,
          border: `1px solid ${C.border}`,
        }}>
          {[1, 2].map((p) => (
            <button key={p} onClick={() => setPhase(p)} style={{
              background: phase === p ? C.accentSoft : "transparent",
              color: phase === p ? C.accent : C.textDim,
              border: "none", borderRadius: 4, padding: "6px 16px",
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              Phase {p}: {p === 1 ? "Partition" : "Full Sort"}
            </button>
          ))}
        </div>
        <div style={{
          marginTop: 12, fontSize: 12, color: C.textDim, display: "flex",
          justifyContent: "center", gap: 20, flexWrap: "wrap",
        }}>
          {phase === 1 ? (
            <span>Input: <span style={{ color: C.text, fontWeight: 600 }}>[{PARTITION_INPUT.join(", ")}]</span></span>
          ) : (
            <span>Input: <span style={{ color: C.text, fontWeight: 600 }}>[{QS_INPUT.join(", ")}]</span></span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {phase === 1
          ? <PartitionPhase onComplete={() => setPhase(2)} />
          : <QuicksortPhase onBack={() => setPhase(1)} />
        }
      </div>

      <div style={{
        maxWidth: 1000, margin: "20px auto 0",
        background: C.surfaceAlt, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: "14px 18px",
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Why Quicksort?
        </div>
        <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.7 }}>
          Quicksort picks a <span style={{ color: C.pivot, fontWeight: 600 }}>pivot</span>, partitions the array so everything on the left is ≤ pivot
          and everything on the right is &gt; pivot, then recurses on both halves. The
          <span style={{ color: C.text, fontWeight: 600 }}> partition step</span> is where the work happens — once it returns, the pivot is in its final
          sorted position. Average <span style={{ color: C.settled, fontWeight: 600 }}>O(n log n)</span>, worst case O(n²) on already-sorted input
          with naive pivot choice (last-element here). In-place, cache-friendly, and the basis of most stdlib sorts.
        </div>
      </div>
    </div>
  );
}
