import { recordAttempt, resetProgress, toggleBookmark } from '../store'
import type { Attempt } from '../types'

const KEY = 'psychometry-study/v1'
const sample: Attempt = {
  questionId: 'q1', domain: 'quantitative', topic: 'אחוזים', difficulty: 'easy',
  origin: 'official', chosenIndex: 1, correct: true, timeMs: 4200, at: 1,
}

function persisted() {
  return JSON.parse(localStorage.getItem(KEY) || '{}')
}

describe('on-device persistence', () => {
  beforeEach(() => resetProgress())

  it('records attempts to localStorage', () => {
    recordAttempt(sample)
    expect(persisted().attempts).toHaveLength(1)
    expect(persisted().attempts[0].correct).toBe(true)
  })

  it('toggles formula bookmarks', () => {
    toggleBookmark('f-1')
    expect(persisted().bookmarkedFormulas).toContain('f-1')
    toggleBookmark('f-1')
    expect(persisted().bookmarkedFormulas).not.toContain('f-1')
  })

  it('reset clears progress', () => {
    recordAttempt(sample)
    resetProgress()
    expect(persisted().attempts).toHaveLength(0)
  })
})
