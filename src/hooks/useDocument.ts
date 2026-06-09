import { useCallback, useEffect, useReducer, useRef } from 'react'
import type {
  DocumentState,
  FontFamily,
  Highlight,
  HighlightColor,
  ImageBlock,
  PenStroke,
  Slide,
  SlideSnapshot,
  StickyNote,
  WordAnnotation,
} from '../types'
import { createDefaultState, createSlide, getActiveSlide } from '../types'
import { uid } from '../utils/text'

const STORAGE_KEY = 'reader-presentation'

export type DocumentAction =
  | { type: 'SET_TEXT'; text: string; side?: 'primary' | 'compare' }
  | { type: 'ADD_HIGHLIGHT'; highlight: Highlight; side?: 'primary' | 'compare' }
  | { type: 'CLEAR_HIGHLIGHTS'; side?: 'primary' | 'compare' }
  | { type: 'SET_ANNOTATION'; annotation: WordAnnotation; side?: 'primary' | 'compare' }
  | { type: 'REMOVE_ANNOTATION'; id: string; side?: 'primary' | 'compare' }
  | { type: 'ADD_IMAGE'; image: ImageBlock }
  | { type: 'REMOVE_IMAGE'; id: string }
  | { type: 'UPDATE_IMAGE_CAPTION'; id: string; caption: string }
  | { type: 'UPDATE_IMAGE_WIDTH'; id: string; width: number }
  | { type: 'SET_FONT'; font: FontFamily }
  | { type: 'SET_FONT_SIZE'; fontSize: number }
  | { type: 'SET_LINE_HEIGHT'; lineHeight: number }
  | { type: 'SET_BACKGROUND'; backgroundTheme: DocumentState['backgroundTheme'] }
  | { type: 'TOGGLE_REVEAL' }
  | { type: 'REVEAL_NEXT' }
  | { type: 'REVEAL_ALL' }
  | { type: 'RESET_REVEAL' }
  | { type: 'TOGGLE_FOCUS_LINE' }
  | { type: 'TOGGLE_SPOTLIGHT' }
  | { type: 'TOGGLE_PRESENTATION' }
  | { type: 'TOGGLE_COMPARE' }
  | { type: 'SET_COMPARE_SIDE'; side: 'primary' | 'compare' }
  | { type: 'TOGGLE_LINE_NUMBERS' }
  | { type: 'TOGGLE_SPLIT_LAYOUT' }
  | { type: 'SET_SPLIT_RATIO'; ratio: number }
  | { type: 'TOGGLE_ANSWERS_HIDDEN' }
  | { type: 'TOGGLE_ANSWER_KEY_MODE' }
  | { type: 'TOGGLE_LASER' }
  | { type: 'TOGGLE_PEN' }
  | { type: 'TOGGLE_MAGNIFIER' }
  | { type: 'TOGGLE_FROZEN' }
  | { type: 'ADD_SLIDE' }
  | { type: 'REMOVE_SLIDE'; id: string }
  | { type: 'SET_ACTIVE_SLIDE'; id: string }
  | { type: 'RENAME_SLIDE'; id: string; title: string }
  | { type: 'ADD_STICKY'; note: StickyNote }
  | { type: 'UPDATE_STICKY'; id: string; text?: string; x?: number; y?: number }
  | { type: 'REMOVE_STICKY'; id: string }
  | { type: 'ADD_PEN_STROKE'; stroke: PenStroke }
  | { type: 'CLEAR_PEN'; slideId?: string }
  | { type: 'LOAD_STATE'; state: DocumentState }
  | { type: 'LOAD_SNAPSHOT'; snapshot: SlideSnapshot }

function updateSlide(
  state: DocumentState,
  slideId: string,
  updater: (slide: Slide) => Slide,
): DocumentState {
  return {
    ...state,
    slides: state.slides.map((s) => (s.id === slideId ? updater(s) : s)),
  }
}

function updateActiveSlide(state: DocumentState, updater: (slide: Slide) => Slide): DocumentState {
  return updateSlide(state, state.activeSlideId, updater)
}

