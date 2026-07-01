import { useState } from 'react'
import { useStore, updateSettings, resetProgress } from '../store'

const MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 — מהיר וזול (מומלץ)' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 — מאוזן' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 — החזק ביותר' },
]

export default function Settings() {
  const { settings } = useStore()
  const [key, setKey] = useState(settings.anthropicApiKey ?? '')
  const [saved, setSaved] = useState(false)

  function save() {
    updateSettings({ anthropicApiKey: key.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>⚙️ הגדרות</h1>

      <div className="card stack">
        <h3 style={{ margin: 0 }}>תכונות AI (רשות)</h3>
        <p className="small muted" style={{ margin: 0 }}>
          כדי ליצור שאלות תרגול נוספות בעזרת AI, הזיני מפתח Anthropic API. המפתח נשמר במכשיר זה בלבד
          (בדפדפן) ואינו נשלח לשום מקום מלבד ל-Anthropic. התכונה אינה נדרשת לשאר חלקי האפליקציה.
        </p>
        <label className="field">
          <span>מפתח Anthropic API</span>
          <input className="input" type="password" placeholder="sk-ant-..." value={key} onChange={(e) => setKey(e.target.value)} />
        </label>
        <label className="field">
          <span>מודל</span>
          <select className="input" value={settings.aiModel ?? MODELS[0].id} onChange={(e) => updateSettings({ aiModel: e.target.value })}>
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
        <div className="row">
          <button className="btn primary" onClick={save}>שמירה</button>
          {saved && <span className="badge ok">✓ נשמר</span>}
        </div>
      </div>

      <div className="card stack">
        <h3 style={{ margin: 0 }}>סימולציה</h3>
        <label className="row small" style={{ gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!settings.allowMixedSimulation}
            onChange={(e) => updateSettings({ allowMixedSimulation: e.target.checked })}
          />
          לאפשר שילוב של שאלות AI בסימולציות (ברירת מחדל: שאלות רשמיות בלבד)
        </label>
      </div>

      <div className="card stack">
        <h3 style={{ margin: 0 }}>נתונים</h3>
        <p className="small muted" style={{ margin: 0 }}>ההתקדמות נשמרת במכשיר זה בלבד.</p>
        <div>
          <button className="btn" onClick={() => { if (confirm('לאפס את כל ההתקדמות? פעולה זו אינה הפיכה.')) resetProgress() }}>
            איפוס התקדמות
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ margin: 0 }}>אודות וזכויות יוצרים</h3>
        <p className="small muted">
          אפליקציה זו נועדה ללימוד אישי. התוכן הרשמי חולץ מקובצי Campus IL ושמור בזכויות היוצרים של
          המרכז הארצי לבחינות ולהערכה / Campus IL. אין להפיץ את התוכן. תוכן שנוצר על ידי AI מסומן תמיד
          בנפרד ואינו מהווה שאלה רשמית.
        </p>
      </div>
    </div>
  )
}
