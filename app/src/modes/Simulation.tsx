import { useEffect, useMemo, useRef, useState } from 'react'
import { officialQuestions } from '../content'
import { recordAttempt, useStore } from '../store'
import QuestionCard from '../components/QuestionCard'
import { DOMAIN_HE } from '../types'
import type { Domain, Question } from '../types'

interface Section { domain: Domain; label: string; questions: Question[]; seconds: number }

function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}

function buildSections(): Section[] {
  const byDomain: Partial<Record<Domain, Question[]>> = {}
  for (const q of officialQuestions()) (byDomain[q.domain] ||= []).push(q)
  const order: Domain[] = ['quantitative', 'verbal', 'english', 'writing']
  const sections: Section[] = []
  for (const d of order) {
    const qs = byDomain[d]
    if (!qs || qs.length === 0) continue
    const picked = shuffle(qs).slice(0, 20)
    sections.push({ domain: d, label: DOMAIN_HE[d], questions: picked, seconds: picked.length * 50 })
  }
  return sections
}

function fmt(s: number) {
  const m = Math.floor(s / 60), ss = s % 60
  return `${m}:${ss.toString().padStart(2, '0')}`
}

export default function Simulation() {
  const { settings } = useStore()
  const [phase, setPhase] = useState<'config' | 'run' | 'done'>('config')
  const [sections, setSections] = useState<Section[]>([])
  const [sIdx, setSIdx] = useState(0)
  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [scores, setScores] = useState<{ label: string; correct: number; total: number }[]>([])
  const submitRef = useRef<() => void>(() => {})

  const preview = useMemo(() => buildSections(), [])

  function start() {
    const s = buildSections()
    if (s.length === 0) return
    setSections(s); setSIdx(0); setQIdx(0); setAnswers({}); setScores([])
    setTimeLeft(s[0].seconds); setPhase('run')
  }

  function submitSection() {
    const sec = sections[sIdx]
    let correct = 0
    for (const q of sec.questions) {
      const chosen = answers[q.id]
      if (chosen == null) continue
      const ok = chosen === q.correctIndex
      if (ok) correct++
      recordAttempt({
        questionId: q.id, domain: q.domain, topic: q.topic, difficulty: q.difficulty,
        origin: q.origin, chosenIndex: chosen, correct: ok, timeMs: 0, at: Date.now(),
      })
    }
    const nextScores = [...scores, { label: sec.label, correct, total: sec.questions.length }]
    setScores(nextScores)
    if (sIdx + 1 < sections.length) {
      const n = sIdx + 1
      setSIdx(n); setQIdx(0); setTimeLeft(sections[n].seconds)
    } else {
      setPhase('done')
    }
  }
  submitRef.current = submitSection

  // countdown
  useEffect(() => {
    if (phase !== 'run') return
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); submitRef.current() ; return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase, sIdx])

  if (phase === 'config') {
    return (
      <div className="stack">
        <h1 style={{ margin: 0 }}>⏱️ מצב סימולציה</h1>
        <div className="card">
          <div className="badge official" style={{ marginBottom: 10 }}>✓ שאלות מקוריות מתוך קובצי Campus IL</div>
          {preview.length === 0 ? (
            <p className="muted">אין כרגע מספיק שאלות רשמיות לבניית סימולציה.</p>
          ) : (
            <>
              <p className="muted">הסימולציה כוללת את המקטעים הבאים, כל אחד עם זמן קצוב:</p>
              <div className="stack">
                {preview.map((s) => (
                  <div className="spread official-strip" key={s.domain}>
                    <strong>{s.label}</strong>
                    <span className="small muted">{s.questions.length} שאלות · {fmt(s.seconds)} דקות</span>
                  </div>
                ))}
              </div>
              {settings.allowMixedSimulation && (
                <p className="small" style={{ color: 'var(--ai)', marginTop: 10 }}>הגדרת שילוב שאלות AI פעילה, אך סימולציה זו כוללת שאלות רשמיות בלבד.</p>
              )}
              <button className="btn primary lg" style={{ marginTop: 14 }} onClick={start}>התחלת סימולציה</button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    const totalCorrect = scores.reduce((n, s) => n + s.correct, 0)
    const totalQ = scores.reduce((n, s) => n + s.total, 0)
    return (
      <div className="stack">
        <div className="card center">
          <div style={{ fontSize: 44 }}>⏱️</div>
          <h1>הסימולציה הסתיימה</h1>
          <p className="muted">ציון כולל: <strong>{totalCorrect}/{totalQ}</strong> ({totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0}%)</p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>ציון לפי מקטע</h3>
          <div className="stack">
            {scores.map((s) => (
              <div key={s.label}>
                <div className="spread small"><span>{s.label}</span><span className="muted">{s.correct}/{s.total}</span></div>
                <div className="progress"><i style={{ width: `${s.total ? (s.correct / s.total) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
          <button className="btn primary" style={{ marginTop: 14 }} onClick={() => setPhase('config')}>סימולציה חדשה</button>
        </div>
      </div>
    )
  }

  // run
  const sec = sections[sIdx]
  const q = sec.questions[qIdx]
  const answeredCount = sec.questions.filter((x) => answers[x.id] != null).length
  return (
    <div className="stack">
      <div className="spread">
        <div className="badge topic">מקטע {sIdx + 1}/{sections.length} · {sec.label}</div>
        <div className={'timer' + (timeLeft < 30 ? ' low' : '')}>⏱️ {fmt(timeLeft)}</div>
      </div>

      <QuestionCard
        question={q}
        selected={answers[q.id] ?? null}
        onSelect={(i) => setAnswers((a) => ({ ...a, [q.id]: i }))}
        reveal={false}
        quiet
        index={qIdx}
        total={sec.questions.length}
      />

      {/* Answer sheet */}
      <div className="card">
        <div className="spread" style={{ marginBottom: 8 }}>
          <span className="small muted">גיליון תשובות — {answeredCount}/{sec.questions.length} סומנו</span>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {sec.questions.map((x, i) => (
            <button
              key={x.id}
              className={'btn' + (i === qIdx ? ' primary' : '')}
              style={{ width: 40, padding: '6px 0', opacity: answers[x.id] != null && i !== qIdx ? 0.6 : 1, borderColor: answers[x.id] != null ? 'var(--ok)' : undefined }}
              onClick={() => setQIdx(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="spread" style={{ marginTop: 12 }}>
          <button className="btn" disabled={qIdx === 0} onClick={() => setQIdx(qIdx - 1)}>→ הקודמת</button>
          {qIdx + 1 < sec.questions.length
            ? <button className="btn" onClick={() => setQIdx(qIdx + 1)}>הבאה ←</button>
            : <span />}
          <button className="btn primary" onClick={submitSection}>
            {sIdx + 1 < sections.length ? 'סיום מקטע →' : 'סיום סימולציה'}
          </button>
        </div>
      </div>
    </div>
  )
}
