import type { GrainParams } from './types'

/**
 * Deterministic seeded random based on pixel coordinates.
 * Prevents grain flickering when other parameters change.
 */
function seededRandom(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1013904223) | 0
  h = ((h ^ (h >> 13)) * 1274126177) | 0
  h = h ^ (h >> 16)
  return (h & 0x7fffffff) / 0x7fffffff
}

function seededGaussian(x: number, y: number): number {
  const u = Math.max(0.0001, seededRandom(x, y, 1))
  const v = seededRandom(x + 7919, y + 6037, 2)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function applyGrain(imageData: ImageData, params: GrainParams): void {
  if (params.intensity <= 0) return

  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  const strength = (params.intensity / 100) * 60 // max noise amplitude ~60
  const grainSize = Math.max(1, Math.round(params.size))

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4

      // Sample noise at grain-sized blocks for larger grain
      const gx = (x / grainSize) | 0
      const gy = (y / grainSize) | 0
      const noise = seededGaussian(gx, gy) * strength

      // Apply noise uniformly to RGB (luminance-only approximation)
      const r = data[idx] + noise
      const g = data[idx + 1] + noise
      const b = data[idx + 2] + noise

      data[idx] = r < 0 ? 0 : r > 255 ? 255 : (r + 0.5) | 0
      data[idx + 1] = g < 0 ? 0 : g > 255 ? 255 : (g + 0.5) | 0
      data[idx + 2] = b < 0 ? 0 : b > 255 ? 255 : (b + 0.5) | 0
    }
  }
}
