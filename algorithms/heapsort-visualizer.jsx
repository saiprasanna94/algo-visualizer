import { useState, useRef, useEffect } from "react";

// ─── Example Data ────────────────────────────────
const HS_INPUT = [3, 7, 2, 8, 5, 1, 9, 4];

// ─── Pseudocode ──────────────────────────────────
const BUILD_PSEUDO = [
  { id: 0, indent: 0, text: "buildMaxHeap(arr):" },
  { id: 1, indent: 1, text: "n ← len(arr)" },
  { id: 2, indent: 1, text: "for i from (n/2 − 1) down to 0:" },
  { id: 3, indent: 2, text: "siftDown(arr, i, n)" },
  { id: 4, indent: 0, text: "" },
  { id: 5, indent: 0, text: "siftDown(arr, root, size):" },
  { id: 6, indent: 1, text: "largest ← root" },
  { id: 7, indent: 1, text: "L ← 2·root + 1" },
  { id: 8, indent: 1, text: "R ← 2·root + 2" },
  { id: 9, indent: 1, text: "if L < size and arr[L] > arr[largest]:" },
  { id: 10, indent: 2, text: "largest ← L" },
  { id: 11, indent: 1, text: "if R < size and arr[R] > arr[largest]:" },
  { id: 12, indent: 2, text: "largest ← R" },
  { id: 13, indent: 1, text: "if largest ≠ root:" },
  { id: 14, indent: 2, text: "swap arr[root], arr[largest]" },
  { id: 15, indent: 2, text: "siftDown(arr, largest, size)" },
];

const SORT_PSEUDO = [
  { id: 0, indent: 0, text: "heapsort(arr):" },
  { id: 1, indent: 1, text: "n ← len(arr)" },
  { id: 2, indent: 1, text: "buildMaxHeap(arr)" },
  { id: 3, indent: 1, text: "" },
  { id: 4, indent: 1, text: "for end from n−1 down to 1:" },
  { id: 5, indent: 2, text: "swap arr[0], arr[end]    // pull max" },
  { id: 6, indent: 2, text: "siftDown(arr, 0, end)    // re-heapify [0..end)" },
  { id: 7, indent: 0, text: "" },
  { id: 8, indent: 0, text: "siftDown(arr, root, size):" },
  { id: 9, indent: 1, text: "largest ← root" },
  { id: 10, indent: 1, text: "L ← 2·root + 1; R ← 2·root + 2" },
  { id: 11, indent: 1, text: "if L < size and arr[L] > arr[largest]: largest ← L" },
  { id: 12, indent: 1, text: "if R < size and arr[R] > arr[largest]: largest ← R" },
  { id: 13, indent: 1, text: "if largest ≠ root:" },
  { id: 14, indent: 2, text: "swap arr[root], arr[largest]" },
  { id: 15, indent: 2, text: "siftDown(arr, largest, size)" },
];

