import { useRef, useState } from 'react'
import type { StickyNote } from '../types'

interface StickyNotesProps {
  notes: StickyNote[]
  slideId: string
  onUpdate: (id: string, patch: { text?: string; x?: number; y?: number }) => void
  onRemove: (id: string) => void
}

export function StickyNotesLayer({ notes, slideId, onUpdate, onRemove }: StickyNotesProps) {
  const slideNotes = notes.filter((n) => n.slideId === slideId)

  return (
    <>
      {slideNotes.map((note) => (
        <StickyNoteCard key={note.id} note={note} onUpdate={onUpdate} onRemove={onRemove} />
      ))}
    </>
  )
}

function StickyNoteCard({
  note,
  onUpdate,
  onRemove,
}: {
  note: StickyNote
  onUpdate: StickyNotesProps['onUpdate']
  onRemove: (id: string) => void
}) {
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const [editing, setEditing] = useState(!note.text)

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('textarea, button')) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    drag.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const parent = (e.currentTarget as HTMLElement).offsetParent as HTMLElement
    if (!parent) return
    const pr = parent.getBoundingClientRect()
    const x = ((e.clientX - pr.left - drag.current.dx) / pr.width) * 100
    const y = ((e.clientY - pr.top - drag.current.dy) / pr.height) * 100
    onUpdate(note.id, { x: Math.max(0, Math.min(85, x)), y: Math.max(0, Math.min(85, y)) })
  }

  const onPointerUp = () => {
    drag.current = null
  }

  return (
    <div
      className="sticky-note"
      style={{ left: `${note.x}%`, top: `${note.y}%` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="sticky-note__header">
        <span>💬 Question</span>
        <button type="button" className="icon-btn" onClick={() => onRemove(note.id)} aria-label="Remove">
          ✕
        </button>
      </div>
      {editing ? (
        <textarea
          autoFocus
          className="sticky-note__input"
          placeholder="What do you predict? Turn and talk…"
          defaultValue={note.text}
          onBlur={(e) => {
            onUpdate(note.id, { text: e.target.value })
            setEditing(false)
          }}
        />
      ) : (
        <button type="button" className="sticky-note__text" onClick={() => setEditing(true)}>
          {note.text || 'Click to edit…'}
        </button>
      )}
    </div>
  )
}
