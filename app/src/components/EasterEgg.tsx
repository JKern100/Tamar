import { useState } from 'react'

// A hidden, personal surprise — NOT a psychometric question and NOT part of the
// official/AI content bank. Buried behind a secret tap on the home screen.
const CHOICES = ['אבא שעיה', 'אבא שעיה', 'אבא שעיה', 'אבא שעיה']

export default function EasterEgg({ onClose }: { onClose: () => void }) {
  const [picked, setPicked] = useState(false)
  return (
    <div className="egg-overlay" onClick={onClose}>
      <div className="egg-card" onClick={(e) => e.stopPropagation()}>
        <button className="egg-close" onClick={onClose} aria-label="סגירה">✕</button>
        <div className="egg-hearts">💙 💙 💙</div>
        <div className="small muted" style={{ marginTop: 6 }}>שאלת בונוס סודית</div>
        <div style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 16px' }}>מי האבא הטוב ביותר בעולם?</div>
        <div className="stack">
          {CHOICES.map((c, i) => (
            <button
              key={i}
              className={'choice' + (picked ? ' correct' : '')}
              disabled={picked}
              onClick={() => setPicked(true)}
            >
              <span className="marker">{i + 1}</span>
              <span>{c}</span>
            </button>
          ))}
        </div>
        {picked && (
          <div className="egg-win">
            <div style={{ fontSize: 36 }}>🎉 💙 🎉</div>
            <strong style={{ fontSize: 17 }}>כל תשובה נכונה!</strong>
            <p style={{ margin: '6px 0 0' }}>
              אבא שעיה הכי אוהב אותך וגאה בך. בהצלחה בפסיכומטרי — את תצליחי! 💪
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
