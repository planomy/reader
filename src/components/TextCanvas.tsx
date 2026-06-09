import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Highlight, HighlightColor, WordAnnotation } from '../types'
import { segmentsForLine, wrapTextToLines } from '../utils/lines'
import { HIGHLIGHT_MARK } from '../utils/highlights'
import { buildSegments, getWordAtOffset, pointToOffset, splitSentences } from '../utils/text'

const FONT_FAMILY: Record<string, string> = {
  'font-fredoka': 'Fredoka, sans-serif',
  'font-nunito': 'Nunito, sans-serif',
  'font-caveat': 'Caveat, cursive',
  'font-patrick': 'Patrick Hand, cursive',
  'font-space': 'Space Grotesk, sans-serif',
}

interface TextCanvasProps {
  text: string
  highlights: Highlight[]
  annotations: WordAnnotation[]
  fontSize: number
  lineHeight: number
  fontClass: string
  revealMode: boolean
  revealedSentences: number
  focusLine: boolean
  showLineNumbers: boolean
  answersHidden: boolean
  answerKeyMode?: boolean
  activeColor?: HighlightColor
  label?: string
  disabled?: boolean
  onHighlight: (start: number, end: number) => void
  onWordDoubleClick: (start: number, end: number, word: string, x: number, y: number) => void
  onRevealNext: () => void
}

