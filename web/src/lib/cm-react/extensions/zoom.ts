export const FONT_MAX = 42
export const FONT_MIN = 7
const FONT_SCALE_STEP = 1.4

export const arithmeticFontScale = (current: number, direction: number) => {
  const stepped = current + direction * FONT_SCALE_STEP
  const bounded = Math.min(FONT_MAX, Math.max(FONT_MIN, stepped))
  return Math.round(bounded * 10) / 10
}
