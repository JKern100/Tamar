import type { ReactNode } from 'react'
import type { Citation, Origin } from './types'

/**
 * Render mixed Hebrew + math text safely. Equations like "d=√2·c=√2·2a" are
 * left-to-right; embedded in right-to-left Hebrew they can get visually
 * scrambled by the bidi algorithm (browser/width dependent). We wrap each math
 * run in its own left-to-right isolate so it can never be reordered, while
 * leaving the Hebrew (and the spaces/punctuation between) in normal RTL flow.
 * Not used for answer choices — those are single expressions already isolated.
 */
const HEBREW = /[^֐-׿]+/g
export function MathText({ children }: { children?: string | null }) {
  const t = children ?? ''
  if (!t) return null
  const nodes: ReactNode[] = []
  let key = 0
  let last = 0
  let m: RegExpExecArray | null
  const re = new RegExp(HEBREW)
  while ((m = re.exec(t))) {
    if (m.index > last) nodes.push(t.slice(last, m.index))
    const run = m[0]
    if (/[A-Za-z0-9]/.test(run)) {
      const lead = run.match(/^\s+/)?.[0] ?? ''
      const tail = run.match(/[\s.,;:!?]+$/)?.[0] ?? ''
      const core = run.slice(lead.length, run.length - (tail.length || 0))
      if (lead) nodes.push(lead)
      if (core) nodes.push(<span key={key++} className="ltr-math">{core}</span>)
      if (tail) nodes.push(tail)
    } else {
      nodes.push(run)
    }
    last = m.index + run.length
  }
  if (last < t.length) nodes.push(t.slice(last))
  return <>{nodes}</>
}

/** The badge that makes official-vs-AI unmistakable, shown on every item. */
export function SourceBadge({ origin }: { origin: Origin }) {
  return origin === 'ai' ? (
    <span className="badge ai" title="נוצר על ידי AI — אינה שאלה רשמית">🤖 נוצר על ידי AI</span>
  ) : (
    <span className="badge official" title="מקור רשמי Campus IL">✓ מקור רשמי</span>
  )
}

/** Prominent banner for AI-generated questions — required labeling. */
export function AiBanner() {
  return (
    <div className="ai-banner">
      <span>⚠️</span>
      <span>שאלה זו נוצרה על ידי AI ואינה שאלה רשמית ממבחני המרכז הארצי או Campus IL.</span>
    </div>
  )
}

export function CitationView({ citation, verified }: { citation?: Citation; verified?: boolean }) {
  if (!citation) {
    return <span className="citation unverified">⚠︎ לא אומת מתוך קובצי המקור</span>
  }
  const parts: string[] = [`מקור: ${citation.pdfTitle}`]
  if (citation.section) parts.push(citation.section)
  if (citation.page) parts.push(`עמוד ${citation.page}`)
  if (citation.questionNumber != null) parts.push(`שאלה ${citation.questionNumber}`)
  return (
    <span className="citation" title="מקור החומר בקובצי Campus IL">
      📄 {parts.join(' · ')}
      {verified === false && <strong className="unverified"> · לא אומת מתוך קובצי המקור</strong>}
    </span>
  )
}

export function Pill({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button className={'pill' + (active ? ' active' : '')} onClick={onClick} type="button">
      {children}
    </button>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card center muted" style={{ padding: '40px 20px' }}>{children}</div>
}