// ─── Step generators ─────────────────────────────
function siftDownSteps(arr, start, heapSize, settled, baseSnap, lineMap) {
  // tail-recursive sift-down, expanded into iterations
  let current = start;
  while (true) {
    const L = 2 * current + 1;
    const R = 2 * current + 2;
    const childIdxs = [];
    if (L < heapSize) childIdxs.push(L);
    if (R < heapSize) childIdxs.push(R);

    baseSnap({
      heapSize, settled: [...settled],
      siftRoot: current, siftLargest: current,
      compareIdx: childIdxs, swapping: null,
      description: `siftDown root = ${current} (val ${arr[current]}). Children: ${childIdxs.length === 0 ? "none" : childIdxs.map(c => `arr[${c}]=${arr[c]}`).join(", ")}`,
      highlightLines: lineMap.checkChildren,
      phase: "sift-check",
    });

    let largest = current;
    if (L < heapSize && arr[L] > arr[largest]) largest = L;
    if (R < heapSize && arr[R] > arr[largest]) largest = R;

    if (largest === current) {
      baseSnap({
        heapSize, settled: [...settled],
        siftRoot: current, siftLargest: current,
        compareIdx: childIdxs, swapping: null,
        description: `Heap property holds at ${current} (val ${arr[current]} ≥ children). Stop.`,
        highlightLines: lineMap.noSwap,
        phase: "sift-stop",
      });
      return;
    }

    baseSnap({
      heapSize, settled: [...settled],
      siftRoot: current, siftLargest: largest,
      compareIdx: childIdxs, swapping: null,
      description: `Largest child is arr[${largest}] = ${arr[largest]} > arr[${current}] = ${arr[current]} → swap`,
      highlightLines: lineMap.swap,
      phase: "sift-swap-prep",
    });

    [arr[current], arr[largest]] = [arr[largest], arr[current]];

    baseSnap({
      heapSize, settled: [...settled],
      siftRoot: largest, siftLargest: largest,
      compareIdx: [], swapping: [current, largest],
      description: `Swapped arr[${current}] ↔ arr[${largest}]. Continue sifting from ${largest}.`,
      highlightLines: lineMap.swap,
      phase: "sift-swap-done",
    });

    current = largest;
  }
}

function generateBuildSteps(initial) {
  const arr = [...initial];
  const steps = [];
  const n = arr.length;
  const settled = [];

  const snap = (extra) => steps.push({ array: [...arr], ...extra });

  snap({
    heapSize: n, settled: [],
    siftRoot: null, siftLargest: null,
    compareIdx: [], swapping: null,
    description: `Initial array (no heap order yet). Will siftDown from i = n/2 − 1 = ${Math.floor(n / 2) - 1} down to 0.`,
    highlightLines: [0, 1, 2],
    phase: "init",
  });

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    snap({
      heapSize: n, settled: [],
      siftRoot: i, siftLargest: null,
      compareIdx: [], swapping: null,
      description: `Process i = ${i}: siftDown(arr, ${i}, ${n})`,
      highlightLines: [2, 3],
      phase: "outer",
    });

    siftDownSteps(arr, i, n, settled, snap, {
      checkChildren: [5, 6, 7, 8, 9, 11],
      noSwap: [13],
      swap: [13, 14, 15],
    });
  }

  snap({
    heapSize: n, settled: [],
    siftRoot: null, siftLargest: null,
    compareIdx: [], swapping: null,
    description: `Max-heap built: [${arr.join(", ")}]. Root ${arr[0]} is the largest.`,
    highlightLines: [],
    phase: "done",
  });

  return { steps, finalHeap: [...arr] };
}

function generateHeapsortSteps(initial) {
  const arr = [...initial];
  const steps = [];
  const n = arr.length;
  const settled = [];

  const snap = (extra) => steps.push({ array: [...arr], ...extra });

  snap({
    heapSize: n, settled: [],
    siftRoot: null, siftLargest: null,
    compareIdx: [], swapping: null,
    description: `heapsort(arr) — first build max-heap`,
    highlightLines: [0, 1, 2],
    phase: "start",
  });

  // Build max-heap inline
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    siftDownSteps(arr, i, n, settled, snap, {
      checkChildren: [8, 9, 10, 11, 12],
      noSwap: [13],
      swap: [13, 14, 15],
    });
  }

  snap({
    heapSize: n, settled: [],
    siftRoot: null, siftLargest: null,
    compareIdx: [], swapping: null,
    description: `Max-heap built: [${arr.join(", ")}]. Now extract max repeatedly.`,
    highlightLines: [4],
    phase: "heap-built",
  });

  for (let end = n - 1; end >= 1; end--) {
    snap({
      heapSize: end + 1, settled: [...settled],
      siftRoot: 0, siftLargest: end,
      compareIdx: [], swapping: null,
      description: `Iteration: end = ${end}. Pull max ${arr[0]} to position ${end}.`,
      highlightLines: [4, 5],
      phase: "extract-prep",
    });

    [arr[0], arr[end]] = [arr[end], arr[0]];
    settled.unshift(end); // build sorted region from the right

    snap({
      heapSize: end, settled: [...settled],
      siftRoot: null, siftLargest: null,
      compareIdx: [], swapping: [0, end],
      description: `Swapped root ↔ arr[${end}]. arr[${end}] = ${arr[end]} is now in its final sorted position. Heap shrinks to size ${end}.`,
      highlightLines: [5],
      phase: "extract-swap",
    });

    if (end >= 1) {
      snap({
        heapSize: end, settled: [...settled],
        siftRoot: 0, siftLargest: 0,
        compareIdx: [], swapping: null,
        description: `Restore heap with siftDown(arr, 0, ${end}).`,
        highlightLines: [6],
        phase: "extract-sift",
      });
      siftDownSteps(arr, 0, end, settled, snap, {
        checkChildren: [8, 9, 10, 11, 12],
        noSwap: [13],
        swap: [13, 14, 15],
      });
    }
  }

  // Last element is trivially settled
  settled.unshift(0);

  snap({
    heapSize: 0, settled: [...settled],
    siftRoot: null, siftLargest: null,
    compareIdx: [], swapping: null,
    description: `Sorted! Final array: [${arr.join(", ")}]`,
    highlightLines: [],
    phase: "done",
  });

  return steps;
}

