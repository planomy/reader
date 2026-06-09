import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'

export function LaserPointer({ active }: { active: boolean }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!active) return
    document.body.classList.add('laser-active')
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', move)
    return () => {
      document.body.classList.remove('laser-active')
      window.removeEventListener('mousemove', move)
    }
  }, [active])

  if (!active) return null

  return (
    <div className="laser-pointer" style={{ left: pos.x, top: pos.y }} aria-hidden />
  )
}

export function Magnifier({
  active,
  targetRef,
}: {
  active: boolean
  targetRef: React.RefObject<HTMLElement | null>
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snapshotRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!active) return
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [active])

  useEffect(() => {
    if (!active || !targetRef.current) {
      snapshotRef.current = null
      return
    }
    let cancelled = false
    const capture = async () => {
      const el = targetRef.current
      if (!el || cancelled) return
      const shot = await html2canvas(el, { backgroundColor: null, scale: 1.5, useCORS: true })
      if (!cancelled) snapshotRef.current = shot
    }
    capture()
    const interval = setInterval(capture, 2500)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [active, targetRef])

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    const shot = snapshotRef.current
    const el = targetRef.current
    if (!canvas || !shot || !el) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = el.getBoundingClientRect()
    const scale = shot.width / el.offsetWidth
    const sx = (pos.x - rect.left) * scale - 80
    const sy = (pos.y - rect.top) * scale - 80
    ctx.clearRect(0, 0, 160, 160)
    ctx.drawImage(shot, sx, sy, 160, 160, 0, 0, 160, 160)
  }, [active, pos, targetRef])

  if (!active) return null

  return (
    <div className="magnifier" style={{ left: pos.x + 28, top: pos.y + 28 }}>
      <canvas ref={canvasRef} width={160} height={160} />
    </div>
  )
}

export function FreezeOverlay({ image, onUnfreeze }: { image: string; onUnfreeze: () => void }) {
  return (
    <div className="freeze-overlay">
      <img src={image} alt="Frozen frame" />
      <button type="button" className="freeze-overlay__btn" onClick={onUnfreeze}>
        Unfreeze
      </button>
    </div>
  )
}

export function Spotlight({ active }: { active: boolean }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!active) return
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [active])

  if (!active) return null

  return (
    <div
      className="spotlight"
      style={{
        background: `radial-gradient(circle 180px at ${pos.x}px ${pos.y}px, transparent 0%, var(--spotlight-overlay) 100%)`,
      }}
    />
  )
}

export function useTimer() {
  const [seconds, setSeconds] = useState(120)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  return {
    seconds,
    running,
    toggle: () => setRunning((r) => !r),
    reset: () => {
      setRunning(false)
      setSeconds(120)
    },
    setDuration: (s: number) => {
      setSeconds(s)
      setRunning(false)
    },
  }
}

export function TimerWidget({
  seconds,
  running,
  onToggle,
  onReset,
  onSetDuration,
}: {
  seconds: number
  running: boolean
  onToggle: () => void
  onReset: () => void
  onSetDuration: (seconds: number) => void
}) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const display = `${mins}:${secs.toString().padStart(2, '0')}`

  return (
    <div className="timer-widget">
      <div className="timer-widget__display">{display}</div>
      <div className="timer-widget__presets">
        {[1, 2, 5].map((m) => (
          <button key={m} type="button" className="btn btn--sm" onClick={() => onSetDuration(m * 60)}>
            {m}m
          </button>
        ))}
      </div>
      <div className="timer-widget__controls">
        <button type="button" className="btn btn--primary btn--sm" onClick={onToggle}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  )
}

export function VocabPanel({
  annotations,
  onSelect,
}: {
  annotations: { id: string; word: string; note: string; start: number; end: number }[]
  onSelect: (a: { id: string; word: string; note: string; start: number; end: number }) => void
}) {
  if (annotations.length === 0) {
    return (
      <div className="vocab-panel vocab-panel--empty">
        <p>Double-click any word to add vocabulary notes.</p>
      </div>
    )
  }

  return (
    <ul className="vocab-panel">
      {annotations.map((a) => (
        <li key={a.id}>
          <button type="button" className="vocab-item" onClick={() => onSelect(a)}>
            <strong>{a.word}</strong>
            <span>{a.note || '—'}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
