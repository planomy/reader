import type { HighlightColor } from '../types'

/** Opaque marker colours — inline so they cannot be washed out by theme CSS. */
export const HIGHLIGHT_MARK: Record<
  HighlightColor,
  { backgroundColor: string; color: string }
> = {
  yellow: { backgroundColor: '#FFEB3B', color: '#1a1028' },
  green: { backgroundColor: '#00E676', color: '#0a2818' },
  blue: { backgroundColor: '#40C4FF', color: '#0a1e28' },
  pink: { backgroundColor: '#FF4081', color: '#280a18' },
  orange: { backgroundColor: '#FF9100', color: '#281800' },
}