export function TextCanvas({
  text,
  highlights,
  annotations,
  fontSize,
  lineHeight,
  fontClass,
  revealMode,
  revealedSentences,
  focusLine,
  showLineNumbers,
  answersHidden,
  answerKeyMode = false,
  activeColor = 'yellow',
  label,
  disabled,
  onHighlight,
  onWordDoubleClick,
  onRevealNext,
}: TextCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [focusIndex, setFocusIndex] = useState<number | null>(null)
  const [bodyWidth, setBodyWidth] = useState(0)
  const [previewRects, setPreviewRects] = useState<DOMRect[]>([])

  const canHighlight = !disabled && !revealMode
  const paintHighlights = highlights.filter((h) => !h.hidden || !answersHidden)
  const segments = buildSegments(text, paintHighlights, annotations, highlights)
  const sentences = splitSentences(text)
  const previewMark = HIGHLIGHT_MARK[activeColor]

  useEffect(() => {
    if (!canHighlight) {
      setPreviewRects([])
      return
    }

    const syncPreview = () => {
      const el = containerRef.current
      const sel = window.getSelection()
      if (!el || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setPreviewRects([])
        return
      }
      const range = sel.getRangeAt(0)
      if (!el.contains(range.commonAncestorContainer)) {
        setPreviewRects([])
        return
      }
      setPreviewRects(
        Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0),
      )
    }

    document.addEventListener('selectionchange', syncPreview)
    return () => document.removeEventListener('selectionchange', syncPreview)
  }, [canHighlight])

  useEffect(() => {
    if (!focusLine) setFocusIndex(null)
  }, [focusLine])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setBodyWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text, showLineNumbers, fontSize, fontClass])

  const visualLines = useMemo(() => {
    if (!showLineNumbers || !text) return null
    const family = FONT_FAMILY[fontClass] ?? 'Nunito, sans-serif'
    const width = Math.max(bodyWidth - 8, 320)
    const font = `${fontSize}px ${family}`
    return wrapTextToLines(text, width, font)
  }, [showLineNumbers, text, bodyWidth, fontSize, fontClass])

  const renderSegmentSpan = (
    seg: (typeof segments)[0],
    key: string | number,
  ) => {
    const colorKey = seg.highlight as HighlightColor | undefined
    const mark =
      colorKey && colorKey in HIGHLIGHT_MARK
        ? HIGHLIGHT_MARK[colorKey as keyof typeof HIGHLIGHT_MARK]
        : null

    return (
      <span
        key={key}
        data-offset-start={seg.start}
        data-offset-end={seg.end}
        className={[
          colorKey ? `hl hl--${colorKey}` : '',
          seg.annotated ? 'annotated' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={
          mark
            ? {
                backgroundColor: mark.backgroundColor,
                color: mark.color,
                borderRadius: 3,
                padding: '0 1px',
                margin: '0 -1px',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone',
                fontWeight: 600,
              }
            : undefined
        }
        title={seg.annotationNote || undefined}
      >
        {seg.text}
      </span>
    )
  }

  const renderTextSlice = (start: number, end: number, slice: string, key: string | number) => (
    <span key={key} data-offset-start={start} data-offset-end={end}>
      {slice}
    </span>
  )

  const renderSentenceSegments = (sentence: { start: number; end: number }) => {
    const parts = segmentsForLine(segments, text, sentence)
    return parts.length > 0
      ? parts.map((seg, i) => renderSegmentSpan(seg, i))
      : renderTextSlice(sentence.start, sentence.end, text.slice(sentence.start, sentence.end), 'plain')
  }

  const renderContent = () => {
    if (revealMode) {
      return sentences.map((sentence, idx) => {
        const visible = idx < revealedSentences
        return (
          <span
            key={idx}
            className={`sentence ${visible ? 'sentence--visible' : 'sentence--hidden'}`}
          >
            {sentence.text}
          </span>
        )
      })
    }

    if (focusLine) {
      return sentences.map((sentence, idx) => {
        const dimmed = focusIndex !== null && idx !== focusIndex
        return (
          <span
            key={idx}
            className={`focus-sentence${dimmed ? ' dimmed' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setFocusIndex(idx)
            }}
          >
            {renderSentenceSegments(sentence)}
          </span>
        )
      })
    }

    if (showLineNumbers && visualLines) {
      return visualLines.map((line, lineIdx) => {
        const lineSegments = segmentsForLine(segments, text, line)
        return (
          <div key={lineIdx} className="text-line">
            <span className="line-num">{lineIdx + 1}</span>
            <span className="line-body">
              {lineSegments.length > 0
                ? lineSegments.map((seg, idx) => renderSegmentSpan(seg, idx))
                : renderTextSlice(line.start, line.end, text.slice(line.start, line.end), lineIdx)}
            </span>
          </div>
        )
      })
    }

    return segments.map((seg, idx) => renderSegmentSpan(seg, idx))
  }

  const handleMouseUp = () => {
    if (!canHighlight || !containerRef.current) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return

    const range = sel.getRangeAt(0)
    const el = containerRef.current
    if (!el.contains(range.commonAncestorContainer)) return

    const start = pointToOffset(el, range.startContainer, range.startOffset)
    const end = pointToOffset(el, range.endContainer, range.endOffset)
    if (start < end) onHighlight(start, end)

    setPreviewRects([])
    sel.removeAllRanges()
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (disabled || !containerRef.current) return
    const preRange = document.caretRangeFromPoint(e.clientX, e.clientY)
    if (!preRange) return
    const offset = pointToOffset(
      containerRef.current,
      preRange.startContainer,
      preRange.startOffset,
    )
    const word = getWordAtOffset(text, offset)
    if (word) onWordDoubleClick(word.start, word.end, word.word, e.clientX, e.clientY)
  }

  const handleClick = () => {
    if (revealMode) onRevealNext()
  }

  if (!text) {
    return (
      <div className={`text-canvas text-canvas--empty ${label ? 'text-canvas--labeled' : ''}`}>
        {label && <span className="text-canvas__label">{label}</span>}
        <p>Paste or type your paragraph in the toolbox.</p>
      </div>
    )
  }

  return (
    <div
      className={[
        'text-canvas',
        fontClass,
        focusLine ? 'text-canvas--focus' : '',
        label ? 'text-canvas--labeled' : '',
        showLineNumbers ? 'text-canvas--lined' : '',
        answerKeyMode ? 'text-canvas--answer-key' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ fontSize: `${fontSize}px`, lineHeight }}
    >
      {label && <span className="text-canvas__label">{label}</span>}
      <div
        ref={containerRef}
        className={`text-canvas__body${canHighlight ? ' text-canvas__body--selectable' : ''}`}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onClick={handleClick}
      >
        {renderContent()}
      </div>
      {previewRects.length > 0 && (
        <div className="selection-preview-layer" aria-hidden>
          {previewRects.map((rect, i) => (
            <span
              key={i}
              className={`selection-preview ${answerKeyMode ? 'selection-preview--answer' : ''}`}
              style={
                answerKeyMode
                  ? {
                      top: rect.top,
                      left: rect.left,
                      width: rect.width,
                      height: rect.height,
                    }
                  : {
                      top: rect.top,
                      left: rect.left,
                      width: rect.width,
                      height: rect.height,
                      backgroundColor: previewMark.backgroundColor,
                    }
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
