import { useState, useCallback, useRef, useEffect } from "react";

// ─── Example Data ────────────────────────────────
const TEXT = "ABABDABACDABABCABAB";
const PATTERN = "ABABCABAB";

// ─── Pseudocode ──────────────────────────────────
const LPS_PSEUDO = [
  { id: 0, indent: 0, text: "buildLPS(pattern):" },
  { id: 1, indent: 1, text: "lps ← [0] * len(pattern)" },
  { id: 2, indent: 1, text: "length ← 0" },
  { id: 3, indent: 1, text: "i ← 1" },
  { id: 4, indent: 1, text: "" },
  { id: 5, indent: 1, text: "while i < len(pattern):" },
  { id: 6, indent: 2, text: "if pattern[i] == pattern[length]:" },
  { id: 7, indent: 3, text: "length += 1" },
  { id: 8, indent: 3, text: "lps[i] = length" },
  { id: 9, indent: 3, text: "i += 1" },
  { id: 10, indent: 2, text: "else:" },
  { id: 11, indent: 3, text: "if length != 0:" },
  { id: 12, indent: 4, text: "length = lps[length - 1]" },
  { id: 13, indent: 3, text: "else:" },
  { id: 14, indent: 4, text: "lps[i] = 0" },
  { id: 15, indent: 4, text: "i += 1" },
  { id: 16, indent: 1, text: "" },
  { id: 17, indent: 1, text: "return lps" },
];

const KMP_PSEUDO = [
  { id: 0, indent: 0, text: "KMP_search(text, pattern):" },
  { id: 1, indent: 1, text: "lps ← buildLPS(pattern)" },
  { id: 2, indent: 1, text: "i ← 0    // text index" },
  { id: 3, indent: 1, text: "j ← 0    // pattern index" },
  { id: 4, indent: 1, text: "" },
  { id: 5, indent: 1, text: "while i < len(text):" },
  { id: 6, indent: 2, text: "if text[i] == pattern[j]:" },
  { id: 7, indent: 3, text: "i += 1" },
  { id: 8, indent: 3, text: "j += 1" },
  { id: 9, indent: 2, text: "" },
  { id: 10, indent: 2, text: "if j == len(pattern):" },
  { id: 11, indent: 3, text: 'found match at index (i - j)' },
  { id: 12, indent: 3, text: "j = lps[j - 1]" },
  { id: 13, indent: 2, text: "" },
  { id: 14, indent: 2, text: "else if text[i] != pattern[j]:" },
  { id: 15, indent: 3, text: "if j != 0:" },
  { id: 16, indent: 4, text: "j = lps[j - 1]" },
  { id: 17, indent: 3, text: "else:" },
  { id: 18, indent: 4, text: "i += 1" },
];

// ─── Step generators ─────────────────────────────
function generateLPSSteps(pattern) {
  const steps = [];
  const n = pattern.length;
  const lps = new Array(n).fill(0);
  let length = 0;
  let i = 1;

  steps.push({
    highlightLines: [0, 1, 2, 3],
    lps: [...lps],
    i: null, length: null,
    compareI: null, compareLen: null,
    description: `Initialize LPS array of size ${n} with all zeros, length = 0, i = 1`,
    phase: "init",
  });

  while (i < n) {
    // Show comparison
    steps.push({
      highlightLines: [5, 6],
      lps: [...lps],
      i, length,
      compareI: i, compareLen: length,
      description: `Compare pattern[${i}]='${pattern[i]}' with pattern[${length}]='${pattern[length]}'`,
      phase: "compare",
    });

    if (pattern[i] === pattern[length]) {
      length++;
      lps[i] = length;

      steps.push({
        highlightLines: [7, 8, 9],
        lps: [...lps],
        i, length,
        compareI: i, compareLen: length - 1,
        description: `Match! length → ${length}, lps[${i}] = ${length}, advance i`,
        phase: "match",
      });

      i++;
    } else {
      if (length !== 0) {
        steps.push({
          highlightLines: [10, 11, 12],
          lps: [...lps],
          i, length,
          compareI: i, compareLen: length,
          description: `Mismatch & length≠0 → fall back: length = lps[${length - 1}] = ${lps[length - 1]}`,
          phase: "fallback",
        });
        length = lps[length - 1];
      } else {
        lps[i] = 0;
        steps.push({
          highlightLines: [13, 14, 15],
          lps: [...lps],
          i, length,
          compareI: i, compareLen: null,
          description: `Mismatch & length=0 → lps[${i}] = 0, advance i`,
          phase: "zero",
        });
        i++;
      }
    }
  }

  steps.push({
    highlightLines: [17],
    lps: [...lps],
    i: null, length: null,
    compareI: null, compareLen: null,
    description: `LPS table complete: [${lps.join(", ")}]`,
    phase: "done",
  });

  return { steps, lps };
}

