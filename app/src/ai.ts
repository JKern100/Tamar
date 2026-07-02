import type { Question, Settings, AiProvider } from './types'

const DEFAULT_MODEL: Record<AiProvider, string> = {
  anthropic: 'claude-haiku-4-5-20251001',
  openai: 'gpt-4o-mini',
}
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const OPENAI_API = 'https://api.openai.com/v1/chat/completions'

let counter = 0

/**
 * Generate a NEW, AI-authored practice question inspired by an official one's
 * topic/skill — never a copy. Runs client-side against the provider the user
 * chose (Claude/Anthropic or ChatGPT/OpenAI) with their own key. The result is
 * always origin:'ai', clearly labeled and stored separately from official content.
 */
export async function generateSimilarQuestion(source: Question, settings: Settings): Promise<Question> {
  const provider: AiProvider = settings.aiProvider || 'anthropic'
  const isEnglish = source.domain === 'english'
  const prompt = buildPrompt(source, isEnglish)

  const text = provider === 'openai'
    ? await callOpenAI(prompt, settings)
    : await callAnthropic(prompt, settings)

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

function buildPrompt(source: Question, isEnglish: boolean): string {
  const lang = isEnglish ? 'English' : 'Hebrew'
  return `You are helping a student practice for the Israeli psychometric exam (הפסיכומטרי).

Create ONE brand-new multiple-choice practice question in ${lang}, in the same domain and testing the same skill as the reference below. Do NOT reuse or translate the reference's wording, numbers, or answer choices — invent an entirely original question.

Reference (for skill/topic only — do not copy):
- Domain: ${source.domain}
- Topic: ${source.topic}
- Difficulty: ${source.difficulty ?? 'medium'}
- Reference stem: "${source.stem}"

Return ONLY valid JSON (no markdown), with this exact shape:
{"stem": string, "choices": [string, string, string, string], "correctIndex": 0-3, "explanation": string, "topic": string, "difficulty": "easy"|"medium"|"hard"}
The explanation must be in ${lang} and justify the correct answer.`
}

async function callAnthropic(prompt: string, settings: Settings): Promise<string> {
  const key = settings.anthropicApiKey?.trim()
  if (!key) throw new Error('חסר מפתח Anthropic API. יש להזין מפתח במסך ההגדרות כדי להשתמש ב-Claude.')
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: settings.anthropicModel || DEFAULT_MODEL.anthropic,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`שגיאת Claude (${res.status}). בדקי את מפתח ה-API והחיבור לרשת. ${detail.slice(0, 160)}`)
  }
  const data = await res.json()
  return data?.content?.[0]?.text ?? ''
}

async function callOpenAI(prompt: string, settings: Settings): Promise<string> {
  const key = settings.openaiApiKey?.trim()
  if (!key) throw new Error('חסר מפתח OpenAI API. יש להזין מפתח במסך ההגדרות כדי להשתמש ב-ChatGPT.')
  const res = await fetch(OPENAI_API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: settings.openaiModel || DEFAULT_MODEL.openai,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`שגיאת ChatGPT (${res.status}). בדקי את מפתח ה-API והחיבור לרשת. ${detail.slice(0, 160)}`)
  }
  const data = await res.json()
  return data?.choices?.[0]?.message?.content ?? ''
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
