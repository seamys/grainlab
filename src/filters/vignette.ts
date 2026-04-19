import type { VignetteParams } from './types'

export function applyVignette(imageData: ImageData, params: VignetteParams): void {
  if (params.intensity <= 0) return

  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  const cx = width / 2
  const cy = height / 2
  const strength = params.intensity / 100
  const radius = params.radius
  // feather 0=hard (exponent 5), 50=default (exponent 2.5), 100=soft (exponent 0.5)
  const exponent = Math.max(0.5, 5 - (params.feather ?? 50) * 0.045)
  const vigColorVal = ((params.color ?? 0) / 100) * 255

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - cx) / cx
      const dy = (y - cy) / cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const normalized = dist / radius
      const vignette = 1 - strength * Math.pow(Math.max(0, normalized), exponent)
      const factor = Math.max(0, vignette)

      const idx = (y * width + x) * 4
      data[idx] = (data[idx] * factor + vigColorVal * (1 - factor) + 0.5) | 0
      data[idx + 1] = (data[idx + 1] * factor + vigColorVal * (1 - factor) + 0.5) | 0
      data[idx + 2] = (data[idx + 2] * factor + vigColorVal * (1 - factor) + 0.5) | 0
    }
  }
}
