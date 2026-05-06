# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

This directory holds **standalone React algorithm visualizer components**, not a buildable project. There is no `package.json`, no bundler config, no tests, and no README — just three sibling `.jsx` files that each `export default` one component:

- `bfs-visualizer.jsx` — Breadth-First Search on a fixed 6-node graph
- `dfs-visualizer.jsx` — Depth-First Search on the same graph
- `kmp-visualizer.jsx` — KMP string search (LPS table build + scan), two coordinated visualizations in one file

Each file imports only `react` (`useState`, `useCallback`, `useRef`, `useEffect`) and is meant to be dropped into a host React app that provides the toolchain. To work on a file in isolation, copy it into a Vite/CRA scratch project — there's nothing to build here.

## Architecture: the "step-generator + player" pattern

All three visualizers share the same structure. Understand this once and the whole repo is legible:

1. **Constants at top** — input data (graph adjacency, node positions, edges, or `TEXT`/`PATTERN`) and a `PSEUDOCODE` array of `{ id, indent, text }` lines.
2. **`generate*Steps(...)` function** — runs the algorithm eagerly and pushes a snapshot onto a `steps` array at each meaningful state change. Each snapshot includes:
   - `highlightLines: number[]` — which `PSEUDOCODE` line ids are active right now
   - The full algorithm state at that moment (`visited`, `queue`/`stack`, `order`, `currentNode`, `currentNeighbor`, `processingEdge`, or for KMP: `i`, `j`, `lps`, `matchedRanges`, `comparing`, `patternOffset`)
   - `description` — human-readable narration shown in the step bar
   - `phase` — short tag (`init`, `dequeue`, `match`, `mismatch-shift`, `done`, …) used for styling/branching
3. **Module-scope step array** — `const allSteps = generate...()` runs once at import time. The component is a pure projection of `allSteps[step]`; advancing the step index re-renders everything.
4. **Player shell** — `step` state, play/pause via `setInterval` in a `useEffect`, prev/next buttons, speed presets (2000/1000/500 ms), and a `<input type="range">` scrubber. KMP factors this into shared `Controls` and `StepBar` components within the same file; BFS/DFS inline it.
5. **Color palette** — each file declares its own `colors`/`C` object (BFS: green accent, DFS: purple, KMP: amber) sharing the same dark base (`#0f1117` bg, `#181b24` surface, etc.).

When changing algorithm behavior, the rule is: **mutate state, then push a new snapshot** — never push a snapshot referencing the live mutable objects (note the `new Set(visited)`, `[...queue]` clones throughout). A missed clone will cause every prior step to retroactively show the final state.

## Editing notes

- **Adding a new algorithm**: clone the closest existing file (BFS for graph algorithms, KMP for string/array algorithms) and keep the step-generator + player split. KMP's `PseudocodePanel` / `Controls` / `StepBar` / `CharStrip` helpers are reusable but currently file-local — promote them to a shared module only if a third consumer appears.
- **Changing the input data**: BFS and DFS share the same `GRAPH` / `NODE_POSITIONS` / `EDGES` constants by convention (copy-pasted, not imported). If you change one, decide whether the other should track it.
- **Pseudocode line ids** are referenced by `highlightLines` in the step generator. Renumbering pseudocode requires updating every `highlightLines: [...]` in the same file — there is no symbolic mapping.
- All styling is **inline `style={{}}` objects**. There is no CSS file, no Tailwind, no styled-components. Keep it that way unless the host project dictates otherwise.
- Files use `'JetBrains Mono'` / `'Fira Code'` / `'SF Mono'` as the font stack; the host page must provide one of these or accept the monospace fallback.
