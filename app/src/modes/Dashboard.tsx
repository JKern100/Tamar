import { useMemo } from 'react'
import { officialQuestions } from '../content'
import { useStore } from '../store'
import { CitationView, Empty } from '../ui'
import { DOMAIN_HE } from '../types'
import type { Attempt, Citation, Domain } from '../types'

function pct(correct: number, n: number) {
  return n ? Math.round((correct / n) * 100) : 0
}

export default function Dashboard() {
  const { attempts } = useStore()

  const topicCitations = useMemo(() => {
    const m = new Map<string, Citation>()
    for (const q of officialQuestions()) if (q.citation && !m.has(q.topic)) m.set(q.topic, q.citation)
    return m
  }, [])

  const stats = useMemo(() => computeStats(attempts), [attempts])

  if (attempts.length === 0) {
    return (
      <div className="stack">
        <h1 style={{ margin: 0 }}>📊 לוח התקדמות</h1>
        <Empty>עדיין לא תרגלת. אחרי כמה שאלות יופיעו כאן ניתוח ביצועים והמלצות מה ללמוד.</Empty>
      </div>
    )
  }

  const recommendations = stats.topics
    .filter((t) => t.n >= 2)
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 3)

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>📊 לוח התקדמות</h1>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div className="stat"><div className="n">{stats.n}</div><div className="l">שאלות שנענו</div></div>
        <div className="stat"><div className="n">{pct(stats.correct, stats.n)}%</div><div className="l">דיוק כולל</div></div>
        <div className="stat"><div className="n">{stats.avgSec}s</div><div className="l">זמן ממוצע לשאלה</div></div>
        <div className="stat"><div className="n">{stats.official}</div><div className="l">שאלות רשמיות</div></div>
        <div className="stat"><div className="n">{stats.ai}</div><div className="l">שאלות AI</div></div>
      </div>

      {recommendations.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>💡 מומלץ לחזור על</h3>
          <div className="stack">
            {recommendations.map((t) => (
              <div key={t.topic} className="official-strip">
                <div className="spread">
                  <strong>{t.topic}</strong>
                  <span className={'badge ' + (t.acc < 50 ? 'bad' : 'topic')}>{t.acc}% דיוק · {t.n} שאלות</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  {topicCitations.has(t.topic)
                    ? <CitationView citation={topicCitations.get(t.topic)} />
                    : <span className="small muted">חזרו על נושא זה בחומרי המקור.</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>לפי תחום</h3>
        <div className="stack">
          {(Object.keys(DOMAIN_HE) as Domain[]).map((d) => {
            const s = stats.domains[d]
            if (!s || s.n === 0) return null
            const acc = pct(s.correct, s.n)
            return (
              <div key={d}>
                <div className="spread small"><span>{DOMAIN_HE[d]}</span><span className="muted">{acc}% · {s.n} שאלות</span></div>
                <div className="progress"><i style={{ width: `${acc}%`, background: acc < 50 ? 'var(--bad)' : 'var(--primary)' }} /></div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>לפי נושא</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'start', color: 'var(--text-soft)' }}>
              <th style={{ textAlign: 'start', padding: '6px 4px' }}>נושא</th>
              <th style={{ padding: '6px 4px' }}>שאלות</th>
              <th style={{ padding: '6px 4px' }}>דיוק</th>
              <th style={{ padding: '6px 4px' }}>זמן ממוצע</th>
            </tr>
          </thead>
          <tbody>
            {stats.topics.sort((a, b) => a.acc - b.acc).map((t) => (
              <tr key={t.topic} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '7px 4px' }}>{t.topic}</td>
                <td style={{ textAlign: 'center' }}>{t.n}</td>
                <td style={{ textAlign: 'center', color: t.acc < 50 ? 'var(--bad)' : 'inherit' }}>{t.acc}%</td>
                <td style={{ textAlign: 'center' }}>{t.avgSec ? t.avgSec + 's' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function computeStats(attempts: Attempt[]) {
  const domains: Partial<Record<Domain, { n: number; correct: number }>> = {}
  const topicMap = new Map<string, { n: number; correct: number; timeSum: number; timed: number }>()
  let correct = 0, official = 0, ai = 0, timeSum = 0, timed = 0

  for (const a of attempts) {
    if (a.correct) correct++
    if (a.origin === 'ai') ai++; else official++
    const d = (domains[a.domain] ||= { n: 0, correct: 0 })
    d.n++; if (a.correct) d.correct++
    const t = topicMap.get(a.topic) ?? { n: 0, correct: 0, timeSum: 0, timed: 0 }
    t.n++; if (a.correct) t.correct++
    if (a.timeMs > 0) { t.timeSum += a.timeMs; t.timed++; timeSum += a.timeMs; timed++ }
    topicMap.set(a.topic, t)
  }

  const topics = [...topicMap.entries()].map(([topic, v]) => ({
    topic, n: v.n, acc: pct(v.correct, v.n),
    avgSec: v.timed ? Math.round(v.timeSum / v.timed / 1000) : 0,
  }))

  return {
    n: attempts.length, correct, official, ai,
    avgSec: timed ? Math.round(timeSum / timed / 1000) : 0,
    domains, topics,
  }
}
