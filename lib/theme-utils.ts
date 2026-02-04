/**
 * Convert hex color to HSL string for CSS variables.
 * Returns "H S% L%" (no "hsl()") so it works with hsl(var(--primary)).
 */
export function hexToHsl(hex: string): string {
  const trimmed = hex.replace(/^#/, '').trim()
  if (trimmed.length !== 6 && trimmed.length !== 3) {
    return '217 91% 60%' // default blue
  }
  const r =
    trimmed.length === 6
      ? parseInt(trimmed.slice(0, 2), 16) / 255
      : parseInt(trimmed[0]! + trimmed[0], 16) / 255
  const g =
    trimmed.length === 6
      ? parseInt(trimmed.slice(2, 4), 16) / 255
      : parseInt(trimmed[1]! + trimmed[1], 16) / 255
  const b =
    trimmed.length === 6
      ? parseInt(trimmed.slice(4, 6), 16) / 255
      : parseInt(trimmed[2]! + trimmed[2], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  const H = Math.round(h * 360)
  const S = Math.round(s * 100)
  const L = Math.round(l * 100)
  return `${H} ${S}% ${L}%`
}

/**
 * Return a contrasting foreground color (white or dark) for a given HSL lightness.
 * Used for --primary-foreground so text on primary is readable.
 */
export function getPrimaryForegroundHsl(hsl: string): string {
  const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
  if (!match) return '0 0% 98%'
  const l = parseInt(match[3]!, 10)
  // Light background -> dark text; dark background -> light text
  return l > 50 ? '222.2 47.4% 11.2%' : '0 0% 98%'
}
