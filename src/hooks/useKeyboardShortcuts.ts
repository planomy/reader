import { useEffect } from 'react'
import type { Dispatch } from 'react'
import type { DocumentAction } from './useDocument'

export const KEYBOARD_SHORTCUTS = [
  { keys: 'F', label: 'Focus sentence' },
  { keys: 'R', label: 'Reveal mode' },
  { keys: 'L', label: 'Laser pointer' },
  { keys: 'P', label: 'Pen tool' },
  { keys: 'S', label: 'Spotlight' },
  { keys: 'Z', label: 'Zoom / magnifier' },
  { keys: 'N', label: 'Line numbers' },
  { keys: 'C', label: 'Clean view' },
  { keys: 'X', label: 'Clear pen (when pen is on)' },
  { keys: 'Esc', label: 'Close popup / exit clean view' },
  { keys: '⌘Z', label: 'Undo highlight' },
  { keys: '?', label: 'Show this list' },
] as const

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

interface UseKeyboardShortcutsOptions {
  dispatch: Dispatch<DocumentAction>
  canUndo: boolean
  onUndo: () => void
  onClearPen: () => void
  penTool: boolean
  onEscape: () => void
  onToggleHelp: () => void
}

export function useKeyboardShortcuts({
  dispatch,
  canUndo,
  onUndo,
  onClearPen,
  penTool,
  onEscape,
  onToggleHelp,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        onToggleHelp()
        return
      }

      if (e.key === 'Escape') {
        onEscape()
        return
      }

      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()

      if (mod && key === 'z' && !e.shiftKey) {
        if (!isEditableTarget(e.target) && canUndo) {
          e.preventDefault()
          onUndo()
        }
        return
      }

      if (isEditableTarget(e.target) || mod || e.altKey) return

      switch (key) {
        case 'f':
          e.preventDefault()
          dispatch({ type: 'TOGGLE_FOCUS_LINE' })
          break
        case 'r':
          e.preventDefault()
          dispatch({ type: 'TOGGLE_REVEAL' })
          break
        case 'l':
          e.preventDefault()
          dispatch({ type: 'TOGGLE_LASER' })
          break
        case 'p':
          e.preventDefault()
          dispatch({ type: 'TOGGLE_PEN' })
          break
        case 's':
          e.preventDefault()
          dispatch({ type: 'TOGGLE_SPOTLIGHT' })
          break
        case 'z':
          e.preventDefault()
          dispatch({ type: 'TOGGLE_MAGNIFIER' })
          break
        case 'n':
          e.preventDefault()
          dispatch({ type: 'TOGGLE_LINE_NUMBERS' })
          break
        case 'c':
          e.preventDefault()
          dispatch({ type: 'TOGGLE_PRESENTATION' })
          break
        case 'x':
          if (penTool) {
            e.preventDefault()
            onClearPen()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch, canUndo, onUndo, onClearPen, penTool, onEscape, onToggleHelp])
}
