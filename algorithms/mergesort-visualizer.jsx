import { useState, useRef, useEffect } from "react";

// ─── Example Data ────────────────────────────────
const MERGE_LEFT  = [2, 5, 7, 9];
const MERGE_RIGHT = [1, 4, 6, 8];
const MS_INPUT    = [5, 2, 8, 1, 9, 3, 7, 4];

// ─── Pseudocode ──────────────────────────────────
const MERGE_PSEUDO = [
  { id: 0, indent: 0, text: "merge(L, R) → out:" },
  { id: 1, indent: 1, text: "i ← 0; j ← 0; out ← []" },
  { id: 2, indent: 1, text: "" },
  { id: 3, indent: 1, text: "while i < |L| and j < |R|:" },
  { id: 4, indent: 2, text: "if L[i] ≤ R[j]:" },
  { id: 5, indent: 3, text: "out.push(L[i]); i ← i + 1" },
  { id: 6, indent: 2, text: "else:" },
  { id: 7, indent: 3, text: "out.push(R[j]); j ← j + 1" },
  { id: 8, indent: 1, text: "" },
  { id: 9, indent: 1, text: "while i < |L|: out.push(L[i++])" },
  { id: 10, indent: 1, text: "while j < |R|: out.push(R[j++])" },
  { id: 11, indent: 1, text: "return out" },
];

const MS_PSEUDO = [
  { id: 0, indent: 0, text: "mergesort(arr, low, high):" },
  { id: 1, indent: 1, text: "if low ≥ high: return  // base case" },
  { id: 2, indent: 1, text: "mid ← (low + high) / 2" },
  { id: 3, indent: 1, text: "mergesort(arr, low, mid)" },
  { id: 4, indent: 1, text: "mergesort(arr, mid + 1, high)" },
  { id: 5, indent: 1, text: "merge(arr, low, mid, high)" },
  { id: 6, indent: 0, text: "" },
  { id: 7, indent: 0, text: "merge(arr, low, mid, high):" },
  { id: 8, indent: 1, text: "L ← arr[low..mid]; R ← arr[mid+1..high]" },
  { id: 9, indent: 1, text: "i ← 0; j ← 0; k ← low" },
  { id: 10, indent: 1, text: "while i < |L| and j < |R|:" },
  { id: 11, indent: 2, text: "if L[i] ≤ R[j]: arr[k++] = L[i++]" },
  { id: 12, indent: 2, text: "else:           arr[k++] = R[j++]" },
  { id: 13, indent: 1, text: "drain remaining L or R into arr[k..]" },
];

// ─── Step generator: standalone merge ────────────
function generateMergeSteps(L, R) {
  const steps = [];
  const out = [];
  let i = 0, j = 0;

  steps.push({
    L: [...L], R: [...R], out: [...out],
    i, j,
    chose: null, comparing: null,
    description: `Initialize: i = 0, j = 0, output = []`,
    highlightLines: [1],
    phase: "init",
  });

  while (i < L.length && j < R.length) {
    steps.push({
      L: [...L], R: [...R], out: [...out],
      i, j,
      chose: null,
      comparing: { li: i, rj: j, lv: L[i], rv: R[j] },
      description: `Compare L[${i}] = ${L[i]} with R[${j}] = ${R[j]}`,
      highlightLines: [3, 4],
      phase: "compare",
    });

    if (L[i] <= R[j]) {
      out.push(L[i]);
      steps.push({
        L: [...L], R: [...R], out: [...out],
        i: i + 1, j,
        chose: "left",
        comparing: { li: i, rj: j, lv: L[i], rv: R[j] },
        description: `L[${i}] = ${L[i]} ≤ R[${j}] = ${R[j]} → take from L, output ${L[i]}, i++`,
        highlightLines: [4, 5],
        phase: "take-left",
      });
      i++;
    } else {
      out.push(R[j]);
      steps.push({
        L: [...L], R: [...R], out: [...out],
        i, j: j + 1,
        chose: "right",
        comparing: { li: i, rj: j, lv: L[i], rv: R[j] },
        description: `L[${i}] = ${L[i]} > R[${j}] = ${R[j]} → take from R, output ${R[j]}, j++`,
        highlightLines: [6, 7],
        phase: "take-right",
      });
      j++;
    }
  }

  while (i < L.length) {
    out.push(L[i]);
    steps.push({
      L: [...L], R: [...R], out: [...out],
      i: i + 1, j,
      chose: "left", comparing: null,
      description: `R is exhausted → drain L[${i}] = ${L[i]}`,
      highlightLines: [9],
      phase: "drain-left",
    });
    i++;
  }

  while (j < R.length) {
    out.push(R[j]);
    steps.push({
      L: [...L], R: [...R], out: [...out],
      i, j: j + 1,
      chose: "right", comparing: null,
      description: `L is exhausted → drain R[${j}] = ${R[j]}`,
      highlightLines: [10],
      phase: "drain-right",
    });
    j++;
  }

  steps.push({
    L: [...L], R: [...R], out: [...out],
    i, j,
    chose: null, comparing: null,
    description: `Done. Merged output: [${out.join(", ")}]`,
    highlightLines: [11],
    phase: "done",
  });

  return steps;
}

