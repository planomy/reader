import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts'

interface ShortcutsOverlayProps {
  open: boolean
  onClose: () => void
}

export function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  if (!open) return null

  return (
    <div className="shortcuts-overlay" onClick={onClose} role="presentation">
      <div
        className="shortcuts-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="shortcuts-title"
      >
        <h3 id="shortcuts-title">Keyboard shortcuts</h3>
        <dl className="shortcuts-list">
          {KEYBOARD_SHORTCUTS.map(({ keys, label }) => (
            <div key={keys} className="shortcuts-list__row">
              <dt>
                <kbd>{keys}</kbd>
              </dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
        <p className="shortcuts-panel__hint">Press <kbd>?</kbd> or <kbd>Esc</kbd> to close</p>
      </div>
    </div>
  )
}
