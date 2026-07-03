import { useMemo, useState } from 'react'
import { examples, exampleTopics } from '../content'
import { SourceBadge, CitationView, Pill, Empty, MathText } from '../ui'
import { DIFFICULTY_HE } from '../types'
import type { WorkedExample } from '../types'

export default function Examples() {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<string | null>(null)
  const topics = useMemo(() => exampleTopics(), [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return examples.filter((e) => {
      if (topic && e.topic !== topic) return false
      if (!q) return true
      return [e.stem, e.answer, e.explanation.text, e.topic]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(q))
    })
  }, [query, topic])

  return (
    <div className="stack">
      <div className="spread">
        <h1 style={{ margin: 0 }}>📊 דוגמאות פתורות</h1>
        <span className="small muted">{examples.length} שאלות עם פתרון מלא</span>
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        שאלות רשמיות עם תרשים, המוצגות עם פתרון מלא שלב-אחר-שלב. במקור אלו שאלות רב-ברירה, אך היסחי
        התשובות המקוריים אינם מופיעים בקובצי המקור, ולכן הן מוצגות כדוגמאות פתורות (ללא ניחוש) — ללא
        המצאת מסיחים.
      </p>

      {examples.length === 0 ? (
        <Empty>אין עדיין דוגמאות פתורות.</Empty>
      ) : (
        <>
          <div className="card">
            <input
              className="input"
              placeholder="חיפוש בדוגמאות…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="pill-tabs" style={{ marginTop: 12 }}>
              <Pill active={topic === null} onClick={() => setTopic(null)}>הכול</Pill>
              {topics.map((t) => (
                <Pill key={t} active={topic === t} onClick={() => setTopic(t)}>{t}</Pill>
              ))}
            </div>
          </div>

          {results.length === 0 ? (
            <Empty>לא נמצאו דוגמאות מתאימות.</Empty>
          ) : (
            <div className="stack">
              {results.map((e) => <ExampleCard key={e.id} e={e} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ExampleCard({ e }: { e: WorkedExample }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card official-strip">
      <div className="spread" style={{ marginBottom: 10 }}>
        <div className="row" style={{ gap: 8 }}>
          <span className="badge topic">{e.topic}</span>
          {e.difficulty && <span className="badge topic">{DIFFICULTY_HE[e.difficulty]}</span>}
        </div>
        <SourceBadge origin={e.origin} />
      </div>

      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 14, unicodeBidi: 'plaintext' }}><MathText>{e.stem}</MathText></div>

      {e.figure && (
        <div
          className="figure"
          role="img"
          aria-label={e.figure.alt || 'תרשים לשאלה'}
          dangerouslySetInnerHTML={{ __html: e.figure.svg }}
        />
      )}

      {!open ? (
        <button className="btn primary" onClick={() => setOpen(true)}>הצג פתרון</button>
      ) : (
        <div>
          <div className="badge ok" style={{ fontSize: 14, unicodeBidi: 'plaintext' }}>תשובה: <MathText>{e.answer}</MathText></div>
          <div className="card" style={{ marginTop: 12, background: 'var(--surface-2)' }}>
            <strong>פתרון</strong>
            <p style={{ margin: '6px 0 0', unicodeBidi: 'plaintext' }}><MathText>{e.explanation.text}</MathText></p>
          </div>
          <div style={{ marginTop: 12 }}>
            <CitationView citation={e.citation} verified={e.verified} />
          </div>
        </div>
      )}
    </div>
  )
}
