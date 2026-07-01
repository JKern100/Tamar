import type { Citation, Origin } from './types'

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
  if (citation.section) parts.push(`פרק ${citation.section}`)
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