// ─── Step generator: full mergesort ──────────────
function generateMergesortSteps(initial) {
  const arr = [...initial];
  const steps = [];
  const tree = []; // {id, parent, low, high, depth, status: 'split'|'merging'|'done', mid?}
  let nextId = 0;

  function snap(extra) {
    steps.push({
      array: [...arr],
      tree: tree.map(n => ({ ...n })),
      ...extra,
    });
  }

  function ms(low, high, parent, depth) {
    const id = nextId++;
    tree.push({ id, parent, low, high, depth, status: "split" });

    if (low >= high) {
      snap({
        nodeId: id,
        currentRange: { low, high },
        sourceLeft: null, sourceRight: null,
        mergeIdx: null, mergeOut: null,
        description: `mergesort(${low}, ${high}) — single element, already sorted`,
        highlightLines: [0, 1],
        phase: "leaf",
      });
      tree[id].status = "done";
      return;
    }

    const mid = Math.floor((low + high) / 2);
    tree[id].mid = mid;

    snap({
      nodeId: id,
      currentRange: { low, high },
      sourceLeft: null, sourceRight: null,
      mergeIdx: null, mergeOut: null,
      description: `mergesort(${low}, ${high}): split at mid = ${mid}`,
      highlightLines: [0, 2],
      phase: "split",
    });

    snap({
      nodeId: id,
      currentRange: { low, high },
      sourceLeft: null, sourceRight: null,
      mergeIdx: null, mergeOut: null,
      description: `Recurse left on [${low}..${mid}]`,
      highlightLines: [3],
      phase: "recurse-left",
    });

    ms(low, mid, id, depth + 1);

    snap({
      nodeId: id,
      currentRange: { low, high },
      sourceLeft: null, sourceRight: null,
      mergeIdx: null, mergeOut: null,
      description: `Recurse right on [${mid + 1}..${high}]`,
      highlightLines: [4],
      phase: "recurse-right",
    });

    ms(mid + 1, high, id, depth + 1);

    // ── merge step ──
    tree[id].status = "merging";
    const L = arr.slice(low, mid + 1);
    const R = arr.slice(mid + 1, high + 1);

    snap({
      nodeId: id,
      currentRange: { low, high },
      sourceLeft: { low, high: mid },
      sourceRight: { low: mid + 1, high },
      mergeIdx: low, mergeOut: [],
      description: `Merge sub-arrays L = [${L.join(", ")}] and R = [${R.join(", ")}]`,
      highlightLines: [5, 7, 8, 9],
      phase: "merge-init",
    });

    let i = 0, j = 0, k = low;
    const mergeOut = [];

    while (i < L.length && j < R.length) {
      snap({
        nodeId: id,
        currentRange: { low, high },
        sourceLeft: { low, high: mid, ptr: low + i },
        sourceRight: { low: mid + 1, high, ptr: mid + 1 + j },
        mergeIdx: k, mergeOut: [...mergeOut],
        description: `Compare L[${i}] = ${L[i]} with R[${j}] = ${R[j]} (writing to arr[${k}])`,
        highlightLines: [10, 11, 12],
        phase: "merge-compare",
      });

      if (L[i] <= R[j]) {
        arr[k] = L[i];
        mergeOut.push(L[i]);
        snap({
          nodeId: id,
          currentRange: { low, high },
          sourceLeft: { low, high: mid, ptr: low + i, took: true },
          sourceRight: { low: mid + 1, high, ptr: mid + 1 + j },
          mergeIdx: k, mergeOut: [...mergeOut],
          description: `${L[i]} ≤ ${R[j]} → write ${L[i]} to arr[${k}], i++, k++`,
          highlightLines: [11],
          phase: "merge-take-left",
        });
        i++;
      } else {
        arr[k] = R[j];
        mergeOut.push(R[j]);
        snap({
          nodeId: id,
          currentRange: { low, high },
          sourceLeft: { low, high: mid, ptr: low + i },
          sourceRight: { low: mid + 1, high, ptr: mid + 1 + j, took: true },
          mergeIdx: k, mergeOut: [...mergeOut],
          description: `${L[i]} > ${R[j]} → write ${R[j]} to arr[${k}], j++, k++`,
          highlightLines: [12],
          phase: "merge-take-right",
        });
        j++;
      }
      k++;
    }

    while (i < L.length) {
      arr[k] = L[i];
      mergeOut.push(L[i]);
      snap({
        nodeId: id,
        currentRange: { low, high },
        sourceLeft: { low, high: mid, ptr: low + i, took: true },
        sourceRight: { low: mid + 1, high },
        mergeIdx: k, mergeOut: [...mergeOut],
        description: `R drained → copy remaining L[${i}] = ${L[i]} into arr[${k}]`,
        highlightLines: [13],
        phase: "merge-drain-left",
      });
      i++; k++;
    }

    while (j < R.length) {
      arr[k] = R[j];
      mergeOut.push(R[j]);
      snap({
        nodeId: id,
        currentRange: { low, high },
        sourceLeft: { low, high: mid },
        sourceRight: { low: mid + 1, high, ptr: mid + 1 + j, took: true },
        mergeIdx: k, mergeOut: [...mergeOut],
        description: `L drained → copy remaining R[${j}] = ${R[j]} into arr[${k}]`,
        highlightLines: [13],
        phase: "merge-drain-right",
      });
      j++; k++;
    }

    snap({
      nodeId: id,
      currentRange: { low, high },
      sourceLeft: null, sourceRight: null,
      mergeIdx: null, mergeOut: null,
      description: `Merged [${low}..${high}] is now sorted: [${arr.slice(low, high + 1).join(", ")}]`,
      highlightLines: [],
      phase: "merge-done",
    });

    tree[id].status = "done";
  }

  snap({
    nodeId: null,
    currentRange: null,
    sourceLeft: null, sourceRight: null,
    mergeIdx: null, mergeOut: null,
    description: `Initial array — call mergesort(0, ${arr.length - 1})`,
    highlightLines: [0],
    phase: "start",
  });

  ms(0, arr.length - 1, -1, 0);

  snap({
    nodeId: null,
    currentRange: null,
    sourceLeft: null, sourceRight: null,
    mergeIdx: null, mergeOut: null,
    description: `Sorted: [${arr.join(", ")}]`,
    highlightLines: [],
    phase: "done",
  });

  return steps;
}

