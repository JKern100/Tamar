import { useMemo, useState } from 'react'
import { formulas, formulaTopics } from '../content'
import { useStore, toggleBookmark } from '../store'
import { CitationView, Pill, Empty } from '../ui'
import type { FormulaEntry } from '../types'

export default function Formulas() {
  const { bookmarkedFormulas } = useStore()
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<string | null>(null)
  const [onlyMarked, setOnlyMarked] = useState(false)
  const topics = useMemo(() => formulaTopics(), [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return formulas.filter((f) => {
      if (topic && f.topic !== topic) return false
      if (onlyMarked && !bookmarkedFormulas.includes(f.id)) return false
      if (!q) return true
      return [f.name, f.formula, f.explanation, f.example, f.topic]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(q))
    })
  }, [query, topic, onlyMarked, bookmarkedFormulas])

  return (
    <div className="stack">
      <div className="spread">
        <h1 style={{ margin: 0 }}>📐 דף נוסחאות</h1>
        <span className="small muted">{formulas.length} נוסחאות · {bookmarkedFormulas.length} מסומנות</span>
      </div>

      <div className="card">
        <input
          className="input"
          placeholder="חיפוש נוסחה, כלל או נושא…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
          <div className="pill-tabs">
            <Pill active={topic === null} onClick={() => setTopic(null)}>הכול</Pill>
            {topics.map((t) => (
              <Pill key={t} active={topic === t} onClick={() => setTopic(t)}>{t}</Pill>
            ))}
          </div>
          <label className="row small" style={{ gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={onlyMarked} onChange={(e) => setOnlyMarked(e.target.checked)} />
            מסומנות בלבד ⭐
          </label>
        </div>
      </div>

      {results.length === 0 ? (
        <Empty>לא נמצאו נוסחאות מתאימות.</Empty>
      ) : (
        <div className="stack">
          {results.map((f) => (
            <FormulaCard key={f.id} f={f} marked={bookmarkedFormulas.includes(f.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function FormulaCard({ f, marked }: { f: FormulaEntry; marked: boolean }) {
  return (
    <div className="card official-strip">
      <div className="spread">
        <div className="row" style={{ gap: 8 }}>
          <span className="badge topic">{f.topic}</span>
          <h3 style={{ margin: 0 }}>{f.name}</h3>
        </div>
        <button
          className="btn ghost"
          title={marked ? 'הסרת סימון' : 'סימון להתייחסות'}
          onClick={() => toggleBookmark(f.id)}
        >
          {marked ? '⭐' : '☆'}
        </button>
      </div>

      <div
        style={{
          fontSize: 18,
          direction: 'ltr',
          textAlign: 'center',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          margin: '12px 0',
          unicodeBidi: 'plaintext',
        }}
      >
        {f.formula}
      </div>

      <p style={{ margin: '0 0 8px' }}>{f.explanation}</p>
      {f.example && (
        <p className="small muted" style={{ margin: '0 0 8px' }}>
          <strong>דוגמה: </strong>{f.example}
        </p>
      )}
      {f.aiClarification && (
        <div className="ai-banner" style={{ marginTop: 8 }}>
          <span>🤖</span>
          <span><strong>הבהרה שנוצרה על ידי AI על בסיס נוסחה ממקור רשמי: </strong>{f.aiClarification}</span>
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        <CitationView citation={f.citation} verified={f.verified} />
      </div>
    </div>
  )
}