const buildResult = generateBuildSteps(HS_INPUT);
const buildSteps = buildResult.steps;
const heapsortSteps = generateHeapsortSteps(HS_INPUT);

// ─── Colors ──────────────────────────────────────
const C = {
  bg: "#0f1117",
  surface: "#181b24",
  surfaceAlt: "#1e2230",
  border: "#2a2e3d",
  text: "#e2e4ea",
  textDim: "#7a7f91",
  accent: "#818cf8",                 // indigo
  accentSoft: "rgba(129,140,248,0.13)",
  highlight: "#a5b4fc",
  highlightSoft: "rgba(165,180,252,0.10)",
  root: "#818cf8",
  rootSoft: "rgba(129,140,248,0.18)",
  largest: "#f4c753",
  largestSoft: "rgba(244,199,83,0.18)",
  child: "#61afef",
  childSoft: "rgba(97,175,239,0.15)",
  swap: "#fb923c",
  swapSoft: "rgba(251,146,60,0.18)",
  settled: "#56d4a0",
  settledSoft: "rgba(86,212,160,0.18)",
  heapEdge: "#3a3f52",
  heapEdgeActive: "#818cf8",
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

// ─── Visual: Array bars ──────────────────────────
function ArrayBars({ snapshot }) {
  const { array, heapSize, settled, siftRoot, siftLargest, compareIdx, swapping } = snapshot;
  const max = Math.max(...array);
  const barW = 44, gap = 5, maxH = 100;

  const styleFor = (idx) => {
    const isSettled = settled.includes(idx);
    const isOutOfHeap = idx >= heapSize && !isSettled;
    const isRoot = siftRoot === idx;
    const isLargest = siftLargest === idx && siftLargest !== siftRoot;
    const isChild = compareIdx?.includes(idx);
    const isSwap = swapping?.includes(idx);

    if (isSettled) return { bg: C.settledSoft, border: C.settled, label: C.settled };
    if (isSwap) return { bg: C.swapSoft, border: C.swap, label: C.swap };
    if (isLargest) return { bg: C.largestSoft, border: C.largest, label: C.largest };
    if (isRoot) return { bg: C.rootSoft, border: C.root, label: C.root };
    if (isChild) return { bg: C.childSoft, border: C.child, label: C.child };
    if (isOutOfHeap) return { bg: C.outOfRangeSoft, border: C.outOfRange, label: C.textDim };
    return { bg: C.surfaceAlt, border: C.border, label: C.text };
  };

  return (
    <div>
      {/* Pointer labels */}
      <div style={{ display: "flex", gap, height: 22, marginBottom: 4 }}>
        {array.map((_, idx) => {
          const labels = [];
          if (siftRoot === idx) labels.push({ t: "root", c: C.root });
          if (siftLargest === idx && siftLargest !== siftRoot) labels.push({ t: "max", c: C.largest });
          return (
            <div key={idx} style={{
              width: barW, display: "flex", justifyContent: "center", alignItems: "flex-end",
              gap: 3, fontSize: 9, fontWeight: 700,
            }}>
              {labels.map((l, ki) => (
                <span key={ki} style={{
                  color: l.c, background: l.c + "20",
                  border: `1px solid ${l.c}55`, borderRadius: 3,
                  padding: "1px 4px",
                }}>{l.t}</span>
              ))}
            </div>
          );
        })}
      </div>

      {/* Bars */}
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
              fontWeight: 700, fontSize: 13, color: s.label,
              fontFamily: "'JetBrains Mono', monospace",
            }}>{v}</div>
          );
        })}
      </div>

      {/* Index row */}
      <div style={{ display: "flex", gap, marginTop: 2 }}>
        {array.map((_, idx) => (
          <div key={idx} style={{
            width: barW, textAlign: "center", fontSize: 9, color: C.textDim,
          }}>{idx}</div>
        ))}
      </div>

      {/* Heap-vs-sorted bracket */}
      <div style={{ display: "flex", gap, marginTop: 4 }}>
        {array.map((_, idx) => {
          const inHeap = idx < heapSize;
          const isSet = settled.includes(idx);
          return (
            <div key={idx} style={{
              width: barW, height: 4, borderRadius: 2,
              background: isSet ? C.settled : inHeap ? C.accent + "55" : "transparent",
            }} />
          );
        })}
      </div>
      <div style={{ display: "flex", gap, marginTop: 2, fontSize: 9 }}>
        <div style={{ width: heapSize * (barW + gap) - gap, color: C.accent, textAlign: "center" }}>
          {heapSize > 0 ? `← heap [0..${heapSize - 1}] →` : ""}
        </div>
        <div style={{ flex: 1, color: C.settled, textAlign: "center" }}>
          {array.length - heapSize > 0 ? `← sorted →` : ""}
        </div>
      </div>
    </div>
  );
}

