import type { BloomParams } from './types'
import { boxBlur } from './blur'

/**
 * Bloom: soft glow emanating from bright areas, simulating lens flare / diffusion.
 */
export function applyBloom(imageData: ImageData, params: BloomParams): void {
  if (params.intensity <= 0) return

  const { data, width, height } = imageData
  const strength = params.intensity / 100
  const threshold = (params.threshold / 100) * 255
  const r = Math.max(1, Math.min(20, Math.round(params.radius)))

  // Extract bright pass per channel
  const brightR = new Float32Array(width * height)
  const brightG = new Float32Array(width * height)
  const brightB = new Float32Array(width * height)

  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    if (lum > threshold) {
      const factor = (lum - threshold) / (255 - threshold + 1)
      const idx = i >> 2
      brightR[idx] = (data[i]     / 255) * factor
      brightG[idx] = (data[i + 1] / 255) * factor
      brightB[idx] = (data[i + 2] / 255) * factor
    }
  }

  const blurR = boxBlur(brightR, width, height, r)
  const blurG = boxBlur(brightG, width, height, r)
  const blurB = boxBlur(brightB, width, height, r)

  // Screen blend back
  for (let i = 0; i < data.length; i += 4) {
    const idx = i >> 2
    const br = blurR[idx] * 255 * strength
    const bg = blurG[idx] * 255 * strength
    const bb = blurB[idx] * 255 * strength
    data[i]     = Math.min(255, (data[i]     + br * (1 - data[i]     / 255) + 0.5) | 0)
    data[i + 1] = Math.min(255, (data[i + 1] + bg * (1 - data[i + 1] / 255) + 0.5) | 0)
    data[i + 2] = Math.min(255, (data[i + 2] + bb * (1 - data[i + 2] / 255) + 0.5) | 0)
  }
}
