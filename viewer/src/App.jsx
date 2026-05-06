import { useState } from 'react'
import BfsVisualizer from '../../bfs-visualizer.jsx'
import DfsVisualizer from '../../dfs-visualizer.jsx'
import KmpVisualizer from '../../kmp-visualizer.jsx'
import QuicksortVisualizer from '../../quicksort-visualizer.jsx'

const TABS = [
  { id: 'bfs', label: 'BFS', Component: BfsVisualizer },
  { id: 'dfs', label: 'DFS', Component: DfsVisualizer },
  { id: 'kmp', label: 'KMP', Component: KmpVisualizer },
  { id: 'quicksort', label: 'Quicksort', Component: QuicksortVisualizer },
]

export default function App() {
  const [active, setActive] = useState('bfs')
  const Active = TABS.find((t) => t.id === active).Component

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e5e7eb' }}>
      <nav style={{
        display: 'flex',
        gap: 8,
        padding: '12px 16px',
        borderBottom: '1px solid #232735',
        background: '#181b24',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #2a2f40',
              background: active === t.id ? '#2a2f40' : 'transparent',
              color: active === t.id ? '#fff' : '#9ca3af',
              fontFamily: 'inherit',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <Active />
    </div>
  )
}
