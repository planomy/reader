export function getWordAtOffset(text: string, offset: number): { start: number; end: number; word: string } | null {
  if (offset < 0 || offset >= text.length) return null
  const isWordChar = (c: string) => /[\w'-]/.test(c)
  if (!isWordChar(text[offset]!) && offset > 0 && isWordChar(text[offset - 1]!)) {
    offset -= 1
  } else if (!isWordChar(text[offset]!)) {
    return null
  }
  let start = offset
  let end = offset
  while (start > 0 && isWordChar(text[start - 1]!)) start--
  while (end < text.length && isWordChar(text[end]!)) end++
  const word = text.slice(start, end)
  return word.length > 0 ? { start, end, word } : null
}

export function splitSentences(text: string): { start: number; end: number; text: string }[] {
  const sentences: { start: number; end: number; text: string }[] = []
  const regex = /[^.!?]+[.!?]+|\S+/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    sentences.push({ start: match.index, end: match.index + match[0].length, text: match[0] })
  }
  return sentences
}

export function getSelectionOffsets(container: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
  const range = sel.getRangeAt(0)
  if (!container.contains(range.commonAncestorContainer)) return null

  const preRange = document.createRange()
  preRange.selectNodeContents(container)
  preRange.setEnd(range.startContainer, range.startOffset)
  const start = preRange.toString().length
  const end = start + range.toString().length
  return start < end ? { start, end } : null
}

export interface TextSegment {
  start: number
  end: number
  text: string
  highlight?: string
  annotated?: boolean
  annotationNote?: string
}

export function buildSegments(
  text: string,
  highlights: { start: number; end: number; color: string }[],
  annotations: { start: number; end: number; note: string }[],
): TextSegment[] {
  if (!text) return []

  const boundaries = new Set<number>([0, text.length])
  for (const h of highlights) {
    boundaries.add(h.start)
    boundaries.add(h.end)
  }
  for (const a of annotations) {
    boundaries.add(a.start)
    boundaries.add(a.end)
  }
  const points = [...boundaries].sort((a, b) => a - b)
  const segments: TextSegment[] = []

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]!
    const end = points[i + 1]!
    if (start >= end) continue

    const highlight = highlights.find((h) => h.start <= start && h.end >= end)
    const annotation = annotations.find((a) => a.start <= start && a.end >= end)

    segments.push({
      start,
      end,
      text: text.slice(start, end),
      highlight: highlight?.color,
      annotated: !!annotation,
      annotationNote: annotation?.note,
    })
  }
  return segments
}

export function uid(): string {
  return crypto.randomUUID()
}