function reducer(state: DocumentState, action: DocumentAction): DocumentState {
  switch (action.type) {
    case 'SET_TEXT': {
      const slide = getActiveSlide(state)
      const textChanged = action.side !== 'compare' && action.text !== slide.text
      return {
        ...updateActiveSlide(state, (s) =>
          action.side === 'compare'
            ? { ...s, compareText: action.text }
            : {
                ...s,
                text: action.text,
                highlights: action.text !== s.text ? [] : s.highlights,
                annotations: action.text !== s.text ? [] : s.annotations,
              },
        ),
        ...(textChanged ? { revealedSentences: 0 } : {}),
      }
    }
    case 'ADD_HIGHLIGHT':
      return updateActiveSlide(state, (s) => {
        if (action.side === 'compare') {
          return { ...s, compareHighlights: [...s.compareHighlights, action.highlight] }
        }
        return { ...s, highlights: [...s.highlights, action.highlight] }
      })
    case 'CLEAR_HIGHLIGHTS':
      return updateActiveSlide(state, (s) =>
        action.side === 'compare' ? { ...s, compareHighlights: [] } : { ...s, highlights: [] },
      )
    case 'SET_ANNOTATION': {
      return updateActiveSlide(state, (s) => {
        if (action.side === 'compare') {
          const filtered = s.compareAnnotations.filter(
            (a) => !(a.start === action.annotation.start && a.end === action.annotation.end),
          )
          return { ...s, compareAnnotations: [...filtered, action.annotation] }
        }
        const filtered = s.annotations.filter(
          (a) => !(a.start === action.annotation.start && a.end === action.annotation.end),
        )
        return { ...s, annotations: [...filtered, action.annotation] }
      })
    }
    case 'REMOVE_ANNOTATION':
      return updateActiveSlide(state, (s) =>
        action.side === 'compare'
          ? { ...s, compareAnnotations: s.compareAnnotations.filter((a) => a.id !== action.id) }
          : { ...s, annotations: s.annotations.filter((a) => a.id !== action.id) },
      )
    case 'ADD_IMAGE':
      return updateActiveSlide(state, (s) => ({ ...s, images: [...s.images, action.image] }))
    case 'REMOVE_IMAGE':
      return updateActiveSlide(state, (s) => ({
        ...s,
        images: s.images.filter((img) => img.id !== action.id),
      }))
    case 'UPDATE_IMAGE_CAPTION':
      return updateActiveSlide(state, (s) => ({
        ...s,
        images: s.images.map((img) =>
          img.id === action.id ? { ...img, caption: action.caption } : img,
        ),
      }))
    case 'UPDATE_IMAGE_WIDTH':
      return updateActiveSlide(state, (s) => ({
        ...s,
        images: s.images.map((img) =>
          img.id === action.id ? { ...img, width: action.width } : img,
        ),
      }))
    case 'SET_FONT':
      return { ...state, font: action.font }
    case 'SET_FONT_SIZE':
      return { ...state, fontSize: action.fontSize }
    case 'SET_LINE_HEIGHT':
      return { ...state, lineHeight: action.lineHeight }
    case 'SET_BACKGROUND':
      return { ...state, backgroundTheme: action.backgroundTheme }
    case 'TOGGLE_REVEAL':
      return { ...state, revealMode: !state.revealMode, revealedSentences: 0 }
    case 'REVEAL_NEXT':
      return { ...state, revealedSentences: state.revealedSentences + 1 }
    case 'REVEAL_ALL':
      return { ...state, revealedSentences: 9999 }
    case 'RESET_REVEAL':
      return { ...state, revealedSentences: 0 }
    case 'TOGGLE_FOCUS_LINE':
      return { ...state, focusLine: !state.focusLine }
    case 'TOGGLE_SPOTLIGHT':
      return { ...state, spotlight: !state.spotlight }
    case 'TOGGLE_PRESENTATION':
      return { ...state, presentationMode: !state.presentationMode }
    case 'TOGGLE_COMPARE':
      return { ...state, compareMode: !state.compareMode }
    case 'SET_COMPARE_SIDE':
      return { ...state, compareSide: action.side }
    case 'TOGGLE_LINE_NUMBERS':
      return { ...state, showLineNumbers: !state.showLineNumbers }
    case 'TOGGLE_SPLIT_LAYOUT':
      return { ...state, splitLayout: !state.splitLayout }
    case 'SET_SPLIT_RATIO':
      return { ...state, splitRatio: action.ratio }
    case 'TOGGLE_ANSWERS_HIDDEN':
      return { ...state, answersHidden: !state.answersHidden }
    case 'TOGGLE_ANSWER_KEY_MODE':
      return { ...state, answerKeyMode: !state.answerKeyMode }
    case 'TOGGLE_LASER':
      return { ...state, laserPointer: !state.laserPointer, penTool: false }
    case 'TOGGLE_PEN':
      return { ...state, penTool: !state.penTool, laserPointer: false }
    case 'TOGGLE_MAGNIFIER':
      return { ...state, magnifier: !state.magnifier }
    case 'TOGGLE_FROZEN':
      return { ...state, frozen: !state.frozen }
    case 'ADD_SLIDE': {
      const slide = createSlide(`Passage ${state.slides.length + 1}`)
      return { ...state, slides: [...state.slides, slide], activeSlideId: slide.id, revealedSentences: 0 }
    }
    case 'REMOVE_SLIDE': {
      if (state.slides.length <= 1) return state
      const slides = state.slides.filter((s) => s.id !== action.id)
      const stickyNotes = state.stickyNotes.filter((n) => n.slideId !== action.id)
      const penStrokes = state.penStrokes.filter((p) => p.slideId !== action.id)
      return {
        ...state,
        slides,
        activeSlideId: state.activeSlideId === action.id ? slides[0]!.id : state.activeSlideId,
        stickyNotes,
        penStrokes,
      }
    }
    case 'SET_ACTIVE_SLIDE':
      return { ...state, activeSlideId: action.id, revealedSentences: 0 }
    case 'RENAME_SLIDE':
      return updateSlide(state, action.id, (s) => ({ ...s, title: action.title }))
    case 'ADD_STICKY':
      return { ...state, stickyNotes: [...state.stickyNotes, action.note] }
    case 'UPDATE_STICKY':
      return {
        ...state,
        stickyNotes: state.stickyNotes.map((n) =>
          n.id === action.id
            ? { ...n, ...(action.text !== undefined && { text: action.text }), ...(action.x !== undefined && { x: action.x }), ...(action.y !== undefined && { y: action.y }) }
            : n,
        ),
      }
    case 'REMOVE_STICKY':
      return { ...state, stickyNotes: state.stickyNotes.filter((n) => n.id !== action.id) }
    case 'ADD_PEN_STROKE':
      return { ...state, penStrokes: [...state.penStrokes, action.stroke] }
    case 'CLEAR_PEN':
      return { ...state, penStrokes: [] }
    case 'LOAD_STATE':
      return action.state
    case 'LOAD_SNAPSHOT': {
      const snap = action.snapshot
      return updateActiveSlide(state, (s) => ({
        ...s,
        text: snap.text,
        compareText: snap.compareText,
        highlights: snap.highlights,
        compareHighlights: snap.compareHighlights,
        annotations: snap.annotations,
        compareAnnotations: snap.compareAnnotations,
        images: snap.images,
      }))
    }
    default:
      return state
  }
}

