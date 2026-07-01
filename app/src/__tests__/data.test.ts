import { dataset, questions, formulas, officialQuestions } from '../content'

describe('dataset integrity', () => {
  it('every question has a valid correctIndex within its choices', () => {
    for (const q of questions) {
      expect(q.choices.length).toBeGreaterThanOrEqual(2)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(q.choices.length)
    }
  })

  it('every official question carries a citation object', () => {
    for (const q of officialQuestions()) {
      expect(q.citation).toBeDefined()
      expect(q.citation!.pdfTitle).toBeTruthy()
    }
  })

  it('every AI item is flagged origin=ai (hard separation)', () => {
    for (const q of questions) {
      if (q.origin === 'ai') expect(q.relatedOfficialId ?? null).not.toBeUndefined()
      expect(['official', 'ai']).toContain(q.origin)
    }
  })

  it('formulas carry origin and (for official) a citation', () => {
    for (const f of formulas) {
      expect(['official', 'ai']).toContain(f.origin)
      if (f.origin === 'official') expect(f.citation).toBeDefined()
    }
  })

  it('the bundled demo dataset is flagged isDemo', () => {
    // Guards against shipping placeholder content as if it were official.
    expect(typeof dataset.isDemo).toBe('boolean')
  })
})
