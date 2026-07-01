// ---------- Core domain model ----------
// Hard separation between official Campus IL source content and AI-generated
// content is expressed by `origin` on every question / explanation / formula.

export type Domain = 'quantitative' | 'verbal' | 'english' | 'writing'

export const DOMAIN_HE: Record<Domain, string> = {
  quantitative: 'חשיבה כמותית',
  verbal: 'חשיבה מילולית / עברית',
  english: 'אנגלית',
  writing: 'מטלת כתיבה',
}

export type Difficulty = 'easy' | 'medium' | 'hard'
export const DIFFICULTY_HE: Record<Difficulty, string> = {
  easy: 'קל',
  medium: 'בינוני',
  hard: 'קשה',
}

export type Origin = 'official' | 'ai'

/** Where an official item came from — shown to the user in Hebrew. */
export interface Citation {
  pdfTitle: string
  pdfUrl?: string
  page?: number
  section?: string
  questionNumber?: string | number
}

export interface Explanation {
  text: string
  origin: Origin
  /** For AI explanations grounded in an official source question. */
  basedOnOfficial?: boolean
  citation?: Citation
}

export interface Question {
  id: string
  origin: Origin
  domain: Domain
  topic: string
  difficulty?: Difficulty
  /** Question stem. May contain English for original English questions. */
  stem: string
  /** Original answer choices, preserved verbatim for official questions. */
  choices: string[]
  correctIndex: number
  explanation?: Explanation
  /** Present on official questions. */
  citation?: Citation
  /** True only when an official item was confirmed against its source PDF. */
  verified?: boolean
  /** For AI questions inspired by a specific official question (topic only, no copied wording). */
  relatedOfficialId?: string
  /** RTL by default; English questions render LTR. */
  ltr?: boolean
}

export interface FormulaEntry {
  id: string
  domain: Domain
  topic: string
  name: string
  /** The formula or rule text. */
  formula: string
  explanation: string
  example?: string
  origin: Origin
  /** AI clarification layered on an official formula. */
  aiClarification?: string
  citation?: Citation
  verified?: boolean
}

export interface Dataset {
  /** True when the bundled data is the placeholder demo, not real official content. */
  isDemo: boolean
  generatedAt?: string
  sourceCount?: number
  questions: Question[]
  formulas: FormulaEntry[]
}

// ---------- Progress / persistence ----------
export interface Attempt {
  questionId: string
  domain: Domain
  topic: string
  difficulty?: Difficulty
  origin: Origin
  chosenIndex: number
  correct: boolean
  timeMs: number
  at: number
}

export interface Settings {
  anthropicApiKey?: string
  aiModel?: string
  allowMixedSimulation?: boolean
}
