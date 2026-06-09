import type { Dispatch } from 'react'
import type { DocumentAction } from '../hooks/useDocument'
import type { DocumentState } from '../types'

interface PresentationBarProps {
  state: DocumentState
  dispatch: Dispatch<DocumentAction>
  onClearPen: () => void
}

function BarToggle({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`presentation-bar__btn ${active ? 'presentation-bar__btn--active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export function PresentationBar({ state, dispatch, onClearPen }: PresentationBarProps) {
  return (
    <div className="presentation-bar">
      <BarToggle
        label="Focus"
        active={state.focusLine}
        onClick={() => dispatch({ type: 'TOGGLE_FOCUS_LINE' })}
      />
      <BarToggle
        label="Reveal"
        active={state.revealMode}
        onClick={() => dispatch({ type: 'TOGGLE_REVEAL' })}
      />
      <BarToggle
        label="Line #s"
        active={state.showLineNumbers}
        onClick={() => dispatch({ type: 'TOGGLE_LINE_NUMBERS' })}
      />
      <BarToggle
        label="Spotlight"
        active={state.spotlight}
        onClick={() => dispatch({ type: 'TOGGLE_SPOTLIGHT' })}
      />
      <BarToggle
        label="Laser"
        active={state.laserPointer}
        onClick={() => dispatch({ type: 'TOGGLE_LASER' })}
      />
      <BarToggle
        label="Pen"
        active={state.penTool}
        onClick={() => dispatch({ type: 'TOGGLE_PEN' })}
      />
      <BarToggle
        label="Zoom"
        active={state.magnifier}
        onClick={() => dispatch({ type: 'TOGGLE_MAGNIFIER' })}
      />
      {state.penTool && (
        <button type="button" className="presentation-bar__btn" onClick={onClearPen}>
          Clear pen
        </button>
      )}
      <button
        type="button"
        className="presentation-bar__btn presentation-bar__btn--exit"
        onClick={() => dispatch({ type: 'TOGGLE_PRESENTATION' })}
      >
        Exit
      </button>
    </div>
  )
}