// ─── Visual: Heap Tree ───────────────────────────
function HeapTree({ snapshot }) {
  const { array, heapSize, settled, siftRoot, siftLargest, compareIdx, swapping } = snapshot;
  const n = array.length;
  const width = 480;
  const levelGap = 70;
  const offsetTop = 24;
  const totalLevels = Math.ceil(Math.log2(n + 1));
  const height = totalLevels * levelGap + 30;

  const positionFor = (idx) => {
    const level = Math.floor(Math.log2(idx + 1));
    const posInLevel = idx - (Math.pow(2, level) - 1);
    const slots = Math.pow(2, level);
    const x = ((posInLevel + 0.5) / slots) * width;
    const y = level * levelGap + offsetTop;
    return { x, y };
  };

  const nodeStyle = (idx) => {
    const isSettled = settled.includes(idx);
    const isOutOfHeap = idx >= heapSize && !isSettled;
    const isRoot = siftRoot === idx;
    const isLargest = siftLargest === idx && siftLargest !== siftRoot;
    const isChild = compareIdx?.includes(idx);
    const isSwap = swapping?.includes(idx);

    if (isSettled) return { fill: C.settledSoft, stroke: C.settled, text: C.settled };
    if (isSwap) return { fill: C.swapSoft, stroke: C.swap, text: C.swap };
    if (isLargest) return { fill: C.largestSoft, stroke: C.largest, text: C.largest };
    if (isRoot) return { fill: C.rootSoft, stroke: C.root, text: C.root };
    if (isChild) return { fill: C.childSoft, stroke: C.child, text: C.child };
    if (isOutOfHeap) return { fill: "transparent", stroke: C.outOfRange, text: C.textDim };
    return { fill: C.surfaceAlt, stroke: C.border, text: C.text };
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", maxHeight: height + 20 }}>
      {/* Edges */}
      {array.map((_, idx) => {
        if (idx === 0) return null;
        const parent = Math.floor((idx - 1) / 2);
        if (parent < 0) return null;
        const a = positionFor(parent);
        const b = positionFor(idx);

        const inHeap = idx < heapSize;
        const active = (siftRoot === parent && (compareIdx?.includes(idx) || siftLargest === idx))
                    || (swapping && swapping.includes(parent) && swapping.includes(idx));
        const stroke = !inHeap && !settled.includes(idx) ? C.outOfRange + "66"
                     : active ? C.heapEdgeActive
                     : settled.includes(idx) || settled.includes(parent) ? C.outOfRange
                     : C.heapEdge;

        return (
          <line key={`e-${idx}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={stroke} strokeWidth={active ? 2.4 : 1.2}
            style={{ transition: "stroke 0.25s, stroke-width 0.25s" }} />
        );
      })}

      {/* Nodes */}
      {array.map((v, idx) => {
        const { x, y } = positionFor(idx);
        const s = nodeStyle(idx);
        const r = 19;
        return (
          <g key={`n-${idx}`} style={{ transition: "all 0.25s" }}>
            <circle cx={x} cy={y} r={r}
              fill={s.fill} stroke={s.stroke}
              strokeWidth={siftRoot === idx ? 2.5 : 1.5}
              style={{ transition: "all 0.25s" }} />
            <text x={x} y={y - 2} textAnchor="middle" dominantBaseline="central"
              fill={s.text} fontSize={13} fontWeight={700}
              fontFamily="'JetBrains Mono', monospace">{v}</text>
            <text x={x} y={y + 10} textAnchor="middle" dominantBaseline="central"
              fill={C.textDim} fontSize={8}
              fontFamily="'JetBrains Mono', monospace">[{idx}]</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Phase 1: Build Heap ─────────────────────────
function BuildHeapPhase({ onComplete }) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);
  const cur = buildSteps[step];

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14,
      }}>
        <PseudocodePanel lines={BUILD_PSEUDO} highlightLines={cur.highlightLines}
          title="Phase 1 — Build Max-Heap (bottom-up siftDown)" />

        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: C.textDim,
            paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
          }}>Heap Tree</div>
          <HeapTree snapshot={cur} />

          <div style={{
            display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 8,
            borderTop: `1px solid ${C.border}`,
          }}>
            {[
              { label: "Root (sift)", color: C.root },
              { label: "Children", color: C.child },
              { label: "Largest", color: C.largest },
              { label: "Swapping", color: C.swap },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                <span style={{ fontSize: 10, color: C.textDim }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: 16, marginBottom: 14,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.12em", color: C.textDim,
          paddingBottom: 10, borderBottom: `1px solid ${C.border}`, marginBottom: 12,
        }}>Array View</div>
        <div style={{ overflowX: "auto" }}>
          <ArrayBars snapshot={cur} />
        </div>
      </div>

      <StepBar step={step} total={buildSteps.length} description={cur.description}
        setStep={setStep} setIsPlaying={setIsPlaying} accentColor={C.accent} />
      <div style={{ marginTop: 10 }}>
        <Controls step={step} setStep={setStep} total={buildSteps.length}
          isPlaying={isPlaying} setIsPlaying={setIsPlaying} speed={speed} setSpeed={setSpeed} />
      </div>

      {cur.phase === "done" && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={onComplete} style={{
            background: C.settledSoft, color: C.settled,
            border: `1px solid ${C.settled}55`, borderRadius: 8,
            padding: "10px 28px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em",
          }}>Continue to Phase 2: Full Heapsort →</button>
        </div>
      )}
    </div>
  );
}

// ─── Phase 2: Full Heapsort ──────────────────────
function HeapsortPhase({ onBack }) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);
  const cur = heapsortSteps[step];

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14,
      }}>
        <PseudocodePanel lines={SORT_PSEUDO} highlightLines={cur.highlightLines}
          title="Phase 2 — Heapsort (extract max, re-heapify)" />

        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: C.textDim,
            paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
          }}>Heap Tree (shrinks each iteration)</div>
          <HeapTree snapshot={cur} />

          <div style={{
            display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 8,
            borderTop: `1px solid ${C.border}`,
          }}>
            {[
              { label: "Root", color: C.root },
              { label: "Children", color: C.child },
              { label: "Largest", color: C.largest },
              { label: "Swapping", color: C.swap },
              { label: "Settled", color: C.settled },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                <span style={{ fontSize: 10, color: C.textDim }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: 16, marginBottom: 14,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.12em", color: C.textDim,
          paddingBottom: 10, borderBottom: `1px solid ${C.border}`, marginBottom: 12,
        }}>Array View — heap region shrinks left, sorted region grows right</div>
        <div style={{ overflowX: "auto" }}>
          <ArrayBars snapshot={cur} />
        </div>
      </div>

      <StepBar step={step} total={heapsortSteps.length} description={cur.description}
        setStep={setStep} setIsPlaying={setIsPlaying} accentColor={C.accent} />
      <div style={{ marginTop: 10 }}>
        <Controls step={step} setStep={setStep} total={heapsortSteps.length}
          isPlaying={isPlaying} setIsPlaying={setIsPlaying} speed={speed} setSpeed={setSpeed} />
      </div>

      <div style={{ textAlign: "center", marginTop: 14 }}>
        <button onClick={onBack} style={{
          background: C.surfaceAlt, color: C.textDim,
          border: `1px solid ${C.border}`, borderRadius: 6,
          padding: "8px 20px", fontSize: 11, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>← Back to Phase 1: Build Max-Heap</button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────
export default function HeapsortVisualizer() {
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
          Heapsort — In-place Sort via Max-Heap
        </h1>
        <p style={{ color: C.textDim, fontSize: 12, margin: "6px 0 0" }}>
          Guaranteed O(n log n), in-place · Two-phase interactive visualizer
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
              Phase {p}: {p === 1 ? "Build Heap" : "Full Sort"}
            </button>
          ))}
        </div>
        <div style={{
          marginTop: 12, fontSize: 12, color: C.textDim, display: "flex",
          justifyContent: "center", gap: 20, flexWrap: "wrap",
        }}>
          <span>Input: <span style={{ color: C.text, fontWeight: 600 }}>[{HS_INPUT.join(", ")}]</span></span>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {phase === 1
          ? <BuildHeapPhase onComplete={() => setPhase(2)} />
          : <HeapsortPhase onBack={() => setPhase(1)} />
        }
      </div>

      <div style={{
        maxWidth: 1000, margin: "20px auto 0",
        background: C.surfaceAlt, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: "14px 18px",
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Why Heapsort?
        </div>
        <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.7 }}>
          Heapsort treats the array as an implicit binary heap (parent of <code>i</code> at <code>(i−1)/2</code>, children at <code>2i+1</code>, <code>2i+2</code>).
          Phase 1 builds a <span style={{ color: C.accent, fontWeight: 600 }}>max-heap</span> bottom-up in O(n) — siftDown each non-leaf, starting from the
          deepest. Phase 2 repeatedly swaps the root (the max) to the end of the array, shrinks the heap by one, and re-sifts the root.
          Each extraction is O(log n), giving <span style={{ color: C.settled, fontWeight: 600 }}>O(n log n)</span> total — guaranteed, no bad input.
          Unlike Quicksort it has no quadratic worst case; unlike Mergesort it's <span style={{ color: C.text, fontWeight: 600 }}>in-place</span> (O(1) extra memory).
          The downside: it's not stable, and it's cache-unfriendly because of the jumpy parent/child indices.
        </div>
      </div>
    </div>
  );
}
