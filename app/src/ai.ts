import type { Question, Settings } from './types'

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'
const API = 'https://api.anthropic.com/v1/messages'

let counter = 0

/**
 * Generate a NEW, AI-authored practice question inspired by an official one's
 * topic/skill — never a copy of its wording. Runs client-side against the
 * Anthropic API with the user's own key. The result is always origin:'ai',
 * clearly labeled and stored separately from official content.
 */
export async function generateSimilarQuestion(source: Question, settings: Settings): Promise<Question> {
  const key = settings.anthropicApiKey?.trim()
  if (!key) throw new Error('חסר מפתח API. יש להזין מפתח Anthropic במסך ההגדרות כדי להשתמש ב-AI.')

  const isEnglish = source.domain === 'english'
  const lang = isEnglish ? 'English' : 'Hebrew'
  const prompt = `You are helping a student practice for the Israeli psychometric exam (הפסיכומטרי).

Create ONE brand-new multiple-choice practice question in ${lang}, in the same domain and testing the same skill as the reference below. Do NOT reuse or translate the reference's wording, numbers, or answer choices — invent an entirely original question.

Reference (for skill/topic only — do not copy):
- Domain: ${source.domain}
- Topic: ${source.topic}
- Difficulty: ${source.difficulty ?? 'medium'}
- Reference stem: "${source.stem}"

Return ONLY valid JSON (no markdown), with this exact shape:
{"stem": string, "choices": [string, string, string, string], "correctIndex": 0-3, "explanation": string, "topic": string, "difficulty": "easy"|"medium"|"hard"}
The explanation must be in ${lang} and justify the correct answer.`

  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: settings.aiModel || DEFAULT_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`שגיאת AI (${res.status}). בדקי את מפתח ה-API והחיבור לרשת. ${detail.slice(0, 160)}`)
  }

  const data = await res.json()
  const text: string = data?.content?.[0]?.text ?? ''
  const parsed = parseJson(text)

  const choices = Array.isArray(parsed.choices) ? parsed.choices.map(String).slice(0, 4) : []
  const correctIndex = Number(parsed.correctIndex)
  if (choices.length !== 4 || !(correctIndex >= 0 && correctIndex <= 3)) {
    throw new Error('תשובת ה-AI לא הגיעה בפורמט תקין. נסי שוב.')
  }

  return {
    id: `ai-${source.id}-${Date.now()}-${counter++}`,
    origin: 'ai',
    domain: source.domain,
    topic: String(parsed.topic || source.topic),
    difficulty: ['easy', 'medium', 'hard'].includes(parsed.difficulty) ? parsed.difficulty : source.difficulty,
    stem: String(parsed.stem || ''),
    choices,
    correctIndex,
    ltr: isEnglish,
    relatedOfficialId: source.id,
    explanation: parsed.explanation
      ? { text: String(parsed.explanation), origin: 'ai', basedOnOfficial: true }
      : undefined,
  }
}

function parseJson(text: string): any {
  try {
    return JSON.parse(text)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        return JSON.parse(m[0])
      } catch {
        /* fall through */
      }
    }
    throw new Error('לא ניתן היה לפענח את תשובת ה-AI.')
  }
}
