import type { Question } from '../types'
import { SourceBadge, AiBanner, CitationView, MathText } from '../ui'
import { DIFFICULTY_HE } from '../types'

interface Props {
  question: Question
  selected: number | null
  onSelect: (index: number) => void
  /** When true, show correctness colouring + explanation. */
  reveal: boolean
  /** Hide the source badge/citation (e.g. mid-exam). */
  quiet?: boolean
  index?: number
  total?: number
}

export default function QuestionCard({ question: q, selected, onSelect, reveal, quiet, index, total }: Props) {
  const isAi = q.origin === 'ai'
  const dir = q.ltr ? 'ltr' : 'rtl'

  return (
    <div className={isAi ? 'ai-frame' : 'card'}>
      <div className="spread" style={{ marginBottom: 10 }}>
        <div className="row" style={{ gap: 8 }}>
          {index != null && total != null && (
            <span className="badge topic">שאלה {index + 1} מתוך {total}</span>
          )}
          <span className="badge topic">{q.topic}</span>
          {q.difficulty && <span className="badge topic">{DIFFICULTY_HE[q.difficulty]}</span>}
        </div>
        {!quiet && <SourceBadge origin={q.origin} />}
      </div>

      {isAi && <AiBanner />}

      <div style={{ direction: dir, fontSize: 17, fontWeight: 600, marginBottom: 16, unicodeBidi: 'plaintext' }}>
        <MathText>{q.stem}</MathText>
      </div>

      {q.figure && (
        // SVG is trusted build-time content (from our own extraction), not runtime
        // user input. Rendered LTR because SVG coordinates are left-to-right.
        <div
          className="figure"
          role="img"
          aria-label={q.figure.alt || 'תרשים לשאלה'}
          dangerouslySetInnerHTML={{ __html: q.figure.svg }}
        />
      )}

      <div className="stack" style={{ direction: dir }}>
        {q.choices.map((choice, i) => {
          let cls = 'choice'
          if (reveal) {
            if (i === q.correctIndex) cls += ' correct'
            else if (i === selected) cls += ' wrong'
          } else if (i === selected) cls += ' selected'
          return (
            <button
              key={i}
              className={cls}
              disabled={reveal}
              onClick={() => onSelect(i)}
              style={{ unicodeBidi: 'plaintext' }}
            >
              <span className="marker">{i + 1}</span>
              <span style={{ unicodeBidi: 'plaintext' }}>{choice}</span>
            </button>
          )
        })}
      </div>

      {reveal && (
        <div style={{ marginTop: 16 }}>
          <div className={selected === q.correctIndex ? 'badge ok' : 'badge bad'} style={{ fontSize: 14 }}>
            {selected === q.correctIndex ? '✓ תשובה נכונה' : '✗ תשובה שגויה'}
          </div>
          {q.explanation && (
            <div className="card" style={{ marginTop: 12, background: 'var(--surface-2)' }}>
              <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                <strong>הסבר</strong>
                {q.explanation.origin === 'ai' && (
                  <span className="badge ai">🤖 {q.explanation.basedOnOfficial ? 'הסבר שנוצר על ידי AI על בסיס חומר המקור' : 'הסבר שנוצר על ידי AI'}</span>
                )}
              </div>
              <p style={{ margin: 0, unicodeBidi: 'plaintext' }}><MathText>{q.explanation.text}</MathText></p>
            </div>
          )}
          {!quiet && q.origin === 'official' && (
            <div style={{ marginTop: 12 }}>
              <CitationView citation={q.citation} verified={q.verified} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
