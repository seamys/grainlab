import type { LightLeakParams } from './types'

const COLOR_MAP = {
  warm: { r: 255, g: 160, b: 50 },
  cool: { r: 80, g: 140, b: 255 },
  vintage: { r: 255, g: 90, b: 120 },
}

export function applyLightLeak(imageData: ImageData, params: LightLeakParams): void {
  if (params.intensity <= 0) return

  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  const strength = params.intensity / 100
  const color = COLOR_MAP[params.color]

  // Origin point based on position
  let ox: number, oy: number
  switch (params.position) {
    case 'top-left':
      ox = 0; oy = 0; break
    case 'top-right':
      ox = width; oy = 0; break
    case 'bottom-left':
      ox = 0; oy = height; break
    case 'bottom-right':
      ox = width; oy = height; break
  }

  const maxDist = Math.sqrt(width * width + height * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - ox
      const dy = y - oy
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist

      // Stronger near origin, fade with distance
      const leakStrength = Math.max(0, 1 - dist * 1.8) * strength
      if (leakStrength <= 0) continue

      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      // Screen blend: result = base + blend * (1 - base/255) * strength
      data[idx] = Math.min(255, (r + color.r * (1 - r / 255) * leakStrength + 0.5) | 0)
      data[idx + 1] = Math.min(255, (g + color.g * (1 - g / 255) * leakStrength + 0.5) | 0)
      data[idx + 2] = Math.min(255, (b + color.b * (1 - b / 255) * leakStrength + 0.5) | 0)
    }
  }
}
