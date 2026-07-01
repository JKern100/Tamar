import { useMemo, useState } from 'react'
import { officialQuestions } from '../content'
import { useStore, recordAttempt, lastAttemptFor } from '../store'
import QuestionCard from '../components/QuestionCard'
import { Empty } from '../ui'
import type { Question } from '../types'

export default function Review() {
  const { attempts } = useStore()

  // Current mistakes = official questions whose most-recent attempt was wrong.
  const mistakesByTopic = useMemo(() => {
    const groups: Record<string, Question[]> = {}
    for (const q of officialQuestions()) {
      const last = lastAttemptFor(attempts, q.id)
      if (last && !last.correct) (groups[q.topic] ||= []).push(q)
    }
    return groups
  }, [attempts])

  const topics = Object.keys(mistakesByTopic).sort((a, b) => a.localeCompare(b, 'he'))
  const total = topics.reduce((n, t) => n + mistakesByTopic[t].length, 0)
  const aiMistakes = attempts.filter((a) => a.origin === 'ai' && !a.correct).length

  if (total === 0) {
    return (
      <div className="stack">
        <h1 style={{ margin: 0 }}>🔁 חזרה על טעויות</h1>
        <Empty>
          אין טעויות פתוחות לחזרה 🎉<br />
          <span className="small">טעויות בשאלות רשמיות יופיעו כאן, מקובצות לפי נושא.</span>
        </Empty>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="spread">
        <h1 style={{ margin: 0 }}>🔁 חזרה על טעויות</h1>
        <span className="small muted">
          {total} טעויות ב-{topics.length} נושאים
          {aiMistakes > 0 && <> · {aiMistakes} בשאלות AI</>}
        </span>
      </div>

      {topics.map((t) => (
        <div className="card" key={t}>
          <h3 style={{ marginTop: 0 }}>{t} <span className="small muted">({mistakesByTopic[t].length})</span></h3>
          <div className="stack">
            {mistakesByTopic[t].map((q) => <RetryRow key={q.id} q={q} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function RetryRow({ q }: { q: Question }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)

  function answer(i: number) {
    if (selected !== null) return
    setSelected(i)
    recordAttempt({
      questionId: q.id, domain: q.domain, topic: q.topic, difficulty: q.difficulty,
      origin: q.origin, chosenIndex: i, correct: i === q.correctIndex, timeMs: 0, at: Date.now(),
    })
  }

  if (!open) {
    return (
      <div className="spread" style={{ padding: '4px 0' }}>
        <span style={{ unicodeBidi: 'plaintext' }}>{q.stem.slice(0, 90)}{q.stem.length > 90 ? '…' : ''}</span>
        <button className="btn" onClick={() => { setOpen(true); setSelected(null) }}>תרגול שוב</button>
      </div>
    )
  }
  return <QuestionCard question={q} selected={selected} onSelect={answer} reveal={selected !== null} />
}
