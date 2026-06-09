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

function isLineNumText(node: Node): boolean {
  let el: Element | null = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element)
  while (el) {
    if (el.classList.contains('line-num')) return true
    if (el.classList.contains('text-canvas__body')) return false
    el = el.parentElement
  }
  return false
}

function startOfNode(node: Node): { node: Node; offset: number } {
  if (node.nodeType === Node.TEXT_NODE) return { node, offset: 0 }
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
  const first = walker.nextNode()
  return first ? { node: first, offset: 0 } : { node, offset: 0 }
}

function endOfNode(node: Node): { node: Node; offset: number } {
  if (node.nodeType === Node.TEXT_NODE) {
    return { node, offset: node.textContent?.length ?? 0 }
  }
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
  let last: Node | null = null
  let n: Node | null
  while ((n = walker.nextNode())) last = n
  return last
    ? { node: last, offset: last.textContent?.length ?? 0 }
    : { node, offset: 0 }
}

function normalizePoint(node: Node, offset: number): { node: Node; offset: number } {
  if (node.nodeType === Node.TEXT_NODE) return { node, offset }

  const el = node as Element
  if (offset >= el.childNodes.length) {
    const last = el.childNodes[el.childNodes.length - 1]
    return last ? endOfNode(last) : { node, offset: 0 }
  }

  const child = el.childNodes[offset]
  return child ? startOfNode(child) : { node, offset: 0 }
}

/** Map a DOM point to a plain-text offset via the nearest [data-offset-start] ancestor. */
export function pointToOffset(container: HTMLElement, node: Node, offset: number): number {
  if (isLineNumText(node)) return 0

  const { node: targetNode, offset: targetOffset } = normalizePoint(node, offset)

  let el: Element | null =
    targetNode.nodeType === Node.TEXT_NODE ? targetNode.parentElement : (targetNode as Element)

  while (el && container.contains(el)) {
    if (el.hasAttribute('data-offset-start')) {
      const base = parseInt(el.getAttribute('data-offset-start')!, 10)
      const r = document.createRange()
      r.selectNodeContents(el)
      try {
        r.setEnd(targetNode, targetOffset)
        return base + r.toString().length
      } catch {
        return base
      }
    }
    el = el.parentElement
  }

  return 0
}

export function getSelectionOffsets(container: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
  const range = sel.getRangeAt(0)
  if (!container.contains(range.commonAncestorContainer)) return null

  const start = pointToOffset(container, range.startContainer, range.startOffset)
  const end = pointToOffset(container, range.endContainer, range.endOffset)
  if (start >= end) return null
  return { start, end }
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
  paintHighlights: { start: number; end: number; color: string }[],
  annotations: { start: number; end: number; note: string }[],
  allHighlights?: { start: number; end: number }[],
): TextSegment[] {
  if (!text) return []

  const boundsSource = allHighlights ?? paintHighlights
  const boundaries = new Set<number>([0, text.length])
  for (const h of boundsSource) {
    boundaries.add(Math.max(0, Math.min(h.start, text.length)))
    boundaries.add(Math.max(0, Math.min(h.end, text.length)))
  }
  for (const a of annotations) {
    boundaries.add(Math.max(0, Math.min(a.start, text.length)))
    boundaries.add(Math.max(0, Math.min(a.end, text.length)))
  }
  const points = [...boundaries].sort((a, b) => a - b)
  const segments: TextSegment[] = []

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]!
    const end = points[i + 1]!
    if (start >= end) continue

    const highlight = paintHighlights.find((h) => start < h.end && end > h.start)
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
