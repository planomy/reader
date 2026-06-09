import { useEffect, useRef } from 'react'

interface WordPopupProps {
  word: string
  note: string
  x: number
  y: number
  onSave: (note: string) => void
  onClose: () => void
  onDelete?: () => void
}

export function WordPopup({ word, note, x, y, onSave, onClose, onDelete }: WordPopupProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const left = Math.min(x, window.innerWidth - 320)
  const top = Math.min(y + 12, window.innerHeight - 200)

  return (
    <>
      <div className="popup-backdrop" onClick={onClose} />
      <div className="word-popup" style={{ left, top }}>
        <div className="word-popup__header">
          <span className="word-popup__word">{word}</span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <textarea
          ref={inputRef}
          className="word-popup__input"
          defaultValue={note}
          placeholder="Definition, synonym, question prompt…"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              onSave((e.target as HTMLTextAreaElement).value)
            }
          }}
        />
        <div className="word-popup__actions">
          {onDelete && note && (
            <button type="button" className="btn btn--ghost" onClick={onDelete}>
              Remove
            </button>
          )}
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onSave(inputRef.current?.value ?? '')}
          >
            Save
          </button>
        </div>
        <p className="word-popup__hint">⌘/Ctrl + Enter to save</p>
      </div>
    </>
  )
}