const mergeSteps = generateMergeSteps(MERGE_LEFT, MERGE_RIGHT);
const msSteps = generateMergesortSteps(MS_INPUT);

// ─── Colors ──────────────────────────────────────
const C = {
  bg: "#0f1117",
  surface: "#181b24",
  surfaceAlt: "#1e2230",
  border: "#2a2e3d",
  text: "#e2e4ea",
  textDim: "#7a7f91",
  accent: "#fb923c",                 // orange
  accentSoft: "rgba(251,146,60,0.13)",
  highlight: "#fdba74",
  highlightSoft: "rgba(253,186,116,0.10)",
  left: "#22d3ee",                   // cyan for left-source
  leftSoft: "rgba(34,211,238,0.18)",
  right: "#a78bfa",                  // violet for right-source
  rightSoft: "rgba(167,139,250,0.18)",
  out: "#56d4a0",                    // green for merged output
  outSoft: "rgba(86,212,160,0.18)",
  compare: "#f4c753",
  compareSoft: "rgba(244,199,83,0.18)",
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

// ─── Bar row component ──────────────────────────
function BarRow({ items, max, label, labelColor, ptrIdx, takenIdx, fillColor, fillSoftColor, dimAfterPtr = false }) {
  const barW = 44, gap = 5, maxH = 90;
  return (
    <div>
      {label && <div style={{
        fontSize: 9, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.1em", color: labelColor || C.textDim, marginBottom: 4,
      }}>{label}</div>}
      <div style={{ display: "flex", gap, alignItems: "flex-end", height: maxH + 4 }}>
        {items.length === 0 ? (
          <div style={{ height: maxH, color: C.textDim, fontSize: 11, fontStyle: "italic", display: "flex", alignItems: "flex-end" }}>(empty)</div>
        ) : items.map((v, idx) => {
          const isPtr = ptrIdx === idx;
          const isTaken = takenIdx === idx;
          let bg = fillSoftColor || C.surfaceAlt;
          let border = fillColor || C.border;
          let textCol = C.text;
          if (dimAfterPtr && ptrIdx !== null && ptrIdx !== undefined && idx < ptrIdx) {
            bg = C.outOfRangeSoft; border = C.outOfRange; textCol = C.textDim;
          }
          if (isTaken) {
            bg = C.compareSoft; border = C.compare; textCol = C.compare;
          } else if (isPtr) {
            bg = (fillSoftColor || C.accentSoft); border = (fillColor || C.accent);
            textCol = (fillColor || C.accent);
          }
          const h = Math.max(20, Math.round((v / max) * maxH));
          return (
            <div key={idx} style={{
              width: barW, height: h,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 4, transition: "all 0.25s ease",
              background: bg, border: `1.5px solid ${border}`,
              fontWeight: 700, fontSize: 13, color: textCol,
              fontFamily: "'JetBrains Mono', monospace",
            }}>{v}</div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap, marginTop: 2 }}>
        {items.map((_, idx) => (
          <div key={idx} style={{
            width: barW, textAlign: "center", fontSize: 9, color: C.textDim,
          }}>{idx}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Recursion Tree ──────────────────────────────
function RecursionTree({ tree, activeId, array }) {
  if (!tree || tree.length === 0) return <div style={{ fontSize: 11, color: C.textDim }}>No calls yet</div>;

  const renderNode = (node) => {
    const isActive = node.id === activeId;
    const slice = array.slice(node.low, node.high + 1);
    const sizeLabel = node.high < node.low ? "∅" : `[${node.low}..${node.high}]`;
    const statusColor = node.status === "merging" ? C.accent
                      : node.status === "done"    ? C.out
                      : C.textDim;
    const bg = isActive ? C.accentSoft
             : node.status === "done" ? C.outSoft
             : node.status === "merging" ? C.accentSoft
             : C.surfaceAlt;
    const borderCol = isActive ? C.accent
                    : node.status === "done" ? C.out + "55"
                    : C.border;
    return (
      <div key={node.id} style={{
        marginLeft: node.depth * 16, marginTop: 4,
        padding: "5px 9px", borderRadius: 5,
        border: `1px solid ${borderCol}`,
        background: bg,
        display: "flex", alignItems: "center", gap: 8, fontSize: 11,
      }}>
        <span style={{ color: statusColor, fontWeight: 700, minWidth: 60 }}>{sizeLabel}</span>
        <span style={{ color: C.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
          {slice.length === 0 ? "—" : slice.join(", ")}
        </span>
        <span style={{
          marginLeft: "auto", fontSize: 9, fontWeight: 700,
          color: statusColor, background: statusColor + "20",
          border: `1px solid ${statusColor}44`, borderRadius: 3, padding: "1px 5px",
          textTransform: "uppercase", letterSpacing: "0.05em",
        }}>{node.status}</span>
      </div>
    );
  };

  return <div style={{ maxHeight: 240, overflowY: "auto" }}>{tree.map(renderNode)}</div>;
}

// ─── Phase 1: Merge Subroutine ───────────────────
function MergePhase({ onComplete }) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const cur = mergeSteps[step];
  const max = Math.max(...MERGE_LEFT, ...MERGE_RIGHT);

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14,
      }}>
        <PseudocodePanel lines={MERGE_PSEUDO} highlightLines={cur.highlightLines}
          title="Phase 1 — Merge two sorted arrays" />

        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 16,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: C.textDim,
            paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
          }}>Two sorted inputs → merged output</div>

          <BarRow items={cur.L} max={max} label={`Left (i = ${cur.i})`} labelColor={C.left}
            ptrIdx={cur.i < cur.L.length ? cur.i : null}
            takenIdx={cur.chose === "left" && cur.comparing ? cur.comparing.li : null}
            fillColor={C.left} fillSoftColor={C.leftSoft}
            dimAfterPtr />

          <BarRow items={cur.R} max={max} label={`Right (j = ${cur.j})`} labelColor={C.right}
            ptrIdx={cur.j < cur.R.length ? cur.j : null}
            takenIdx={cur.chose === "right" && cur.comparing ? cur.comparing.rj : null}
            fillColor={C.right} fillSoftColor={C.rightSoft}
            dimAfterPtr />

          <BarRow items={cur.out} max={max} label={`Output (k = ${cur.out.length})`} labelColor={C.out}
            ptrIdx={null} takenIdx={null}
            fillColor={C.out} fillSoftColor={C.outSoft} />

          {/* Pointers + comparison */}
          {cur.comparing && (
            <div style={{
              padding: "8px 12px", borderTop: `1px solid ${C.border}`,
              fontSize: 12, color: C.textDim, lineHeight: 1.6,
            }}>
              <span style={{ color: C.left, fontWeight: 700 }}>L[{cur.comparing.li}] = {cur.comparing.lv}</span>
              {" "}
              {cur.chose === "left" ? "≤" : cur.chose === "right" ? ">" : "?"}
              {" "}
              <span style={{ color: C.right, fontWeight: 700 }}>R[{cur.comparing.rj}] = {cur.comparing.rv}</span>
            </div>
          )}

          {/* Legend */}
          <div style={{
            display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 8,
            borderTop: `1px solid ${C.border}`,
          }}>
            {[
              { label: "Left input", color: C.left },
              { label: "Right input", color: C.right },
              { label: "Output", color: C.out },
              { label: "Just taken", color: C.compare },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                <span style={{ fontSize: 10, color: C.textDim }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StepBar step={step} total={mergeSteps.length} description={cur.description}
        setStep={setStep} setIsPlaying={setIsPlaying} accentColor={C.accent} />
      <div style={{ marginTop: 10 }}>
        <Controls step={step} setStep={setStep} total={mergeSteps.length}
          isPlaying={isPlaying} setIsPlaying={setIsPlaying} speed={speed} setSpeed={setSpeed} />
      </div>

      {cur.phase === "done" && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={onComplete} style={{
            background: C.outSoft, color: C.out,
            border: `1px solid ${C.out}55`, borderRadius: 8,
            padding: "10px 28px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em",
          }}>Continue to Phase 2: Full Mergesort →</button>
        </div>
      )}
    </div>
  );
}

// ─── Phase 2: Full Mergesort ─────────────────────
function MergesortPhase({ onBack }) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const cur = msSteps[step];
  const max = Math.max(...MS_INPUT);
  const barW = 44, gap = 5, maxH = 110;

  const colorForIdx = (idx) => {
    if (cur.sourceLeft && idx >= cur.sourceLeft.low && idx <= cur.sourceLeft.high) {
      const isPtr = cur.sourceLeft.ptr === idx;
      const isTaken = cur.sourceLeft.took && cur.sourceLeft.ptr === idx;
      if (isTaken) return { bg: C.compareSoft, border: C.compare, label: C.compare };
      if (isPtr) return { bg: C.leftSoft, border: C.left, label: C.left };
      return { bg: C.leftSoft, border: C.left + "55", label: C.left };
    }
    if (cur.sourceRight && idx >= cur.sourceRight.low && idx <= cur.sourceRight.high) {
      const isPtr = cur.sourceRight.ptr === idx;
      const isTaken = cur.sourceRight.took && cur.sourceRight.ptr === idx;
      if (isTaken) return { bg: C.compareSoft, border: C.compare, label: C.compare };
      if (isPtr) return { bg: C.rightSoft, border: C.right, label: C.right };
      return { bg: C.rightSoft, border: C.right + "55", label: C.right };
    }
    if (cur.currentRange && idx >= cur.currentRange.low && idx <= cur.currentRange.high) {
      return { bg: C.surfaceAlt, border: C.accent + "55", label: C.text };
    }
    if (cur.currentRange) {
      return { bg: C.outOfRangeSoft, border: C.outOfRange, label: C.textDim };
    }
    return { bg: C.surfaceAlt, border: C.border, label: C.text };
  };

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14,
      }}>
        <PseudocodePanel lines={MS_PSEUDO} highlightLines={cur.highlightLines}
          title="Phase 2 — Mergesort + Merge" />

        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: C.textDim,
            paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
          }}>Array State</div>

          {/* Pointer labels row */}
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", gap, height: 22, marginBottom: 4 }}>
              {cur.array.map((_, idx) => {
                const labels = [];
                if (cur.sourceLeft?.ptr === idx) labels.push({ t: "i", c: C.left });
                if (cur.sourceRight?.ptr === idx) labels.push({ t: "j", c: C.right });
                if (cur.mergeIdx === idx) labels.push({ t: "k", c: C.out });
                return (
                  <div key={idx} style={{
                    width: barW, display: "flex", justifyContent: "center", alignItems: "flex-end",
                    gap: 3, fontSize: 10, fontWeight: 700,
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
              {cur.array.map((v, idx) => {
                const s = colorForIdx(idx);
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
              {cur.array.map((_, idx) => (
                <div key={idx} style={{
                  width: barW, textAlign: "center", fontSize: 9, color: C.textDim,
                }}>{idx}</div>
              ))}
            </div>

            {/* Range bracket */}
            {cur.currentRange && (
              <div style={{
                display: "flex", gap, marginTop: 2,
                paddingLeft: cur.currentRange.low * (barW + gap),
              }}>
                <div style={{
                  width: (cur.currentRange.high - cur.currentRange.low + 1) * barW + (cur.currentRange.high - cur.currentRange.low) * gap,
                  borderTop: `2px solid ${C.accent}66`,
                  position: "relative", height: 14,
                }}>
                  <span style={{
                    position: "absolute", left: "50%", top: 2, transform: "translateX(-50%)",
                    fontSize: 10, color: C.accent, fontWeight: 600,
                    background: C.bg, padding: "0 6px",
                  }}>[{cur.currentRange.low}..{cur.currentRange.high}]</span>
                </div>
              </div>
            )}
          </div>

          {/* Merge output buffer */}
          {cur.mergeOut && (
            <div style={{ paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              <div style={{
                fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.1em", color: C.out, marginBottom: 4,
              }}>Merged so far ({cur.mergeOut.length})</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", minHeight: 22 }}>
                {cur.mergeOut.length === 0 ? (
                  <span style={{ fontSize: 11, color: C.textDim, fontStyle: "italic" }}>(empty)</span>
                ) : cur.mergeOut.map((v, idx) => (
                  <span key={idx} style={{
                    background: C.outSoft, color: C.out,
                    border: `1px solid ${C.out}55`, borderRadius: 4,
                    padding: "2px 8px", fontSize: 12, fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>{v}</span>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div style={{
            display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 8,
            borderTop: `1px solid ${C.border}`,
          }}>
            {[
              { label: "Left source", color: C.left },
              { label: "Right source", color: C.right },
              { label: "Just taken", color: C.compare },
              { label: "Merged", color: C.out },
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
        <RecursionTree tree={cur.tree} activeId={cur.nodeId} array={cur.array} />
      </div>

      <StepBar step={step} total={msSteps.length} description={cur.description}
        setStep={setStep} setIsPlaying={setIsPlaying} accentColor={C.accent} />
      <div style={{ marginTop: 10 }}>
        <Controls step={step} setStep={setStep} total={msSteps.length}
          isPlaying={isPlaying} setIsPlaying={setIsPlaying} speed={speed} setSpeed={setSpeed} />
      </div>

      <div style={{ textAlign: "center", marginTop: 14 }}>
        <button onClick={onBack} style={{
          background: C.surfaceAlt, color: C.textDim,
          border: `1px solid ${C.border}`, borderRadius: 6,
          padding: "8px 20px", fontSize: 11, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>← Back to Phase 1: Merge subroutine</button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────
export default function MergesortVisualizer() {
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
          Mergesort — Divide and Conquer
        </h1>
        <p style={{ color: C.textDim, fontSize: 12, margin: "6px 0 0" }}>
          Guaranteed O(n log n), stable · Two-phase interactive visualizer
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
              Phase {p}: {p === 1 ? "Merge" : "Full Sort"}
            </button>
          ))}
        </div>
        <div style={{
          marginTop: 12, fontSize: 12, color: C.textDim, display: "flex",
          justifyContent: "center", gap: 20, flexWrap: "wrap",
        }}>
          {phase === 1 ? (
            <>
              <span>L: <span style={{ color: C.left, fontWeight: 600 }}>[{MERGE_LEFT.join(", ")}]</span></span>
              <span>R: <span style={{ color: C.right, fontWeight: 600 }}>[{MERGE_RIGHT.join(", ")}]</span></span>
            </>
          ) : (
            <span>Input: <span style={{ color: C.text, fontWeight: 600 }}>[{MS_INPUT.join(", ")}]</span></span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {phase === 1
          ? <MergePhase onComplete={() => setPhase(2)} />
          : <MergesortPhase onBack={() => setPhase(1)} />
        }
      </div>

      <div style={{
        maxWidth: 1000, margin: "20px auto 0",
        background: C.surfaceAlt, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: "14px 18px",
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Why Mergesort?
        </div>
        <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.7 }}>
          Mergesort splits the array in half until you reach singletons (trivially sorted), then walks back up the tree
          merging pairs of sorted runs. The <span style={{ color: C.accent, fontWeight: 600 }}>merge step</span> is the
          star of the show — it's where the actual ordering happens, and it costs O(n) per level. With log n levels
          of recursion, that's a clean <span style={{ color: C.out, fontWeight: 600 }}>O(n log n)</span>, guaranteed.
          Unlike Quicksort, it's <span style={{ color: C.text, fontWeight: 600 }}>stable</span> (preserves equal elements'
          order) and immune to bad-pivot worst cases — but it costs O(n) extra memory for the merge buffer.
          The standard library sort in many languages (Java, Python's Timsort) is mergesort-flavored for these reasons.
        </div>
      </div>
    </div>
  );
}
