import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Point = { x: number; y: number }

interface PenLayerProps {
  active: boolean
  clearSignal: number
  targetRef: React.RefObject<HTMLElement | null>
}

export function PenLayer({ active, clearSignal, targetRef }: PenLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rectRef = useRef<DOMRect | null>(null)
  const [strokes, setStrokes] = useState<Point[][]>([])
  const strokesRef = useRef(strokes)
  strokesRef.current = strokes

  const drawing = useRef(false)
  const current = useRef<Point[]>([])

  const paint = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#e056fd'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const all = [...strokesRef.current]
    if (current.current.length > 1) all.push(current.current)

    for (const stroke of all) {
      if (stroke.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y)
      ctx.stroke()
    }
  }

  const fitCanvas = () => {
    const canvas = canvasRef.current
    const target = targetRef.current
    if (!canvas || !target) return

    const rect = target.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    rectRef.current = rect

    canvas.width = Math.round(rect.width)
    canvas.height = Math.round(rect.height)
    canvas.style.position = 'fixed'
    canvas.style.left = `${rect.left}px`
    canvas.style.top = `${rect.top}px`
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    paint()
  }

  useLayoutEffect(() => {
    setStrokes([])
    current.current = []
    drawing.current = false
  }, [clearSignal])

  useLayoutEffect(() => {
    fitCanvas()
    const target = targetRef.current
    if (!target) return

    const ro = new ResizeObserver(fitCanvas)
    ro.observe(target)
    window.addEventListener('scroll', fitCanvas, true)
    window.addEventListener('resize', fitCanvas)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', fitCanvas, true)
      window.removeEventListener('resize', fitCanvas)
    }
  }, [active, clearSignal, targetRef])

  useLayoutEffect(() => {
    paint()
  }, [strokes])

  const pointFromEvent = (e: React.MouseEvent) => {
    const rect = rectRef.current ?? targetRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  if (!active && strokes.length === 0) return null

  const onDown = (e: React.MouseEvent) => {
    if (!active) return
    e.preventDefault()
    const pt = pointFromEvent(e)
    if (!pt) return
    drawing.current = true
    current.current = [pt]
    paint()
  }

  const onMove = (e: React.MouseEvent) => {
    if (!drawing.current) return
    const pt = pointFromEvent(e)
    if (!pt) return
    current.current.push(pt)
    paint()
  }

  const onUp = () => {
    if (!drawing.current) return
    drawing.current = false
    const finished = [...current.current]
    current.current = []
    if (finished.length > 1) {
      setStrokes((prev) => [...prev, finished])
    } else {
      paint()
    }
  }

  return createPortal(
    <canvas
      ref={canvasRef}
      style={{
        zIndex: 40,
        pointerEvents: active ? 'auto' : 'none',
        cursor: active ? 'crosshair' : 'default',
      }}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
    />,
    document.body,
  )
}
