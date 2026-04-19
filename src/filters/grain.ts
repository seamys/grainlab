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

function seededGaussian(x: number, y: number, seedOffset = 0): number {
  const u = Math.max(0.0001, seededRandom(x, y, 1 + seedOffset))
  const v = seededRandom(x + 7919, y + 6037, 2 + seedOffset)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function applyGrain(imageData: ImageData, params: GrainParams): void {
  if (params.intensity <= 0) return

  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  const strength = (params.intensity / 100) * 60
  const grainSize = Math.max(1, Math.round(params.size))
  const colorVariance = (params.colorVariance ?? 0) / 100
  const shadowBoost = (params.shadowBoost ?? 0) / 100 * 1.5
  const highlightReduction = (params.highlightReduction ?? 0) / 100

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const gx = (x / grainSize) | 0
      const gy = (y / grainSize) | 0

      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]

      // Luminance-based modulation
      const shadowFactor = lum < 128 ? 1 + shadowBoost * (1 - lum / 128) : 1
      const highlightFactor = lum > 200 ? 1 - highlightReduction * ((lum - 200) / 55) : 1
      const lumFactor = shadowFactor * highlightFactor

      const baseNoise = seededGaussian(gx, gy, 0) * strength
      let rNoise = baseNoise
      let gNoise = baseNoise
      let bNoise = baseNoise

      if (colorVariance > 0) {
        rNoise = baseNoise + (seededGaussian(gx, gy, 10) * strength - baseNoise) * colorVariance
        gNoise = baseNoise + (seededGaussian(gx, gy, 20) * strength - baseNoise) * colorVariance
        bNoise = baseNoise + (seededGaussian(gx, gy, 30) * strength - baseNoise) * colorVariance
      }

      const r = data[idx] + rNoise * lumFactor
      const g = data[idx + 1] + gNoise * lumFactor
      const b = data[idx + 2] + bNoise * lumFactor

      data[idx] = r < 0 ? 0 : r > 255 ? 255 : (r + 0.5) | 0
      data[idx + 1] = g < 0 ? 0 : g > 255 ? 255 : (g + 0.5) | 0
      data[idx + 2] = b < 0 ? 0 : b > 255 ? 255 : (b + 0.5) | 0
    }
  }
}