function migrateStored(raw: Record<string, unknown>): DocumentState {
  const defaults = createDefaultState()
  if (raw.slides && Array.isArray(raw.slides)) {
    return { ...defaults, ...raw } as DocumentState
  }
  if (typeof raw.text === 'string') {
    const slide = createSlide('Passage 1')
    slide.text = raw.text as string
    slide.highlights = (raw.highlights as Highlight[]) ?? []
    slide.annotations = (raw.annotations as WordAnnotation[]) ?? []
    slide.images = (raw.images as ImageBlock[]) ?? []
    return {
      ...defaults,
      slides: [slide],
      activeSlideId: slide.id,
      font: (raw.font as DocumentState['font']) ?? defaults.font,
      fontSize: (raw.fontSize as number) ?? defaults.fontSize,
      lineHeight: (raw.lineHeight as number) ?? defaults.lineHeight,
      backgroundTheme: 'purple',
    }
  }
  return defaults
}

function loadFromStorage(): DocumentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return migrateStored(JSON.parse(raw) as Record<string, unknown>)
  } catch {
    /* ignore */
  }
  return createDefaultState()
}

function slideSnapshot(slide: Slide): SlideSnapshot {
  return {
    text: slide.text,
    compareText: slide.compareText,
    highlights: [...slide.highlights],
    compareHighlights: [...slide.compareHighlights],
    annotations: [...slide.annotations],
    compareAnnotations: [...slide.compareAnnotations],
    images: [...slide.images],
  }
}

export function useDocument() {
  const [state, dispatch] = useReducer(reducer, undefined, loadFromStorage)
  const historyRef = useRef<SlideSnapshot[]>([])
  const [canUndo, setCanUndo] = useReducer((_: boolean, v: boolean) => v, false)

  useEffect(() => {
    const {
      presentationMode: _p,
      frozen: _f,
      laserPointer: _l,
      penTool: _pen,
      penStrokes: _ps,
      magnifier: _m,
      ...persistable
    } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable))
  }, [state])

  useEffect(() => {
    document.documentElement.dataset.theme = state.backgroundTheme
  }, [state.backgroundTheme])

  const pushHistory = useCallback(() => {
    const slide = getActiveSlide(state)
    historyRef.current = [...historyRef.current.slice(-19), slideSnapshot(slide)]
    setCanUndo(true)
  }, [state])

  const addHighlight = useCallback(
    (start: number, end: number, color: HighlightColor, side: 'primary' | 'compare' = 'primary') => {
      pushHistory()
      const highlight: Highlight = {
        id: uid(),
        start,
        end,
        color,
        hidden: state.answerKeyMode || undefined,
      }
      dispatch({ type: 'ADD_HIGHLIGHT', highlight, side })
    },
    [pushHistory, state.answerKeyMode],
  )

  const setAnnotation = useCallback(
    (
      start: number,
      end: number,
      word: string,
      note: string,
      side: 'primary' | 'compare' = 'primary',
    ) => {
      pushHistory()
      dispatch({
        type: 'SET_ANNOTATION',
        annotation: { id: uid(), start, end, word, note },
        side,
      })
    },
    [pushHistory],
  )

  const undo = useCallback(() => {
    const stack = historyRef.current
    const entry = stack.pop()
    if (entry) {
      dispatch({ type: 'LOAD_SNAPSHOT', snapshot: entry })
      setCanUndo(stack.length > 0)
    }
  }, [])

  const copyText = useCallback(async () => {
    const slide = getActiveSlide(state)
    const lines = [slide.text]
    if (slide.annotations.length > 0) {
      lines.push('', '--- Vocabulary ---')
      for (const a of slide.annotations) lines.push(`${a.word}: ${a.note}`)
    }
    await navigator.clipboard.writeText(lines.join('\n'))
  }, [state])

  return { state, dispatch, addHighlight, setAnnotation, undo, copyText, canUndo }
}
