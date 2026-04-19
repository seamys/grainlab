import type { HalationParams } from './types'
import { boxBlur } from './blur'

const HALATION_COLORS = {
  red:  { r: 255, g: 40,  b: 20 },
  warm: { r: 255, g: 120, b: 60 },
  gold: { r: 255, g: 200, b: 80 },
}

/**
 * Halation: bright areas bleed warm/red light into surrounding pixels,
 * mimicking light reflecting off the film base.
 */
export function applyHalation(imageData: ImageData, params: HalationParams): void {
  if (params.intensity <= 0) return

  const { data, width, height } = imageData
  const strength = params.intensity / 100
  const r = Math.max(1, Math.min(20, Math.round(params.radius)))
  const hColor = HALATION_COLORS[params.color]

  // Extract bright-pass luminance map (lum > 180)
  const bright = new Float32Array(width * height)
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    bright[i >> 2] = lum > 180 ? (lum - 180) / 75 : 0 // 0..1
  }

  const blurred = boxBlur(bright, width, height, r)

  // Screen blend with halation color
  for (let i = 0; i < data.length; i += 4) {
    const bp = Math.min(1, blurred[i >> 2] * strength * 1.5)
    if (bp <= 0) continue
    data[i]     = Math.min(255, (data[i]     + hColor.r * (1 - data[i]     / 255) * bp + 0.5) | 0)
    data[i + 1] = Math.min(255, (data[i + 1] + hColor.g * (1 - data[i + 1] / 255) * bp + 0.5) | 0)
    data[i + 2] = Math.min(255, (data[i + 2] + hColor.b * (1 - data[i + 2] / 255) * bp + 0.5) | 0)
  }
}
