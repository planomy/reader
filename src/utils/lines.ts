/** Word-wrap plain text to visual lines for a given font and width. */
export function wrapTextToLines(
  text: string,
  maxWidth: number,
  font: string,
): { start: number; end: number }[] {
  if (!text) return [{ start: 0, end: 0 }]
  if (maxWidth <= 0) return [{ start: 0, end: text.length }]

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return [{ start: 0, end: text.length }]
  ctx.font = font

  const measure = (s: string) => ctx.measureText(s).width
  const lines: { start: number; end: number }[] = []
  let i = 0

  while (i < text.length) {
    if (text[i] === '\n') {
      lines.push({ start: i, end: i })
      i += 1
      continue
    }

    const nl = text.indexOf('\n', i)
    const paragraphEnd = nl >= 0 ? nl : text.length
    let lineStart = i

    while (lineStart < paragraphEnd) {
      let lo = lineStart + 1
      let hi = paragraphEnd
      let best = lineStart

      if (measure(text.slice(lineStart, paragraphEnd)) <= maxWidth) {
        lines.push({ start: lineStart, end: paragraphEnd })
        break
      }

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2)
        const slice = text.slice(lineStart, mid)
        if (measure(slice) <= maxWidth) {
          best = mid
          lo = mid + 1
        } else {
          hi = mid - 1
        }
      }

      if (best <= lineStart) best = lineStart + 1

      let breakAt = text.lastIndexOf(' ', best)
    if (breakAt <= lineStart) breakAt = best

    lines.push({ start: lineStart, end: breakAt })
    const prev = lineStart
    lineStart = breakAt
    if (text[lineStart] === ' ') lineStart += 1
    if (lineStart <= prev) lineStart = prev + 1
  }

    i = paragraphEnd
    if (text[i] === '\n') i += 1
  }

  return lines.length > 0 ? lines : [{ start: 0, end: text.length }]
}

export function segmentsForLine<T extends { start: number; end: number; text: string }>(
  segments: T[],
  text: string,
  line: { start: number; end: number },
): T[] {
  const result: T[] = []
  for (const seg of segments) {
    if (seg.end <= line.start || seg.start >= line.end) continue
    const start = Math.max(seg.start, line.start)
    const end = Math.min(seg.end, line.end)
    result.push({ ...seg, start, end, text: text.slice(start, end) } as T)
  }
  return result
}
