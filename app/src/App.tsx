import { useState } from 'react'
import { dataset, questions, formulas } from './content'
import { useStore } from './store'
import { DOMAIN_HE } from './types'

type View = 'home' | 'practice' | 'formulas' | 'simulation' | 'review' | 'dashboard' | 'settings'

const NAV: { view: View; label: string; ico: string }[] = [
  { view: 'home', label: 'בית', ico: '🏠' },
  { view: 'practice', label: 'תרגול', ico: '✏️' },
  { view: 'formulas', label: 'דף נוסחאות', ico: '📐' },
  { view: 'simulation', label: 'סימולציה', ico: '⏱️' },
  { view: 'review', label: 'חזרה על טעויות', ico: '🔁' },
  { view: 'dashboard', label: 'לוח התקדמות', ico: '📊' },
  { view: 'settings', label: 'הגדרות', ico: '⚙️' },
]

export default function App() {
  const [view, setView] = useState<View>('home')
  return (
    <div className="app">
      <nav className="sidebar">
        <div className="brand">
          <div className="logo">פ</div>
          <div>
            <div className="title">הכנה לפסיכומטרי</div>
            <div className="subtitle">מבוסס קובצי Campus IL</div>
          </div>
        </div>
        {NAV.map((n) => (
          <button
            key={n.view}
            className={'nav-item' + (view === n.view ? ' active' : '')}
            onClick={() => setView(n.view)}
          >
            <span className="ico">{n.ico}</span>
            {n.label}
          </button>
        ))}
        <div className="nav-sep" />
        <div className="small faint" style={{ padding: '0 12px' }}>
          לשימוש אישי בלבד. תוכן רשמי שמור בזכויות היוצרים של המרכז הארצי / Campus IL.
        </div>
      </nav>

      <main className="main">
        <div className="content">
          {view === 'home' && <Home go={setView} />}
          {view === 'practice' && <Placeholder title="מצב תרגול" />}
          {view === 'formulas' && <Placeholder title="דף נוסחאות" />}
          {view === 'simulation' && <Placeholder title="מצב סימולציה" />}
          {view === 'review' && <Placeholder title="חזרה על טעויות" />}
          {view === 'dashboard' && <Placeholder title="לוח התקדמות" />}
          {view === 'settings' && <Placeholder title="הגדרות" />}
        </div>
      </main>
    </div>
  )
}

function Home({ go }: { go: (v: View) => void }) {
  const { attempts } = useStore()
  const answered = attempts.length
  const correct = attempts.filter((a) => a.correct).length
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0
  const officialCount = questions.filter((q) => q.origin === 'official').length

  return (
    <div className="stack">
      {dataset.isDemo && (
        <div className="ai-banner" style={{ marginBottom: 0 }}>
          <span>ℹ️</span>
          <span>
            מוצג כעת <strong>תוכן הדגמה</strong> בלבד. בגרסה המלאה יוחלף בתוכן רשמי שחולץ מקובצי Campus IL.
          </span>
        </div>
      )}

      <div className="card hero">
        <h1 style={{ fontSize: 28 }}>שלום 👋 בואי נתכונן לפסיכומטרי</h1>
        <p className="muted" style={{ maxWidth: 560 }}>
          תרגול לפי נושא ורמת קושי, דף נוסחאות מלא, סימולציות ולוח התקדמות — הכול בעברית, ומבוסס על חומרי
          המקור הרשמיים של Campus IL.
        </p>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn primary lg" onClick={() => go('practice')}>התחלת תרגול ✏️</button>
          <button className="btn lg" onClick={() => go('formulas')}>דף נוסחאות 📐</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div className="stat"><div className="n">{answered}</div><div className="l">שאלות שנענו</div></div>
        <div className="stat"><div className="n">{accuracy}%</div><div className="l">דיוק</div></div>
        <div className="stat"><div className="n">{officialCount}</div><div className="l">שאלות רשמיות בבנק</div></div>
        <div className="stat"><div className="n">{formulas.length}</div><div className="l">נוסחאות</div></div>
      </div>

      <div className="card">
        <h3>איך להבחין בין תוכן רשמי לתוכן AI</h3>
        <div className="row" style={{ gap: 20, marginTop: 6 }}>
          <div className="row"><span className="badge official">✓ מקור רשמי</span><span className="small muted">שאלה מקורית מקובצי Campus IL, עם ציון מקור.</span></div>
        </div>
        <div className="row" style={{ gap: 20, marginTop: 10 }}>
          <div className="row"><span className="badge ai">🤖 נוצר על ידי AI</span><span className="small muted">תרגול נוסף שנוצר על ידי AI — אינו שאלה רשמית, ומסומן תמיד בבירור.</span></div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        {Object.entries(DOMAIN_HE).map(([, he]) => (
          <div className="card" key={he}>
            <h4 style={{ margin: 0 }}>{he}</h4>
          </div>
        ))}
      </div>
    </div>
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="card center muted" style={{ padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>🚧</div>
      <h2>{title}</h2>
      <p>המסך הזה בבנייה.</p>
    </div>
  )
}
