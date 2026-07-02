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

/**
 * A diagram that belongs to a question, stored as self-contained inline SVG.
 * SVG keeps the app fully offline (no image files), scales crisply on any
 * screen, and adds almost nothing to the bundle. `alt` is a Hebrew text
 * description shown to screen readers and used as a fallback.
 */
export interface Figure {
  svg: string
  alt?: string
}

export interface Question {
  id: string
  origin: Origin
  domain: Domain
  topic: string
  difficulty?: Difficulty
  /** Question stem. May contain English for original English questions. */
  stem: string
  /** Optional diagram (geometry etc.), rendered between the stem and choices. */
  figure?: Figure
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

/**
 * An official worked example: a real exam problem (often with a figure) shown
 * with its full step-by-step solution instead of multiple-choice answers. Used
 * for figure/geometry questions whose original four options aren't available in
 * the source, so no choices are ever fabricated.
 */
export interface WorkedExample {
  id: string
  origin: Origin
  domain: Domain
  topic: string
  difficulty?: Difficulty
  stem: string
  figure?: Figure
  /** The correct result (value or expression), e.g. "10" or "12√3+12". */
  answer: string
  explanation: Explanation
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
  /** Official worked examples (problem + figure + full solution, no MC choices). */
  examples?: WorkedExample[]
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

export type AiProvider = 'anthropic' | 'openai'

export interface Settings {
  aiProvider?: AiProvider
  anthropicApiKey?: string
  openaiApiKey?: string
  anthropicModel?: string
  openaiModel?: string
  allowMixedSimulation?: boolean
}
