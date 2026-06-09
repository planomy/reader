import { useRef, useState } from 'react'
import { deleteLesson, listLessons, loadLesson, saveLesson } from '../utils/lessons'
import type { DocumentState, SavedLesson } from '../types'

interface LessonLibraryProps {
  state: DocumentState
  onLoad: (state: DocumentState) => void
}

export function LessonLibrary({ state, onLoad }: LessonLibraryProps) {
  const [lessons, setLessons] = useState<SavedLesson[]>(() => listLessons())
  const [name, setName] = useState('')

  const refresh = () => setLessons(listLessons())

  const handleSave = () => {
    const title = name.trim() || `Lesson ${new Date().toLocaleDateString()}`
    saveLesson(title, state)
    setName('')
    refresh()
  }

  return (
    <div className="lesson-library">
      <div className="lesson-library__save">
        <input
          type="text"
          placeholder="Lesson name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button type="button" className="btn btn--primary btn--sm" onClick={handleSave}>
          Save lesson
        </button>
      </div>
      {lessons.length === 0 ? (
        <p className="toolbox__hint">No saved lessons yet.</p>
      ) : (
        <ul className="lesson-list">
          {lessons.map((lesson) => (
            <li key={lesson.id} className="lesson-item">
              <button
                type="button"
                className="lesson-item__load"
                onClick={() => {
                  const loaded = loadLesson(lesson.id)
                  if (loaded) onLoad(loaded)
                }}
              >
                <strong>{lesson.name}</strong>
                <span>{new Date(lesson.savedAt).toLocaleDateString()}</span>
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label="Delete lesson"
                onClick={() => {
                  deleteLesson(lesson.id)
                  refresh()
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface SlideTabsProps {
  slides: { id: string; title: string }[]
  activeId: string
  onSelect: (id: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
  onRename: (id: string, title: string) => void
}

export function SlideTabs({ slides, activeId, onSelect, onAdd, onRemove, onRename }: SlideTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="slide-tabs">
      {slides.map((slide) => (
        <div key={slide.id} className={`slide-tab ${slide.id === activeId ? 'slide-tab--active' : ''}`}>
          {editingId === slide.id ? (
            <input
              className="slide-tab__input"
              autoFocus
              defaultValue={slide.title}
              onBlur={(e) => {
                onRename(slide.id, e.target.value || slide.title)
                setEditingId(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') setEditingId(null)
              }}
            />
          ) : (
            <button
              type="button"
              className="slide-tab__btn"
              onClick={() => onSelect(slide.id)}
              onDoubleClick={() => setEditingId(slide.id)}
            >
              {slide.title}
            </button>
          )}
          {slides.length > 1 && (
            <button
              type="button"
              className="slide-tab__remove"
              onClick={() => onRemove(slide.id)}
              aria-label="Remove passage"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button type="button" className="slide-tab slide-tab--add" onClick={onAdd}>
        + Passage
      </button>
    </div>
  )
}

interface SplitPaneProps {
  ratio: number
  onRatioChange: (ratio: number) => void
  left: React.ReactNode
  right: React.ReactNode
  enabled: boolean
}

export function SplitPane({ ratio, onRatioChange, left, right, enabled }: SplitPaneProps) {
  const dragging = useRef(false)

  if (!enabled) {
    return (
      <div className="split-pane split-pane--stacked">
        {left}
        {right}
      </div>
    )
  }

  return (
    <div
      className="split-pane"
      onPointerMove={(e) => {
        if (!dragging.current) return
        const parent = e.currentTarget.getBoundingClientRect()
        onRatioChange(Math.max(30, Math.min(75, ((e.clientX - parent.left) / parent.width) * 100)))
      }}
      onPointerUp={() => {
        dragging.current = false
      }}
      onPointerLeave={() => {
        dragging.current = false
      }}
    >
      <div className="split-pane__left" style={{ width: `${ratio}%` }}>
        {left}
      </div>
      <div
        className="split-pane__divider"
        onPointerDown={() => {
          dragging.current = true
        }}
      />
      <div className="split-pane__right">{right}</div>
    </div>
  )
}
