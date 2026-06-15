export function vibrate(pattern: number | number[], enabled: boolean) {
  if (!enabled) return
  if (typeof navigator === 'undefined') return
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // ignore
    }
  }
}
