import { useState, type Dispatch } from 'react'
import type { DocumentAction } from '../hooks/useDocument'
import type { BackgroundTheme, DocumentState, FontFamily, HighlightColor } from '../types'
import { getActiveSlide } from '../types'
import { LessonLibrary } from './SlideUI'
import { TimerWidget } from './overlays'
import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts'

type ToolboxTab = 'text' | 'present' | 'more'

const HIGHLIGHT_COLORS: { color: HighlightColor; label: string }[] = [
  { color: 'yellow', label: 'Key idea' },
  { color: 'green', label: 'Evidence' },
  { color: 'blue', label: 'Vocabulary' },
  { color: 'pink', label: 'Question' },
  { color: 'orange', label: 'Connection' },
]

const FONTS: { id: FontFamily; label: string }[] = [
  { id: 'fredoka', label: 'Fredoka' },
  { id: 'nunito', label: 'Nunito' },
  { id: 'caveat', label: 'Caveat' },
  { id: 'patrick', label: 'Patrick Hand' },
  { id: 'space', label: 'Space Grotesk' },
]

const BACKGROUNDS: { id: BackgroundTheme; label: string }[] = [
  { id: 'purple', label: 'Purple' },
  { id: 'midnight', label: 'Midnight' },
  { id: 'white', label: 'White' },
  { id: 'chalk', label: 'Chalkboard' },
]

const TABS: { id: ToolboxTab; label: string }[] = [
  { id: 'text', label: 'Text' },
  { id: 'present', label: 'Present' },
  { id: 'more', label: 'More' },
]

const PRESENT_TOOLS: {
  label: string
  glyph: string
  hint: string
  active: (s: DocumentState) => boolean
  action: DocumentAction
}[] = [
  { label: 'Reveal', glyph: '▦', hint: 'Click to reveal sentences (R)', active: (s) => s.revealMode, action: { type: 'TOGGLE_REVEAL' } },
  { label: 'Focus', glyph: '◎', hint: 'Click a sentence — dims everything else (F)', active: (s) => s.focusLine, action: { type: 'TOGGLE_FOCUS_LINE' } },
  { label: 'Spot', glyph: '◉', hint: 'Cursor spotlight (S)', active: (s) => s.spotlight, action: { type: 'TOGGLE_SPOTLIGHT' } },
  { label: 'Laser', glyph: '•', hint: 'Red laser dot (L)', active: (s) => s.laserPointer, action: { type: 'TOGGLE_LASER' } },
  { label: 'Pen', glyph: '✎', hint: 'Draw on screen (P)', active: (s) => s.penTool, action: { type: 'TOGGLE_PEN' } },
  { label: 'Zoom', glyph: '⊕', hint: 'Zoom under cursor (Z)', active: (s) => s.magnifier, action: { type: 'TOGGLE_MAGNIFIER' } },
  { label: 'Compare', glyph: '⚌', hint: 'Side-by-side texts', active: (s) => s.compareMode, action: { type: 'TOGGLE_COMPARE' } },
  { label: 'Lines', glyph: '#', hint: 'Line numbers (N)', active: (s) => s.showLineNumbers, action: { type: 'TOGGLE_LINE_NUMBERS' } },
  { label: 'Split', glyph: '⊞', hint: 'Text left, media right', active: (s) => s.splitLayout, action: { type: 'TOGGLE_SPLIT_LAYOUT' } },
]

interface ToolboxProps {
  state: DocumentState
  dispatch: Dispatch<DocumentAction>
  activeColor: HighlightColor
  onColorChange: (color: HighlightColor) => void
  onPasteText: (text: string, side?: 'primary' | 'compare') => void
  onCopy: () => void
  onSave: () => void
  onOpen: () => void
  onUndo: () => void
  canUndo: boolean
  onAddImage: () => void
  onAddSticky: () => void
  onClearPen: () => void
  onExportPng: () => void
  onExportPdf: () => void
  onFreeze: () => void
  onLoadLesson: (state: DocumentState) => void
  showVocab: boolean
  onToggleVocab: () => void
  timer: {
    seconds: number
    running: boolean
    toggle: () => void
    reset: () => void
    setDuration: (s: number) => void
  }
  copied: boolean
  fileNotice?: string | null
}

