import { render, screen, fireEvent } from '@testing-library/react'
import QuestionCard from '../components/QuestionCard'
import Examples from '../modes/Examples'
import EasterEgg from '../components/EasterEgg'
import { CitationView, SourceBadge, MathText } from '../ui'
import type { Question } from '../types'

const official: Question = {
  id: 'q1', origin: 'official', domain: 'quantitative', topic: 'אחוזים', difficulty: 'easy',
  stem: 'מהו 10% מתוך 200?', choices: ['10', '20', '30', '40'], correctIndex: 1,
  explanation: { text: '10% מ-200 = 20', origin: 'official' },
  citation: { pdfTitle: 'ספר קורס אלגברה', page: 12, questionNumber: 4 }, verified: true,
}

const english: Question = { ...official, id: 'q2', domain: 'english', stem: 'Choose the word.', ltr: true }

const ai: Question = {
  id: 'ai1', origin: 'ai', domain: 'quantitative', topic: 'אחוזים',
  stem: 'AI question', choices: ['a', 'b', 'c', 'd'], correctIndex: 0, relatedOfficialId: 'q1',
  explanation: { text: 'x', origin: 'ai', basedOnOfficial: true },
}

describe('answer checking', () => {
  it('marks a correct answer as נכונה when revealed', () => {
    render(<QuestionCard question={official} selected={1} onSelect={() => {}} reveal />)
    expect(screen.getByText(/תשובה נכונה/)).toBeInTheDocument()
  })
  it('marks a wrong answer as שגויה when revealed', () => {
    render(<QuestionCard question={official} selected={0} onSelect={() => {}} reveal />)
    expect(screen.getByText(/תשובה שגויה/)).toBeInTheDocument()
  })
  it('calls onSelect with the chosen index', () => {
    const onSelect = vi.fn()
    render(<QuestionCard question={official} selected={null} onSelect={onSelect} reveal={false} />)
    fireEvent.click(screen.getByText('20'))
    expect(onSelect).toHaveBeenCalledWith(1)
  })
})

describe('official vs AI labeling', () => {
  it('shows the official badge for official questions', () => {
    render(<SourceBadge origin="official" />)
    expect(screen.getByText(/מקור רשמי/)).toBeInTheDocument()
  })
  it('shows the mandatory AI disclaimer banner for AI questions', () => {
    render(<QuestionCard question={ai} selected={null} onSelect={() => {}} reveal={false} />)
    expect(screen.getByText(/נוצרה על ידי AI ואינה שאלה רשמית/)).toBeInTheDocument()
  })
})

describe('citations', () => {
  it('renders full source metadata in Hebrew', () => {
    render(<CitationView citation={official.citation} verified />)
    expect(screen.getByText(/ספר קורס אלגברה/)).toBeInTheDocument()
    expect(screen.getByText(/עמוד 12/)).toBeInTheDocument()
    expect(screen.getByText(/שאלה 4/)).toBeInTheDocument()
  })
  it('shows the unverified notice when there is no citation', () => {
    render(<CitationView />)
    expect(screen.getByText(/לא אומת מתוך קובצי המקור/)).toBeInTheDocument()
  })
})

describe('figures', () => {
  it('renders an inline SVG diagram with an accessible Hebrew label', () => {
    const withFig: Question = {
      ...official, id: 'qf',
      figure: { svg: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>', alt: 'עיגול' },
    }
    const { container } = render(<QuestionCard question={withFig} selected={null} onSelect={() => {}} reveal={false} />)
    expect(container.querySelector('.figure svg')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'עיגול' })).toBeInTheDocument()
  })
  it('renders no figure element when a question has none', () => {
    const { container } = render(<QuestionCard question={official} selected={null} onSelect={() => {}} reveal={false} />)
    expect(container.querySelector('.figure')).toBeNull()
  })
})

describe('worked examples mode', () => {
  it('lists an official example and reveals its full solution only on demand', () => {
    render(<Examples />)
    expect(screen.getByText(/משולש ישר-זווית/)).toBeInTheDocument()
    expect(screen.queryByText(/פיתגורס/)).toBeNull() // solution hidden initially
    fireEvent.click(screen.getByText('הצג פתרון'))
    expect(screen.getByText(/פיתגורס/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /משולש/ })).toBeInTheDocument() // figure rendered
  })
})

describe('hidden surprise', () => {
  it('asks who the best dad is, with every answer correct', () => {
    render(<EasterEgg onClose={() => {}} />)
    expect(screen.getByText('מי האבא הטוב ביותר בעולם?')).toBeInTheDocument()
    expect(screen.getAllByText('אבא שעיה')).toHaveLength(4)
    fireEvent.click(screen.getAllByText('אבא שעיה')[0])
    expect(screen.getByText('כל התשובות נכונות')).toBeInTheDocument()
  })
})

describe('MathText (bidi-safe equations)', () => {
  it('isolates each equation as an LTR run and preserves the full text', () => {
    const { container } = render(<p><MathText>{'היתר d=√2·c ולכן b²=7a².'}</MathText></p>)
    const spans = container.querySelectorAll('.ltr-math')
    expect(spans.length).toBe(2)
    expect(spans[0].textContent).toBe('d=√2·c')
    expect(spans[1].textContent).toBe('b²=7a²') // trailing period stays in the Hebrew flow
    expect(container.textContent).toBe('היתר d=√2·c ולכן b²=7a².')
  })
  it('leaves pure-Hebrew text untouched', () => {
    const { container } = render(<p><MathText>{'שלום עולם'}</MathText></p>)
    expect(container.querySelectorAll('.ltr-math').length).toBe(0)
    expect(container.textContent).toBe('שלום עולם')
  })
})

describe('RTL / direction', () => {
  it('renders Hebrew stems RTL and English stems LTR', () => {
    const { rerender } = render(<QuestionCard question={official} selected={null} onSelect={() => {}} reveal={false} />)
    expect(document.querySelector('[style*="direction: rtl"]')).toBeTruthy()
    rerender(<QuestionCard question={english} selected={null} onSelect={() => {}} reveal={false} />)
    expect(document.querySelector('[style*="direction: ltr"]')).toBeTruthy()
  })
})
