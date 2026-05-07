# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

```
algo-visualizer/
├── algorithms/          # one self-contained .jsx per algorithm
├── viewer/              # Vite + React app that hosts the visualizers
├── CLAUDE.md            # this file
└── README.md            # user-facing intro and how to run
```

`algorithms/` holds seven sibling `.jsx` files, each `default-export`ing a single React component. They depend only on `react` (`useState`, `useCallback`, `useRef`, `useEffect`) and are intended to be consumed by `viewer/` — but each file is also self-contained enough to drop into any other React host.

- **Graph**: `bfs-visualizer.jsx`, `dfs-visualizer.jsx`, `dijkstra-visualizer.jsx`
- **Sorting**: `quicksort-visualizer.jsx`, `mergesort-visualizer.jsx`, `heapsort-visualizer.jsx`
- **String**: `kmp-visualizer.jsx`

`viewer/` is a minimal Vite scaffold whose `vite.config.js` sets `server.fs.allow: ['..']` so it can import from the parent `algorithms/` directory. `viewer/src/App.jsx` is the tab bar that picks one component to render.

## Architecture: the "step-generator + player" pattern

All seven visualizers share the same structure. Understand this once and the whole repo is legible:

1. **Constants at top** — input data (graph adjacency + edge weights, node positions, `TEXT`/`PATTERN`, or seed arrays) and one or more `PSEUDOCODE` arrays of `{ id, indent, text }` lines.
2. **`generate*Steps(...)` function** — runs the algorithm eagerly and pushes a snapshot onto a `steps` array at each meaningful state change. Each snapshot includes:
   - `highlightLines: number[]` — which `PSEUDOCODE` line ids are active right now
   - The full algorithm state at that moment (e.g. `visited`/`queue` for BFS; `i`/`j`/`lps`/`matchedRanges` for KMP; `array`/`pivotIdx`/`tree`/`settled` for sorts; `dist`/`prev`/`pq`/`settled` for Dijkstra)
   - `description` — human-readable narration shown in the step bar
   - `phase` — short tag (`init`, `dequeue`, `compare`, `swap`, `relax`, `done`, …) used for styling/branching
3. **Module-scope step array** — `const allSteps = generate...()` (or `const phase1Steps`, `phase2Steps` for two-phase visualizers) runs once at import time. The component is a pure projection of `allSteps[step]`; advancing the step index re-renders everything.
4. **Player shell** — `step` state, play/pause via `setInterval` in a `useEffect`, prev/next buttons, speed presets (2000/1000/500 ms), and a `<input type="range">` scrubber. KMP, Quicksort, Mergesort, and Heapsort factor this into file-local `Controls`, `StepBar`, and `PseudocodePanel` components; BFS, DFS, and Dijkstra inline it.
5. **Two-phase visualizers** — KMP, Quicksort, Mergesort, and Heapsort each split the algorithm into a "subroutine" phase and a "full algorithm" phase, with separate step arrays per phase and a header tab to switch. The subroutine phase isolates the visually interesting inner loop (LPS build / Lomuto partition / merge / sift-down) so it can be understood in isolation before seeing it composed.
6. **Color palette** — each file declares its own `colors`/`C` object sharing the same dark base (`#0f1117` bg, `#181b24` surface). Accent colors are unique per algorithm: BFS green, DFS purple, Dijkstra cyan, KMP amber, Quicksort pink, Mergesort orange, Heapsort indigo.

When changing algorithm behavior, the rule is: **mutate state, then push a new snapshot** — never push a snapshot referencing the live mutable objects (note the `new Set(visited)`, `[...queue]`, `{ ...dist }`, `tree.map(n => ({...n}))` clones throughout). A missed clone will cause every prior step to retroactively show the final state.

## Editing notes

- **Adding a new algorithm**: drop a new `your-algo-visualizer.jsx` into `algorithms/`, then add it to the `TABS` array in `viewer/src/App.jsx`. Clone the closest existing file (BFS/DFS/Dijkstra for graph; Quicksort/Mergesort/Heapsort for sorts; KMP for string) and keep the step-generator + player split. The factored-out `Controls` / `StepBar` / `PseudocodePanel` helpers are file-local in each multi-phase visualizer — promote to `algorithms/_shared.jsx` only if a real reuse case appears.
- **Changing the input data**: BFS, DFS, and Dijkstra share the same node positions and edge layout by convention (copy-pasted, not imported — Dijkstra additionally carries weights). If you change one, decide whether the others should track it.
- **Pseudocode line ids** are referenced by `highlightLines` in the step generator. Renumbering pseudocode requires updating every `highlightLines: [...]` in the same file — there is no symbolic mapping.
- All styling is **inline `style={{}}` objects**. There is no CSS file, no Tailwind, no styled-components. Keep it that way unless the host project dictates otherwise.
- Files use `'JetBrains Mono'` / `'Fira Code'` / `'SF Mono'` as the font stack; `viewer/index.html` already provides the monospace fallback.

## Running

```
cd viewer && npm install && npm run dev
```

Vite serves at `http://localhost:5173`. HMR picks up edits in both `viewer/` and `algorithms/`.
