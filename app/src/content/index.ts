import raw from './dataset.json'
import type { Dataset, Domain, Question, FormulaEntry, WorkedExample } from '../types'

export const dataset = raw as Dataset

export const questions: Question[] = dataset.questions
export const formulas: FormulaEntry[] = dataset.formulas
export const examples: WorkedExample[] = dataset.examples ?? []

export function exampleTopics(): string[] {
  const set = new Set<string>()
  for (const e of examples) set.add(e.topic)
  return [...set].sort((a, b) => a.localeCompare(b, 'he'))
}

export function questionById(id: string): Question | undefined {
  return questions.find((q) => q.id === id)
}

export function officialQuestions(): Question[] {
  return questions.filter((q) => q.origin === 'official')
}

/** Distinct topics present for a domain (official questions), sorted. */
export function topicsForDomain(domain: Domain): string[] {
  const set = new Set<string>()
  for (const q of questions) if (q.domain === domain) set.add(q.topic)
  return [...set].sort((a, b) => a.localeCompare(b, 'he'))
}

export function formulaTopics(): string[] {
  const set = new Set<string>()
  for (const f of formulas) set.add(f.topic)
  return [...set].sort((a, b) => a.localeCompare(b, 'he'))
}
