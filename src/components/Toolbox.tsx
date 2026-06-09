import type { Dispatch } from 'react'
import type { DocumentAction } from '../hooks/useDocument'
import type { BackgroundTheme, DocumentState, FontFamily, HighlightColor } from '../types'
import { getActiveSlide } from '../types'
import { LessonLibrary } from './SlideUI'
import { TimerWidget } from './overlays'

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
  { id: 'purple', label: 'Purple (default)' },
  { id: 'midnight', label: 'Midnight black' },
  { id: 'white', label: 'Clean white' },
  { id: 'chalk', label: 'Chalkboard' },
]

interface ToolboxProps {
  state: DocumentState
  dispatch: Dispatch<DocumentAction>
  activeColor: HighlightColor
  onColorChange: (color: HighlightColor) => void
  onPasteText: (text: string, side?: 'primary' | 'compare') => void
  onCopy: () => void
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
}

export function Toolbox({
  state,
  dispatch,
  activeColor,
  onColorChange,
  onPasteText,
  onCopy,
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
}: ToolboxProps) {
  const slide = getActiveSlide(state)
  const editingCompare = state.compareMode && state.compareSide === 'compare'

  return (
    <aside className="toolbox">
      <div className="toolbox__brand">
        <span className="toolbox__logo">📖</span>
        <h1>Reader</h1>
      </div>

      <section className="toolbox__section">
        <h2>Passages</h2>
        <p className="toolbox__hint">Use tabs above the stage. Double-click a tab to rename.</p>
        <button type="button" className="btn btn--full" onClick={() => dispatch({ type: 'ADD_SLIDE' })}>
          + New passage
        </button>
      </section>

      <section className="toolbox__section">
        <h2>Text {state.compareMode && (editingCompare ? '(compare)' : '(original)')}</h2>
        {state.compareMode && (
          <div className="toolbox__row">
            <button
              type="button"
              className={`btn btn--sm ${!editingCompare ? 'btn--primary' : ''}`}
              onClick={() => dispatch({ type: 'SET_COMPARE_SIDE', side: 'primary' })}
            >
              Original
            </button>
            <button
              type="button"
              className={`btn btn--sm ${editingCompare ? 'btn--primary' : ''}`}
              onClick={() => dispatch({ type: 'SET_COMPARE_SIDE', side: 'compare' })}
            >
              Compare
            </button>
          </div>
        )}
        <textarea
          className="paste-area"
          placeholder={editingCompare ? 'Paste comparison text…' : 'Paste your paragraph here…'}
          value={editingCompare ? slide.compareText : slide.text}
          onChange={(e) =>
            onPasteText(e.target.value, editingCompare ? 'compare' : 'primary')
          }
          rows={4}
        />
        <div className="toolbox__row">
          <button type="button" className="btn" onClick={onCopy}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onUndo} disabled={!canUndo}>
            Undo
          </button>
        </div>
      </section>

      <section className="toolbox__section">
        <h2>Lesson library</h2>
        <LessonLibrary state={state} onLoad={onLoadLesson} />
      </section>

      <section className="toolbox__section">
        <h2>Highlight</h2>
        <p className="toolbox__hint">Select text, then pick a color</p>
        <div className="color-picker">
          {HIGHLIGHT_COLORS.map(({ color, label }) => (
            <button
              key={color}
              type="button"
              className={`color-swatch color-swatch--${color} ${activeColor === color ? 'active' : ''}`}
              title={label}
              aria-label={label}
              onClick={() => onColorChange(color)}
            />
          ))}
        </div>
        <ToolToggle
          label={`Answer key mode ${state.answerKeyMode ? 'ON' : ''}`}
          active={state.answerKeyMode}
          onClick={() => dispatch({ type: 'TOGGLE_ANSWER_KEY_MODE' })}
          hint="New highlights hidden until you reveal answers"
        />
        <div className="toolbox__row">
          <ToolToggle
            label={state.answersHidden ? 'Show answers' : 'Hide answers'}
            active={!state.answersHidden}
            onClick={() => dispatch({ type: 'TOGGLE_ANSWERS_HIDDEN' })}
            hint="Toggle answer-key highlights"
          />
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() =>
              dispatch({ type: 'CLEAR_HIGHLIGHTS', side: editingCompare ? 'compare' : 'primary' })
            }
          >
            Clear
          </button>
        </div>
      </section>

      <section className="toolbox__section">
        <h2>Present</h2>
        <div className="toolbox__grid">
          <ToolToggle label="Reveal" active={state.revealMode} onClick={() => dispatch({ type: 'TOGGLE_REVEAL' })} hint="Click to reveal sentences" />
          <ToolToggle label="Focus sentence" active={state.focusLine} onClick={() => dispatch({ type: 'TOGGLE_FOCUS_LINE' })} hint="Click a sentence — dims everything else" />
          <ToolToggle label="Spotlight" active={state.spotlight} onClick={() => dispatch({ type: 'TOGGLE_SPOTLIGHT' })} hint="Cursor spotlight" />
          <ToolToggle label="Laser" active={state.laserPointer} onClick={() => dispatch({ type: 'TOGGLE_LASER' })} hint="Red laser dot" />
          <ToolToggle label="Pen" active={state.penTool} onClick={() => dispatch({ type: 'TOGGLE_PEN' })} hint="Draw on screen" />
          <ToolToggle label="Magnifier" active={state.magnifier} onClick={() => dispatch({ type: 'TOGGLE_MAGNIFIER' })} hint="Zoom under cursor" />
          <ToolToggle label="Compare" active={state.compareMode} onClick={() => dispatch({ type: 'TOGGLE_COMPARE' })} hint="Side-by-side texts" />
          <ToolToggle label={`Line #s${state.showLineNumbers ? ' ✓' : ''}`} active={state.showLineNumbers} onClick={() => dispatch({ type: 'TOGGLE_LINE_NUMBERS' })} hint="Purple numbers on the left — great for 'look at line 3'" />
          <ToolToggle label="Split view" active={state.splitLayout} onClick={() => dispatch({ type: 'TOGGLE_SPLIT_LAYOUT' })} hint="Text left, media right" />
          <ToolToggle label="Clean view" active={state.presentationMode} onClick={() => dispatch({ type: 'TOGGLE_PRESENTATION' })} hint="Hide toolbox" />
        </div>
        {state.revealMode && (
          <div className="toolbox__row">
            <button type="button" className="btn btn--sm" onClick={() => dispatch({ type: 'REVEAL_ALL' })}>Reveal all</button>
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => dispatch({ type: 'RESET_REVEAL' })}>Reset</button>
          </div>
        )}
        <div className="toolbox__row" style={{ marginTop: '0.5rem' }}>
          <button type="button" className="btn btn--sm btn--ghost" onClick={onFreeze}>
            {state.frozen ? 'Unfreeze' : 'Freeze frame'}
          </button>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={onClearPen}
          >
            Clear pen
          </button>
        </div>
      </section>

      <section className="toolbox__section">
        <h2>Export</h2>
        <div className="toolbox__row">
          <button type="button" className="btn btn--sm" onClick={onExportPng}>PNG</button>
          <button type="button" className="btn btn--sm" onClick={onExportPdf}>PDF</button>
        </div>
      </section>

      <section className="toolbox__section">
        <h2>Look</h2>
        <label className="toolbox__label">
          Background
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
        <label className="toolbox__label">
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
        <label className="toolbox__label">
          Size — {state.fontSize}px
          <input type="range" min={18} max={48} value={state.fontSize} onChange={(e) => dispatch({ type: 'SET_FONT_SIZE', fontSize: Number(e.target.value) })} />
        </label>
        <label className="toolbox__label">
          Spacing — {state.lineHeight.toFixed(1)}
          <input type="range" min={1.2} max={2.4} step={0.1} value={state.lineHeight} onChange={(e) => dispatch({ type: 'SET_LINE_HEIGHT', lineHeight: Number(e.target.value) })} />
        </label>
      </section>

      <section className="toolbox__section">
        <h2>Media & notes</h2>
        <button type="button" className="btn btn--full" onClick={onAddImage}>+ Add image</button>
        <button type="button" className="btn btn--full" style={{ marginTop: '0.35rem' }} onClick={onAddSticky}>
          + Sticky question
        </button>
      </section>

      <section className="toolbox__section">
        <h2>Timer</h2>
        <TimerWidget seconds={timer.seconds} running={timer.running} onToggle={timer.toggle} onReset={timer.reset} onSetDuration={timer.setDuration} />
      </section>

      <section className="toolbox__section">
        <button type="button" className="btn btn--ghost btn--full" onClick={onToggleVocab}>
          {showVocab ? 'Hide vocabulary' : 'Show vocabulary'}
        </button>
      </section>
    </aside>
  )
}

function ToolToggle({
  label,
  active,
  onClick,
  hint,
}: {
  label: string
  active: boolean
  onClick: () => void
  hint: string
}) {
  return (
    <button type="button" className={`tool-toggle ${active ? 'tool-toggle--active' : ''}`} onClick={onClick} title={hint}>
      {label}
    </button>
  )
}
