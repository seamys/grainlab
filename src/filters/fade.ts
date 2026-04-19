import type { FadeParams } from './types'

export function applyFade(imageData: ImageData, params: FadeParams): void {
  if (params.intensity <= 0) return

  const data = imageData.data
  const len = data.length
  const strength = params.intensity / 100

  // Lift blacks: minimum output value (max lift ~40)
  const blackLift = strength * 40
  const rangeScale = (255 - blackLift) / 255

  // Slight contrast reduction
  const contrastReduction = 1 - strength * 0.15

  for (let i = 0; i < len; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    // Lift blacks
    r = blackLift + r * rangeScale
    g = blackLift + g * rangeScale
    b = blackLift + b * rangeScale

    // Reduce contrast (compress toward midpoint)
    r = 128 + (r - 128) * contrastReduction
    g = 128 + (g - 128) * contrastReduction
    b = 128 + (b - 128) * contrastReduction

    // Desaturate shadows
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    if (lum < 100) {
      const desatAmount = strength * 0.3 * (1 - lum / 100)
      r = r + (lum - r) * desatAmount
      g = g + (lum - g) * desatAmount
      b = b + (lum - b) * desatAmount
    }

    data[i] = r < 0 ? 0 : r > 255 ? 255 : (r + 0.5) | 0
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : (g + 0.5) | 0
    data[i + 2] = b < 0 ? 0 : b > 255 ? 255 : (b + 0.5) | 0
  }
}