function generateKMPSteps(text, pattern, lps) {
  const steps = [];
  let i = 0;
  let j = 0;
  const matches = [];

  steps.push({
    highlightLines: [0, 1, 2, 3],
    i: 0, j: 0,
    textHighlight: [],
    patternOffset: 0,
    matchedRanges: [],
    comparing: null,
    description: `Start KMP search: i = 0, j = 0, using precomputed LPS table`,
    phase: "init",
  });

  let safety = 0;
  while (i < text.length && safety < 300) {
    safety++;
    const patOffset = i - j;

    if (text[i] === pattern[j]) {
      steps.push({
        highlightLines: [5, 6, 7, 8],
        i, j,
        textHighlight: Array.from({ length: j + 1 }, (_, k) => patOffset + k),
        patternOffset: patOffset,
        matchedRanges: [...matches],
        comparing: { ti: i, pj: j, match: true },
        description: `text[${i}]='${text[i]}' == pattern[${j}]='${pattern[j]}' → match! i++, j++`,
        phase: "char-match",
      });

      i++;
      j++;

      if (j === pattern.length) {
        const matchStart = i - j;
        matches.push(matchStart);

        steps.push({
          highlightLines: [10, 11, 12],
          i, j: j,
          textHighlight: Array.from({ length: pattern.length }, (_, k) => matchStart + k),
          patternOffset: matchStart,
          matchedRanges: [...matches],
          comparing: null,
          description: `Pattern found at index ${matchStart}! j = lps[${j - 1}] = ${lps[j - 1]}`,
          phase: "found",
        });

        j = lps[j - 1];
      }
    } else {
      if (j !== 0) {
        steps.push({
          highlightLines: [14, 15, 16],
          i, j,
          textHighlight: [],
          patternOffset: patOffset,
          matchedRanges: [...matches],
          comparing: { ti: i, pj: j, match: false },
          description: `text[${i}]='${text[i]}' ≠ pattern[${j}]='${pattern[j]}' → j = lps[${j - 1}] = ${lps[j - 1]} (smart shift)`,
          phase: "mismatch-shift",
        });
        j = lps[j - 1];
      } else {
        steps.push({
          highlightLines: [14, 17, 18],
          i, j,
          textHighlight: [],
          patternOffset: patOffset,
          matchedRanges: [...matches],
          comparing: { ti: i, pj: j, match: false },
          description: `text[${i}]='${text[i]}' ≠ pattern[${j}]='${pattern[j]}' → j=0, just advance i`,
          phase: "mismatch-advance",
        });
        i++;
      }
    }
  }

  steps.push({
    highlightLines: [],
    i: text.length, j: 0,
    textHighlight: [],
    patternOffset: 0,
    matchedRanges: [...matches],
    comparing: null,
    description: matches.length > 0
      ? `Search complete! Found ${matches.length} match(es) at index: ${matches.join(", ")}`
      : `Search complete! No matches found.`,
    phase: "done",
  });

  return steps;
}

const { steps: lpsSteps, lps: finalLPS } = generateLPSSteps(PATTERN);
const kmpSteps = generateKMPSteps(TEXT, PATTERN, finalLPS);

