# algo-visualizer

Interactive React visualizers for classic algorithms. Step through the execution one click at a time, with the relevant pseudocode line highlighted alongside.

Seven algorithms across three categories — graph, sorting, and string — each in its own self-contained `.jsx` file under `algorithms/`. A small Vite app under `viewer/` ties them together with a tab bar.

## Algorithms

### Graph
- **BFS** — Breadth-First Search on a 6-node graph. Watch the queue grow level-by-level and the traversal order build up.
- **DFS** — Depth-First Search on the same graph. Watch the stack grow as far as it can before backtracking.
- **Dijkstra** — Single-source shortest paths on a weighted version of the same graph. Distance map, priority queue, and a moment where one node's tentative distance gets relaxed when a shorter route is discovered.

### Sorting
- **Quicksort** — Lomuto partition (phase 1) and full recursive sort (phase 2), with a recursion tree showing each call's slice and the pivot it settles.
- **Mergesort** — Merge subroutine on two pre-sorted arrays (phase 1) and full divide-and-conquer (phase 2), with a recursion tree that turns from "splitting" → "merging" → "done".
- **Heapsort** — Build max-heap (phase 1) and extract-max sort (phase 2). Includes a binary-tree visualization of the heap alongside the array bars, showing the array/heap duality directly.

### String
- **KMP** — Knuth-Morris-Pratt: build the LPS table (phase 1) and search using it (phase 2). Demonstrates the "smart shift" that gives KMP its O(n + m) guarantee.

## Running locally

Requires Node 18+.

```
cd viewer
npm install
npm run dev
```

Open http://localhost:5173 and use the tab bar to switch between algorithms.

## Project layout

```
algo-visualizer/
├── algorithms/
│   ├── bfs-visualizer.jsx
│   ├── dfs-visualizer.jsx
│   ├── dijkstra-visualizer.jsx
│   ├── kmp-visualizer.jsx
│   ├── quicksort-visualizer.jsx
│   ├── mergesort-visualizer.jsx
│   └── heapsort-visualizer.jsx
├── viewer/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx        # tab bar
│       └── main.jsx
├── CLAUDE.md              # architecture notes
└── README.md
```

Each algorithm file is independent — only depends on `react`. You can copy any single file into another React project and it will render unchanged.

## How each visualizer works

All seven follow the same "step-generator + player" pattern:

1. The algorithm runs eagerly at module-import time, pushing a snapshot onto a `steps` array at every meaningful state change. Each snapshot captures the algorithm's full state plus a `description` line and a `highlightLines` array indicating which pseudocode lines are active.
2. The component is a pure projection of `steps[stepIndex]` — advancing the index re-renders everything. No live reactive state, no `useEffect` chains driving state.
3. Player UI (play/pause, prev/next, speed presets, scrubber) just drives the index.

KMP, Quicksort, Mergesort, and Heapsort each split into two phases — a subroutine phase (LPS build / partition / merge / sift-down) and a full-algorithm phase — so the visually interesting inner loop can be understood before seeing it composed.

See [`CLAUDE.md`](./CLAUDE.md) for the full architectural breakdown, including the conventions for snapshot cloning, color palettes, and how to add a new algorithm.

## Adding a new algorithm

1. Drop a new `your-algo-visualizer.jsx` into `algorithms/` — clone the closest existing file as a starting point.
2. Keep the structure: input constants → `PSEUDOCODE` array → `generate*Steps` function → component with player.
3. Add it to the `TABS` array in [`viewer/src/App.jsx`](./viewer/src/App.jsx).

Vite picks up the new file via HMR — no build step needed.
