import { useState } from 'react'
import { useStore, updateSettings, resetProgress } from '../store'
import { Pill } from '../ui'
import type { AiProvider } from '../types'

const ANTHROPIC_MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 — מהיר וזול (מומלץ)' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 — מאוזן' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 — החזק ביותר' },
]
const OPENAI_MODELS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o mini — מהיר וזול (מומלץ)' },
  { id: 'gpt-4o', label: 'GPT-4o — חזק' },
]

export default function Settings() {
  const { settings } = useStore()
  const provider: AiProvider = settings.aiProvider ?? 'anthropic'
  const [anthropicKey, setAnthropicKey] = useState(settings.anthropicApiKey ?? '')
  const [openaiKey, setOpenaiKey] = useState(settings.openaiApiKey ?? '')
  const [saved, setSaved] = useState(false)

  function setProvider(p: AiProvider) {
    updateSettings({ aiProvider: p })
  }

  function saveKeys() {
    updateSettings({ anthropicApiKey: anthropicKey.trim(), openaiApiKey: openaiKey.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const models = provider === 'openai' ? OPENAI_MODELS : ANTHROPIC_MODELS
  const currentModel = provider === 'openai'
    ? settings.openaiModel ?? OPENAI_MODELS[0].id
    : settings.anthropicModel ?? ANTHROPIC_MODELS[0].id

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>⚙️ הגדרות</h1>

      <div className="card stack">
        <h3 style={{ margin: 0 }}>תכונות AI (רשות)</h3>
        <p className="small muted" style={{ margin: 0 }}>
          כדי ליצור שאלות תרגול נוספות בעזרת AI, בחרי ספק והזיני מפתח API. המפתח נשמר במכשיר זה בלבד
          (בדפדפן) ואינו נשלח לשום מקום מלבד לספק שבחרת. התכונה אינה נדרשת לשאר חלקי האפליקציה.
        </p>

        <label className="field">
          <span>ספק ה-AI</span>
          <div className="pill-tabs">
            <Pill active={provider === 'anthropic'} onClick={() => setProvider('anthropic')}>Claude (Anthropic)</Pill>
            <Pill active={provider === 'openai'} onClick={() => setProvider('openai')}>ChatGPT (OpenAI)</Pill>
          </div>
        </label>

        {provider === 'anthropic' ? (
          <label className="field">
            <span>מפתח Anthropic API</span>
            <input className="input" type="password" placeholder="sk-ant-..." value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} />
          </label>
        ) : (
          <label className="field">
            <span>מפתח OpenAI API</span>
            <input className="input" type="password" placeholder="sk-..." value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} />
          </label>
        )}

        <label className="field">
          <span>מודל</span>
          <select
            className="input"
            value={currentModel}
            onChange={(e) =>
              updateSettings(provider === 'openai' ? { openaiModel: e.target.value } : { anthropicModel: e.target.value })
            }
          >
            {models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>

        <div className="row">
          <button className="btn primary" onClick={saveKeys}>שמירת מפתחות</button>
          {saved && <span className="badge ok">✓ נשמר</span>}
        </div>
        <p className="small faint" style={{ margin: 0 }}>
          מפתח Anthropic מתקבל ב-console.anthropic.com · מפתח OpenAI מתקבל ב-platform.openai.com
        </p>
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