export function Toolbox({
  state,
  dispatch,
  activeColor,
  onColorChange,
  onPasteText,
  onCopy,
  onSave,
  onOpen,
  onUndo,
  canUndo,
  onAddImage,
  onAddSticky,
  onClearPen,
  onExportPng,
  onExportPdf,
  onFreeze,
  onLoadLesson,
  showVocab,
  onToggleVocab,
  timer,
  copied,
  fileNotice,
}: ToolboxProps) {
  const [tab, setTab] = useState<ToolboxTab>('text')
  const slide = getActiveSlide(state)
  const editingCompare = state.compareMode && state.compareSide === 'compare'

  const renderTextPanel = () => (
    <div className="toolbox__panel">
      {state.compareMode && (
        <div className="toolbox__seg">
          <button
            type="button"
            className={`toolbox__seg-btn ${!editingCompare ? 'toolbox__seg-btn--active' : ''}`}
            onClick={() => dispatch({ type: 'SET_COMPARE_SIDE', side: 'primary' })}
          >
            Original
          </button>
          <button
            type="button"
            className={`toolbox__seg-btn ${editingCompare ? 'toolbox__seg-btn--active' : ''}`}
            onClick={() => dispatch({ type: 'SET_COMPARE_SIDE', side: 'compare' })}
          >
            Compare
          </button>
        </div>
      )}
      <textarea
        className="paste-area paste-area--compact"
        placeholder={editingCompare ? 'Paste comparison text…' : 'Paste your paragraph…'}
        value={editingCompare ? slide.compareText : slide.text}
        onChange={(e) =>
          onPasteText(e.target.value, editingCompare ? 'compare' : 'primary')
        }
        rows={3}
      />
      <div className="toolbox__toolbar">
        <button type="button" className="btn btn--sm btn--primary" onClick={onSave}>
          Save
        </button>
        <button type="button" className="btn btn--sm" onClick={onOpen}>
          Open
        </button>
        <button type="button" className="btn btn--sm btn--ghost" onClick={onCopy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <button type="button" className="btn btn--sm btn--ghost" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" className="btn btn--sm btn--ghost" onClick={() => dispatch({ type: 'ADD_SLIDE' })}>
          + Passage
        </button>
      </div>
      {fileNotice && <p className="toolbox__notice">{fileNotice}</p>}
      <details className="toolbox__fold">
        <summary>Lesson library</summary>
        <LessonLibrary state={state} onLoad={onLoadLesson} />
      </details>
    </div>
  )

  const renderPresentPanel = () => (
    <div className="toolbox__panel">
      <div className="toolbox__highlight-kit">
        <p className="toolbox__micro">Highlight colors</p>
        <div className="color-picker color-picker--row">
          {HIGHLIGHT_COLORS.map(({ color, label }) => (
            <button
              key={color}
              type="button"
              className={`color-swatch-btn ${activeColor === color ? 'color-swatch-btn--active' : ''}`}
              title={label}
              aria-label={label}
              onClick={() => onColorChange(color)}
            >
              <span className={`color-swatch color-swatch--${color}`} />
            </button>
          ))}
        </div>

        <p className="toolbox__micro toolbox__micro--spaced">Answer key</p>
        <div className="toolbox__chip-row">
          <div className="toolbox__chip-row-main">
            <ChipToggle
              label="Answer key"
              active={state.answerKeyMode}
              onClick={() => dispatch({ type: 'TOGGLE_ANSWER_KEY_MODE' })}
              hint="New highlights hidden until you reveal answers"
            />
            <ChipToggle
              label={state.answersHidden ? 'Show answers' : 'Hide answers'}
              active={!state.answersHidden}
              onClick={() => dispatch({ type: 'TOGGLE_ANSWERS_HIDDEN' })}
              hint="Toggle answer-key highlights"
            />
          </div>
          <button
            type="button"
            className="chip chip--ghost chip--block"
            onClick={() =>
              dispatch({ type: 'CLEAR_HIGHLIGHTS', side: editingCompare ? 'compare' : 'primary' })
            }
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="toolbox__divider" />

      <div className="tool-icon-grid">
        {PRESENT_TOOLS.map(({ label, glyph, hint, active, action }) => (
          <IconTool
            key={label}
            glyph={glyph}
            label={label}
            hint={hint}
            active={active(state)}
            onClick={() => dispatch(action)}
          />
        ))}
      </div>
      {state.revealMode && (
        <div className="toolbox__toolbar">
          <button type="button" className="btn btn--sm" onClick={() => dispatch({ type: 'REVEAL_ALL' })}>
            Reveal all
          </button>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => dispatch({ type: 'RESET_REVEAL' })}>
            Reset
          </button>
        </div>
      )}
      <div className="toolbox__toolbar">
        <button type="button" className="btn btn--sm btn--ghost" onClick={onFreeze}>
          {state.frozen ? 'Unfreeze' : 'Freeze'}
        </button>
        <button type="button" className="btn btn--sm btn--ghost" onClick={onClearPen}>
          Clear pen
        </button>
      </div>

      <details className="toolbox__fold">
        <summary>Keyboard shortcuts (?)</summary>
        <dl className="shortcuts-list shortcuts-list--compact">
          {KEYBOARD_SHORTCUTS.map(({ keys, label }) => (
            <div key={keys} className="shortcuts-list__row">
              <dt><kbd>{keys}</kbd></dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  )

  const renderMorePanel = () => (
    <div className="toolbox__panel toolbox__panel--stack">
      <details className="toolbox__fold toolbox__fold--open" open>
        <summary>Look</summary>
        <div className="toolbox__pair">
          <label className="toolbox__mini">
            Theme
            <select
              value={state.backgroundTheme}
              onChange={(e) =>
                dispatch({ type: 'SET_BACKGROUND', backgroundTheme: e.target.value as BackgroundTheme })
              }
            >
              {BACKGROUNDS.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </label>
          <label className="toolbox__mini">
            Font
            <select
              value={state.font}
              onChange={(e) => dispatch({ type: 'SET_FONT', font: e.target.value as FontFamily })}
            >
              {FONTS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="toolbox__mini">
          Size — {state.fontSize}px
          <input
            type="range"
            min={18}
            max={48}
            value={state.fontSize}
            onChange={(e) => dispatch({ type: 'SET_FONT_SIZE', fontSize: Number(e.target.value) })}
          />
        </label>
        <label className="toolbox__mini">
          Spacing — {state.lineHeight.toFixed(1)}
          <input
            type="range"
            min={1.2}
            max={2.4}
            step={0.1}
            value={state.lineHeight}
            onChange={(e) => dispatch({ type: 'SET_LINE_HEIGHT', lineHeight: Number(e.target.value) })}
          />
        </label>
      </details>

      <details className="toolbox__fold">
        <summary>Media & notes</summary>
        <div className="toolbox__toolbar">
          <button type="button" className="btn btn--sm btn--full" onClick={onAddImage}>
            + Image
          </button>
          <button type="button" className="btn btn--sm btn--full" onClick={onAddSticky}>
            + Sticky
          </button>
        </div>
      </details>

      <details className="toolbox__fold">
        <summary>Timer</summary>
        <TimerWidget
          compact
          seconds={timer.seconds}
          running={timer.running}
          onToggle={timer.toggle}
          onReset={timer.reset}
          onSetDuration={timer.setDuration}
        />
      </details>

      <details className="toolbox__fold">
        <summary>Export & vocab</summary>
        <div className="toolbox__toolbar">
          <button type="button" className="btn btn--sm" onClick={onExportPng}>PNG</button>
          <button type="button" className="btn btn--sm" onClick={onExportPdf}>PDF</button>
          <button type="button" className="btn btn--sm btn--ghost" onClick={onToggleVocab}>
            {showVocab ? 'Hide vocab' : 'Vocab'}
          </button>
        </div>
      </details>
    </div>
  )

  return (
    <aside className="toolbox-shell">
      <div className="toolbox">
        <div className="toolbox__header">
          <div className="toolbox__brand">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Reader"
              className="toolbox__logo-img"
            />
          </div>
          <nav className="toolbox__tabs" aria-label="Toolbox sections">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`toolbox__tab ${tab === id ? 'toolbox__tab--active' : ''}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="toolbox__body">
          {tab === 'text' && renderTextPanel()}
          {tab === 'present' && renderPresentPanel()}
          {tab === 'more' && renderMorePanel()}
        </div>

        <div className="toolbox__footer">
          <button
            type="button"
            className={`btn btn--full ${state.presentationMode ? 'btn--primary' : ''}`}
            onClick={() => dispatch({ type: 'TOGGLE_PRESENTATION' })}
          >
            {state.presentationMode ? 'Exit clean view' : '⛶ Clean view'}
          </button>
          <p className="toolbox__credit">Created by Mr C 2026</p>
        </div>
      </div>
    </aside>
  )
}

function IconTool({
  glyph,
  label,
  active,
  onClick,
  hint,
}: {
  glyph: string
  label: string
  active: boolean
  onClick: () => void
  hint: string
}) {
  return (
    <button
      type="button"
      className={`tool-icon ${active ? 'tool-icon--active' : ''}`}
      onClick={onClick}
      title={hint}
      aria-label={label}
    >
      <span className="tool-icon__glyph">{glyph}</span>
      <span className="tool-icon__label">{label}</span>
    </button>
  )
}

function ChipToggle({
  label,
  active,
  onClick,
  hint,
}: {
  label: string
  active: boolean
  onClick: () => void
  hint?: string
}) {
  return (
    <button
      type="button"
      className={`chip ${active ? 'chip--active' : ''}`}
      onClick={onClick}
      title={hint}
    >
      {label}
    </button>
  )
}