// ─── Colors ──────────────────────────────────────
const C = {
  bg: "#0f1117",
  surface: "#181b24",
  surfaceAlt: "#1e2230",
  border: "#2a2e3d",
  text: "#e2e4ea",
  textDim: "#7a7f91",
  accent: "#e5a54b",
  accentSoft: "rgba(229,165,75,0.13)",
  highlight: "#f4c753",
  highlightSoft: "rgba(244,199,83,0.10)",
  match: "#56d4a0",
  matchSoft: "rgba(86,212,160,0.14)",
  mismatch: "#e06c75",
  mismatchSoft: "rgba(224,108,117,0.16)",
  compare: "#61afef",
  compareSoft: "rgba(97,175,239,0.15)",
  found: "#c678dd",
  foundSoft: "rgba(198,120,221,0.18)",
  edge: "#3a3f52",
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

// ─── Character strip ─────────────────────────────
function CharStrip({ chars, highlights = {}, label, mono }) {
  return (
    <div>
      {label && <div style={{
        fontSize: 9, fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.1em", color: C.textDim, marginBottom: 5,
      }}>{label}</div>}
      <div style={{ display: "flex", gap: 2 }}>
        {chars.map((ch, i) => {
          const hl = highlights[i] || {};
          return (
            <div key={i} style={{
              width: mono ? 28 : 30, height: 34,
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", borderRadius: 4,
              background: hl.bg || "transparent",
              border: hl.border || `1px solid ${C.border}`,
              transition: "all 0.2s",
            }}>
              <span style={{
                fontSize: 14, fontWeight: 700, color: hl.color || C.text,
                fontFamily: "'JetBrains Mono', monospace",
              }}>{ch}</span>
            </div>
          );
        })}
      </div>
      {/* Index row */}
      <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
        {chars.map((_, i) => (
          <div key={i} style={{
            width: mono ? 28 : 30, textAlign: "center",
            fontSize: 9, color: C.textDim, opacity: 0.6,
          }}>{i}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Phase 1: LPS Visualizer ─────────────────────
function LPSPhase({ onComplete }) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const cur = lpsSteps[step];

  const patChars = PATTERN.split("");
  const highlights = {};
  patChars.forEach((_, i) => {
    highlights[i] = { bg: "transparent", border: `1px solid ${C.border}`, color: C.text };
  });
  if (cur.compareI !== null) {
    highlights[cur.compareI] = {
      bg: C.compareSoft, border: `1px solid ${C.compare}`, color: C.compare,
    };
  }
  if (cur.compareLen !== null && cur.compareLen !== cur.compareI) {
    highlights[cur.compareLen] = {
      bg: C.accentSoft, border: `1px solid ${C.accent}`, color: C.accent,
    };
  }
  if (cur.phase === "match" && cur.compareI !== null) {
    highlights[cur.compareI] = {
      bg: C.matchSoft, border: `1px solid ${C.match}`, color: C.match,
    };
  }

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14,
      }}>
        <PseudocodePanel lines={LPS_PSEUDO} highlightLines={cur.highlightLines} title="Phase 1 — Build LPS Table" />

        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 16,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: C.textDim,
            paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
          }}>Pattern & LPS Array</div>

          <CharStrip chars={patChars} highlights={highlights} label="Pattern" mono />

          {/* LPS array */}
          <div>
            <div style={{
              fontSize: 9, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.1em", color: C.textDim, marginBottom: 5,
            }}>LPS Array</div>
            <div style={{ display: "flex", gap: 2 }}>
              {cur.lps.map((v, i) => (
                <div key={i} style={{
                  width: 28, height: 34,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 4, background: v > 0 ? C.matchSoft : C.surfaceAlt,
                  border: `1px solid ${v > 0 ? C.match + "55" : C.border}`,
                  transition: "all 0.2s",
                }}>
                  <span style={{
                    fontSize: 14, fontWeight: 700,
                    color: v > 0 ? C.match : C.textDim,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pointers */}
          <div style={{
            display: "flex", gap: 20, paddingTop: 8,
            borderTop: `1px solid ${C.border}`,
          }}>
            {cur.i !== null && (
              <div style={{ fontSize: 12, color: C.compare }}>
                <span style={{ fontWeight: 700 }}>i</span> = {cur.i}
                <span style={{ color: C.textDim, marginLeft: 4 }}>
                  ('{cur.i < PATTERN.length ? PATTERN[cur.i] : "—"}')
                </span>
              </div>
            )}
            {cur.length !== null && (
              <div style={{ fontSize: 12, color: C.accent }}>
                <span style={{ fontWeight: 700 }}>length</span> = {cur.length}
                <span style={{ color: C.textDim, marginLeft: 4 }}>
                  ('{cur.length < PATTERN.length ? PATTERN[cur.length] : "—"}')
                </span>
              </div>
            )}
          </div>

          {/* What LPS means */}
          <div style={{
            fontSize: 11, color: C.textDim, lineHeight: 1.6,
            paddingTop: 8, borderTop: `1px solid ${C.border}`,
          }}>
            <span style={{ color: C.accent, fontWeight: 600 }}>LPS[i]</span> = length of the longest proper prefix of pattern[0..i] which is also a suffix.
          </div>
        </div>
      </div>

      <StepBar step={step} total={lpsSteps.length} description={cur.description}
        setStep={setStep} setIsPlaying={setIsPlaying} accentColor={C.accent} />
      <div style={{ marginTop: 10 }}>
        <Controls step={step} setStep={setStep} total={lpsSteps.length}
          isPlaying={isPlaying} setIsPlaying={setIsPlaying} speed={speed} setSpeed={setSpeed} />
      </div>

      {cur.phase === "done" && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={onComplete} style={{
            background: C.matchSoft, color: C.match,
            border: `1px solid ${C.match}55`, borderRadius: 8,
            padding: "10px 28px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em",
          }}>Continue to Phase 2: Pattern Matching →</button>
        </div>
      )}
    </div>
  );
}

// ─── Phase 2: KMP Search Visualizer ──────────────
function KMPPhase({ onBack }) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const cur = kmpSteps[step];

  const textChars = TEXT.split("");
  const patChars = PATTERN.split("");

  // Text highlights
  const textHL = {};
  textChars.forEach((_, i) => {
    textHL[i] = { bg: "transparent", border: `1px solid ${C.border}`, color: C.text };
  });

  // Matched ranges (found matches)
  if (cur.matchedRanges) {
    cur.matchedRanges.forEach((start) => {
      for (let k = start; k < start + PATTERN.length; k++) {
        textHL[k] = { bg: C.foundSoft, border: `1px solid ${C.found}55`, color: C.found };
      }
    });
  }

  // Currently matched chars
  if (cur.textHighlight) {
    cur.textHighlight.forEach((idx) => {
      if (!cur.matchedRanges?.some(s => idx >= s && idx < s + PATTERN.length && cur.phase === "found")) {
        textHL[idx] = { bg: C.matchSoft, border: `1px solid ${C.match}55`, color: C.match };
      }
    });
  }

  // Current comparison
  if (cur.comparing) {
    const { ti, match } = cur.comparing;
    textHL[ti] = match
      ? { bg: C.matchSoft, border: `1px solid ${C.match}`, color: C.match }
      : { bg: C.mismatchSoft, border: `1px solid ${C.mismatch}`, color: C.mismatch };
  }

  // Found highlight
  if (cur.phase === "found" && cur.matchedRanges) {
    const last = cur.matchedRanges[cur.matchedRanges.length - 1];
    for (let k = last; k < last + PATTERN.length; k++) {
      textHL[k] = { bg: C.foundSoft, border: `1px solid ${C.found}`, color: C.found };
    }
  }

  // Pattern highlights
  const patHL = {};
  patChars.forEach((_, i) => {
    patHL[i] = { bg: "transparent", border: `1px solid ${C.border}`, color: C.text };
  });
  if (cur.comparing) {
    const { pj, match } = cur.comparing;
    patHL[pj] = match
      ? { bg: C.matchSoft, border: `1px solid ${C.match}`, color: C.match }
      : { bg: C.mismatchSoft, border: `1px solid ${C.mismatch}`, color: C.mismatch };
    // Highlight already matched part of pattern
    for (let k = 0; k < pj; k++) {
      patHL[k] = { bg: C.matchSoft, border: `1px solid ${C.match}55`, color: C.match };
    }
  }

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14,
      }}>
        <PseudocodePanel lines={KMP_PSEUDO} highlightLines={cur.highlightLines} title="Phase 2 — KMP Search" />

        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.12em", color: C.textDim,
            paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
          }}>String Matching</div>

          <div style={{ overflowX: "auto", paddingBottom: 4 }}>
            <CharStrip chars={textChars} highlights={textHL} label={`Text (len=${TEXT.length})`} mono />
          </div>

          {/* Pattern aligned under text */}
          <div style={{ overflowX: "auto", paddingBottom: 4 }}>
            <div style={{
              fontSize: 9, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.1em", color: C.textDim, marginBottom: 5,
            }}>Pattern (offset = {cur.patternOffset})</div>
            <div style={{ display: "flex", gap: 2 }}>
              {/* Spacer for offset */}
              {Array.from({ length: cur.patternOffset }, (_, i) => (
                <div key={`sp-${i}`} style={{ width: 28, height: 34, flexShrink: 0 }} />
              ))}
              {patChars.map((ch, i) => {
                const hl = patHL[i] || {};
                return (
                  <div key={i} style={{
                    width: 28, height: 34, display: "flex", alignItems: "center",
                    justifyContent: "center", borderRadius: 4, flexShrink: 0,
                    background: hl.bg || "transparent",
                    border: hl.border || `1px solid ${C.border}`,
                    transition: "all 0.2s",
                  }}>
                    <span style={{
                      fontSize: 14, fontWeight: 700, color: hl.color || C.text,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>{ch}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LPS reference */}
          <div style={{ paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
            <div style={{
              fontSize: 9, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.1em", color: C.textDim, marginBottom: 5,
            }}>LPS Table (reference)</div>
            <div style={{ display: "flex", gap: 4 }}>
              {finalLPS.map((v, i) => (
                <div key={i} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                }}>
                  <span style={{ fontSize: 10, color: C.textDim }}>{PATTERN[i]}</span>
                  <span style={{
                    width: 22, height: 22, display: "flex", alignItems: "center",
                    justifyContent: "center", borderRadius: 3, fontSize: 11,
                    fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                    background: v > 0 ? C.accentSoft : C.surfaceAlt,
                    color: v > 0 ? C.accent : C.textDim,
                    border: `1px solid ${v > 0 ? C.accent + "44" : C.border}`,
                  }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pointers & matches */}
          <div style={{
            display: "flex", gap: 20, paddingTop: 8,
            borderTop: `1px solid ${C.border}`, flexWrap: "wrap",
          }}>
            <div style={{ fontSize: 12, color: C.compare }}>
              <span style={{ fontWeight: 700 }}>i</span> = {cur.i}
            </div>
            <div style={{ fontSize: 12, color: C.accent }}>
              <span style={{ fontWeight: 700 }}>j</span> = {cur.j}
            </div>
            {cur.matchedRanges && cur.matchedRanges.length > 0 && (
              <div style={{ fontSize: 12, color: C.found }}>
                <span style={{ fontWeight: 700 }}>Matches</span>: [{cur.matchedRanges.join(", ")}]
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{
            display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 8,
            borderTop: `1px solid ${C.border}`,
          }}>
            {[
              { label: "Match", color: C.match },
              { label: "Mismatch", color: C.mismatch },
              { label: "Found", color: C.found },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                <span style={{ fontSize: 10, color: C.textDim }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StepBar step={step} total={kmpSteps.length} description={cur.description}
        setStep={setStep} setIsPlaying={setIsPlaying} accentColor={C.found} />
      <div style={{ marginTop: 10 }}>
        <Controls step={step} setStep={setStep} total={kmpSteps.length}
          isPlaying={isPlaying} setIsPlaying={setIsPlaying} speed={speed} setSpeed={setSpeed} />
      </div>

      <div style={{ textAlign: "center", marginTop: 14 }}>
        <button onClick={onBack} style={{
          background: C.surfaceAlt, color: C.textDim,
          border: `1px solid ${C.border}`, borderRadius: 6,
          padding: "8px 20px", fontSize: 11, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>← Back to Phase 1: LPS Construction</button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────
export default function KMPVisualizer() {
  const [phase, setPhase] = useState(1);

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      padding: "24px 16px", boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: C.accent,
          margin: 0, letterSpacing: "0.04em",
        }}>
          KMP — Knuth-Morris-Pratt
        </h1>
        <p style={{ color: C.textDim, fontSize: 12, margin: "6px 0 0" }}>
          String matching in O(n + m) · Two-phase interactive visualizer
        </p>
        <div style={{
          display: "inline-flex", gap: 4, marginTop: 12,
          background: C.surfaceAlt, borderRadius: 6, padding: 3,
          border: `1px solid ${C.border}`,
        }}>
          {[1, 2].map((p) => (
            <button key={p} onClick={() => setPhase(p)} style={{
              background: phase === p ? (p === 1 ? C.accentSoft : C.foundSoft) : "transparent",
              color: phase === p ? (p === 1 ? C.accent : C.found) : C.textDim,
              border: "none", borderRadius: 4, padding: "6px 16px",
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              Phase {p}: {p === 1 ? "Build LPS" : "Search"}
            </button>
          ))}
        </div>
        {/* Example info */}
        <div style={{
          marginTop: 12, fontSize: 12, color: C.textDim, display: "flex",
          justifyContent: "center", gap: 20, flexWrap: "wrap",
        }}>
          <span>Text: <span style={{ color: C.text, fontWeight: 600 }}>"{TEXT}"</span></span>
          <span>Pattern: <span style={{ color: C.accent, fontWeight: 600 }}>"{PATTERN}"</span></span>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {phase === 1
          ? <LPSPhase onComplete={() => setPhase(2)} />
          : <KMPPhase onBack={() => setPhase(1)} />
        }
      </div>

      {/* Info footer */}
      <div style={{
        maxWidth: 1000, margin: "20px auto 0",
        background: C.surfaceAlt, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: "14px 18px",
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Why KMP?
        </div>
        <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.7 }}>
          Naive string matching backtracks the text pointer on every mismatch, giving O(n×m) worst case.
          KMP never backtracks <span style={{ color: C.text, fontWeight: 600 }}>i</span> — when a mismatch occurs, the
          <span style={{ color: C.accent, fontWeight: 600 }}> LPS table</span> tells us exactly how far to shift the pattern
          (by setting <span style={{ color: C.text, fontWeight: 600 }}>j = lps[j-1]</span>), skipping comparisons we already know will match.
          This guarantees <span style={{ color: C.match, fontWeight: 600 }}>O(n + m)</span> time.
        </div>
      </div>
    </div>
  );
}
