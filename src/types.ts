export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange'

export interface Highlight {
  id: string
  start: number
  end: number
  color: HighlightColor
  hidden?: boolean
}

export interface WordAnnotation {
  id: string
  start: number
  end: number
  word: string
  note: string
}

export interface ImageBlock {
  id: string
  src: string
  caption: string
  /** Display width in px; unset = fit container */
  width?: number
}

export interface Slide {
  id: string
  title: string
  text: string
  compareText: string
  highlights: Highlight[]
  compareHighlights: Highlight[]
  annotations: WordAnnotation[]
  compareAnnotations: WordAnnotation[]
  images: ImageBlock[]
}

export interface StickyNote {
  id: string
  slideId: string
  x: number
  y: number
  text: string
}

export interface PenStroke {
  id: string
  slideId: string
  points: { x: number; y: number }[]
  color: string
  width: number
}

export type FontFamily = 'fredoka' | 'nunito' | 'caveat' | 'patrick' | 'space'

export type BackgroundTheme = 'purple' | 'midnight' | 'white' | 'chalk'

export interface DocumentState {
  slides: Slide[]
  activeSlideId: string
  stickyNotes: StickyNote[]
  penStrokes: PenStroke[]
  font: FontFamily
  fontSize: number
  lineHeight: number
  backgroundTheme: BackgroundTheme
  revealMode: boolean
  revealedSentences: number
  focusLine: boolean
  spotlight: boolean
  presentationMode: boolean
  compareMode: boolean
  compareSide: 'primary' | 'compare'
  showLineNumbers: boolean
  splitLayout: boolean
  splitRatio: number
  answersHidden: boolean
  answerKeyMode: boolean
  laserPointer: boolean
  penTool: boolean
  magnifier: boolean
  frozen: boolean
}

export interface SlideSnapshot {
  text: string
  compareText: string
  highlights: Highlight[]
  compareHighlights: Highlight[]
  annotations: WordAnnotation[]
  compareAnnotations: WordAnnotation[]
  images: ImageBlock[]
}

export interface SavedLesson {
  id: string
  name: string
  savedAt: number
  data: Omit<DocumentState, 'presentationMode' | 'frozen' | 'laserPointer' | 'penTool' | 'magnifier'>
}

export function createSlide(title = 'Passage 1'): Slide {
  return {
    id: crypto.randomUUID(),
    title,
    text: '',
    compareText: '',
    highlights: [],
    compareHighlights: [],
    annotations: [],
    compareAnnotations: [],
    images: [],
  }
}

export function createDefaultState(): DocumentState {
  const slide = createSlide()
  return {
    slides: [slide],
    activeSlideId: slide.id,
    stickyNotes: [],
    penStrokes: [],
    font: 'fredoka',
    fontSize: 28,
    lineHeight: 1.7,
    backgroundTheme: 'purple',
    revealMode: false,
    revealedSentences: 0,
    focusLine: false,
    spotlight: false,
    presentationMode: false,
    compareMode: false,
    compareSide: 'primary',
    showLineNumbers: false,
    splitLayout: false,
    splitRatio: 58,
    answersHidden: true,
    answerKeyMode: false,
    laserPointer: false,
    penTool: false,
    magnifier: false,
    frozen: false,
  }
}

export function getActiveSlide(state: DocumentState): Slide {
  return state.slides.find((s) => s.id === state.activeSlideId) ?? state.slides[0]!
}
