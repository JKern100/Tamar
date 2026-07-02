import { useMemo, useState } from 'react'
import { officialQuestions, topicsForDomain } from '../content'
import { recordAttempt, useStore } from '../store'
import { generateSimilarQuestion } from '../ai'
import QuestionCard from '../components/QuestionCard'
import { DOMAIN_HE, DIFFICULTY_HE } from '../types'
import type { Difficulty, Domain, Question, Attempt } from '../types'

type Phase = 'setup' | 'run' | 'done'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function attemptOf(q: Question, chosen: number, timeMs: number): Attempt {
  return {
    questionId: q.id, domain: q.domain, topic: q.topic, difficulty: q.difficulty,
    origin: q.origin, chosenIndex: chosen, correct: chosen === q.correctIndex, timeMs, at: Date.now(),
  }
}

export default function Practice() {
  const { settings } = useStore()
  const pool = useMemo(() => officialQuestions(), [])

  const [phase, setPhase] = useState<Phase>('setup')
  const [domain, setDomain] = useState<Domain | 'all'>('all')
  const [topic, setTopic] = useState<string>('')
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all')
  const [count, setCount] = useState(10)

  const [quiz, setQuiz] = useState<Question[]>([])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [startedAt, setStartedAt] = useState(0)
  const [sessionResults, setSessionResults] = useState<boolean[]>([])

  // AI similar-question state
  const [ai, setAi] = useState<Question | null>(null)
  const [aiSel, setAiSel] = useState<number | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const topics = useMemo(() => {
    if (domain === 'all') {
      const s = new Set<string>()
      pool.forEach((q) => s.add(q.topic))
      return [...s].sort((a, b) => a.localeCompare(b, 'he'))
    }
    return topicsForDomain(domain)
  }, [domain, pool])

  const available = useMemo(
    () =>
      pool.filter(
        (q) =>
          (domain === 'all' || q.domain === domain) &&
          (!topic || q.topic === topic) &&
          (difficulty === 'all' || q.difficulty === difficulty),
      ),
    [pool, domain, topic, difficulty],
  )

  function start() {
    const picked = shuffle(available).slice(0, Math.min(count, available.length))
    if (picked.length === 0) return
    setQuiz(picked)
    setIdx(0); setSelected(null); setSessionResults([]); setStartedAt(Date.now())
    setAi(null); setAiSel(null); setAiError('')
    setPhase('run')
  }

  function answerMain(i: number) {
    if (selected !== null) return
    setSelected(i)
    const q = quiz[idx]
    recordAttempt(attemptOf(q, i, Date.now() - startedAt))
    setSessionResults((r) => [...r, i === q.correctIndex])
  }

  function next() {
    if (idx + 1 < quiz.length) {
      setIdx(idx + 1); setSelected(null); setStartedAt(Date.now())
      setAi(null); setAiSel(null); setAiError('')
    } else {
      setPhase('done')
    }
  }

  async function makeSimilar() {
    setAiLoading(true); setAiError(''); setAi(null); setAiSel(null)
    try {
      const q = await generateSimilarQuestion(quiz[idx], settings)
      setAi(q)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'שגיאה ביצירת שאלת AI.')
    } finally {
      setAiLoading(false)
    }
  }

  function answerAi(i: number) {
    if (aiSel !== null || !ai) return
    setAiSel(i)
    recordAttempt(attemptOf(ai, i, 0))
  }

  // ---------- Setup ----------
  if (phase === 'setup') {
    return (
      <div className="stack">
        <h1 style={{ margin: 0 }}>✏️ מצב תרגול</h1>
        <div className="card stack">
          <label className="field">
            <span>תחום</span>
            <select className="input" value={domain} onChange={(e) => { setDomain(e.target.value as Domain | 'all'); setTopic('') }}>
              <option value="all">כל התחומים</option>
              {(Object.keys(DOMAIN_HE) as Domain[]).map((d) => <option key={d} value={d}>{DOMAIN_HE[d]}</option>)}
            </select>
          </label>
          <label className="field">
            <span>נושא</span>
            <select className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">כל הנושאים</option>
              {topics.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="field">
            <span>רמת קושי</span>
            <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | 'all')}>
              <option value="all">כל הרמות</option>
              {(Object.keys(DIFFICULTY_HE) as Difficulty[]).map((d) => <option key={d} value={d}>{DIFFICULTY_HE[d]}</option>)}
            </select>
          </label>
          <label className="field">
            <span>מספר שאלות: {count}</span>
            <input type="range" min={1} max={Math.max(1, Math.min(40, available.length))} value={Math.min(count, Math.max(1, available.length))} onChange={(e) => setCount(Number(e.target.value))} />
          </label>
          <div className="spread">
            <span className="small muted">{available.length} שאלות זמינות לבחירה</span>
            <button className="btn primary lg" disabled={available.length === 0} onClick={start}>התחלה</button>
          </div>
        </div>
      </div>
    )
  }

  // ---------- Done ----------
  if (phase === 'done') {
    const correct = sessionResults.filter(Boolean).length
    return (
      <div className="stack">
        <div className="card center">
          <div style={{ fontSize: 44 }}>{correct === quiz.length ? '🏆' : '✅'}</div>
          <h1>סיימת את התרגול</h1>
          <p className="muted">ענית נכון על <strong>{correct}</strong> מתוך <strong>{quiz.length}</strong> שאלות ({Math.round((correct / quiz.length) * 100)}%).</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn primary" onClick={() => setPhase('setup')}>תרגול נוסף</button>
          </div>
        </div>
      </div>
    )
  }

  // ---------- Run ----------
  const q = quiz[idx]
  const answered = selected !== null
  return (
    <div className="stack">
      <div className="progress"><i style={{ width: `${((idx + (answered ? 1 : 0)) / quiz.length) * 100}%` }} /></div>

      <QuestionCard question={q} selected={selected} onSelect={answerMain} reveal={answered} index={idx} total={quiz.length} />

      {answered && (
        <div className="card">
          <div className="spread">
            <button className="btn" onClick={makeSimilar} disabled={aiLoading}>
              {aiLoading ? 'יוצר…' : '🤖 צור שאלה דומה בעזרת AI'}
            </button>
            <button className="btn primary" onClick={next}>{idx + 1 < quiz.length ? 'השאלה הבאה ←' : 'סיום'}</button>
          </div>
          {aiError && <p className="small" style={{ color: 'var(--bad)', marginTop: 10 }}>{aiError}</p>}
        </div>
      )}

      {ai && (
        <QuestionCard question={ai} selected={aiSel} onSelect={answerAi} reveal={aiSel !== null} />
      )}
    </div>
  )
}
