import { generateSimilarQuestion } from '../ai'
import type { Question } from '../types'

const src: Question = {
  id: 'off-7', origin: 'official', domain: 'english', topic: 'Vocabulary',
  stem: 'reference', choices: ['a', 'b', 'c', 'd'], correctIndex: 0,
}

afterEach(() => vi.restoreAllMocks())

describe('AI similar-question generation', () => {
  it('refuses without an API key', async () => {
    await expect(generateSimilarQuestion(src, {})).rejects.toThrow(/מפתח/)
  })

  it('returns a clearly-labeled AI question linked to the source', async () => {
    const payload = {
      content: [{ text: JSON.stringify({ stem: 'new', choices: ['w', 'x', 'y', 'z'], correctIndex: 2, explanation: 'because', topic: 'Vocabulary', difficulty: 'medium' }) }],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }))
    const q = await generateSimilarQuestion(src, { anthropicApiKey: 'key' })
    expect(q.origin).toBe('ai')
    expect(q.relatedOfficialId).toBe('off-7')
    expect(q.choices).toHaveLength(4)
    expect(q.correctIndex).toBe(2)
    expect(q.ltr).toBe(true) // english renders LTR
    expect(q.explanation?.origin).toBe('ai')
  })

  it('rejects malformed AI output instead of guessing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [{ text: '{"choices":["a"]}' }] }) }))
    await expect(generateSimilarQuestion(src, { anthropicApiKey: 'key' })).rejects.toThrow()
  })

  it('uses the OpenAI endpoint when provider is openai', async () => {
    const payload = { choices: [{ message: { content: JSON.stringify({ stem: 'new', choices: ['w', 'x', 'y', 'z'], correctIndex: 1, explanation: 'because', topic: 'Vocabulary', difficulty: 'medium' }) } }] }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload })
    vi.stubGlobal('fetch', fetchMock)
    const q = await generateSimilarQuestion(src, { aiProvider: 'openai', openaiApiKey: 'key' })
    expect(q.origin).toBe('ai')
    expect(q.correctIndex).toBe(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('api.openai.com')
  })

  it('refuses without an OpenAI key when provider is openai', async () => {
    await expect(generateSimilarQuestion(src, { aiProvider: 'openai' })).rejects.toThrow(/OpenAI/)
  })
})
