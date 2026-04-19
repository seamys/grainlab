/**
 * Web Worker for off-main-thread image filter processing.
 * Receives ImageData + FilterParams, returns processed ImageData buffer.
 */

import type { FilterParams, ColorGradeParams, GrainParams, VignetteParams, LightLeakParams, FadeParams } from './types'

// ---- colorGrade ----
function clamp(val: number): number {
  return val < 0 ? 0 : val > 255 ? 255 : (val + 0.5) | 0
}

function applyColorGrade(data: Uint8ClampedArray, len: number, params: ColorGradeParams): void {
  const tempShift = params.temperature / 100
  const tintShift = params.tint / 100
  const satFactor = 1 + params.saturation / 100
  const c = params.contrast * 2.55
  const contrastFactor = (259 * (c + 255)) / (255 * (259 - c))

  for (let i = 0; i < len; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    r = clamp(r + tempShift * 30)
    b = clamp(b - tempShift * 30)
    g = clamp(g - tintShift * 20)

    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    const shadowWeight = lum < 128 ? 1 - lum / 128 : 0
    const highlightWeight = lum > 128 ? (lum - 128) / 127 : 0

    r = clamp(r + params.shadowR * shadowWeight + params.highlightR * highlightWeight)
    g = clamp(g + params.shadowG * shadowWeight + params.highlightG * highlightWeight)
    b = clamp(b + params.shadowB * shadowWeight + params.highlightB * highlightWeight)

    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    r = clamp(gray + satFactor * (r - gray))
    g = clamp(gray + satFactor * (g - gray))
    b = clamp(gray + satFactor * (b - gray))

    r = clamp(contrastFactor * (r - 128) + 128)
    g = clamp(contrastFactor * (g - 128) + 128)
    b = clamp(contrastFactor * (b - 128) + 128)

    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }
}

// ---- fade ----
function applyFade(data: Uint8ClampedArray, len: number, params: FadeParams): void {
  if (params.intensity <= 0) return
  const strength = params.intensity / 100
  const blackLift = strength * 40
  const rangeScale = (255 - blackLift) / 255
  const contrastReduction = 1 - strength * 0.15

  for (let i = 0; i < len; i += 4) {
    let r = blackLift + data[i] * rangeScale
    let g = blackLift + data[i + 1] * rangeScale
    let b = blackLift + data[i + 2] * rangeScale

    r = 128 + (r - 128) * contrastReduction
    g = 128 + (g - 128) * contrastReduction
    b = 128 + (b - 128) * contrastReduction

    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    if (lum < 100) {
      const desatAmount = strength * 0.3 * (1 - lum / 100)
      r = r + (lum - r) * desatAmount
      g = g + (lum - g) * desatAmount
      b = b + (lum - b) * desatAmount
    }

    data[i] = clamp(r)
    data[i + 1] = clamp(g)
    data[i + 2] = clamp(b)
  }
}

// ---- grain (optimized: precomputed noise LUT) ----
function seededRandom(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1013904223) | 0
  h = ((h ^ (h >> 13)) * 1274126177) | 0
  h = h ^ (h >> 16)
  return (h & 0x7fffffff) / 0x7fffffff
}

function applyGrain(data: Uint8ClampedArray, width: number, height: number, params: GrainParams): void {
  if (params.intensity <= 0) return
  const strength = (params.intensity / 100) * 60
  const grainSize = Math.max(1, Math.round(params.size))

  // Precompute noise LUT for grain-sized blocks
  const gw = ((width / grainSize) | 0) + 1
  const gh = ((height / grainSize) | 0) + 1
  const noiseLUT = new Float32Array(gw * gh)
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const u = Math.max(0.0001, seededRandom(gx, gy, 1))
      const v = seededRandom(gx + 7919, gy + 6037, 2)
      noiseLUT[gy * gw + gx] = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * strength
    }
  }

  for (let y = 0; y < height; y++) {
    const gy = (y / grainSize) | 0
    const rowOff = gy * gw
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const noise = noiseLUT[rowOff + ((x / grainSize) | 0)]
      const r = data[idx] + noise
      const g = data[idx + 1] + noise
      const b = data[idx + 2] + noise
      data[idx] = r < 0 ? 0 : r > 255 ? 255 : (r + 0.5) | 0
      data[idx + 1] = g < 0 ? 0 : g > 255 ? 255 : (g + 0.5) | 0
      data[idx + 2] = b < 0 ? 0 : b > 255 ? 255 : (b + 0.5) | 0
    }
  }
}

// ---- vignette (optimized: precomputed per-row distance) ----
function applyVignette(data: Uint8ClampedArray, width: number, height: number, params: VignetteParams): void {
  if (params.intensity <= 0) return
  const cx = width / 2
  const cy = height / 2
  const strength = params.intensity / 100
  const invRadius = 1 / params.radius

  for (let y = 0; y < height; y++) {
    const dy = (y - cy) / cy
    const dy2 = dy * dy
    for (let x = 0; x < width; x++) {
      const dx = (x - cx) / cx
      const dist = Math.sqrt(dx * dx + dy2)
      const normalized = dist * invRadius
      // Faster pow approximation for 2.5: x^2 * x^0.5
      const n2 = normalized * normalized
      const nSqrt = Math.sqrt(normalized > 0 ? normalized : 0)
      const vignette = 1 - strength * n2 * nSqrt
      const factor = vignette > 0 ? vignette : 0

      const idx = (y * width + x) * 4
      data[idx] = (data[idx] * factor + 0.5) | 0
      data[idx + 1] = (data[idx + 1] * factor + 0.5) | 0
      data[idx + 2] = (data[idx + 2] * factor + 0.5) | 0
    }
  }
}

// ---- light leak (optimized: precompute invMaxDist) ----
const COLOR_MAP: Record<string, { r: number; g: number; b: number }> = {
  warm: { r: 255, g: 160, b: 50 },
  cool: { r: 80, g: 140, b: 255 },
  vintage: { r: 255, g: 90, b: 120 },
}

function applyLightLeak(data: Uint8ClampedArray, width: number, height: number, params: LightLeakParams): void {
  if (params.intensity <= 0) return
  const strength = params.intensity / 100
  const color = COLOR_MAP[params.color]

  let ox: number, oy: number
  switch (params.position) {
    case 'top-left': ox = 0; oy = 0; break
    case 'top-right': ox = width; oy = 0; break
    case 'bottom-left': ox = 0; oy = height; break
    case 'bottom-right': ox = width; oy = height; break
  }

  const invMaxDist = 1 / Math.sqrt(width * width + height * height)
  const inv255 = 1 / 255

  for (let y = 0; y < height; y++) {
    const dy = y - oy!
    const dy2 = dy * dy
    for (let x = 0; x < width; x++) {
      const dx = x - ox!
      const dist = Math.sqrt(dx * dx + dy2) * invMaxDist
      const leakStrength = (1 - dist * 1.8) * strength
      if (leakStrength <= 0) continue

      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      data[idx] = Math.min(255, (r + color.r * (1 - r * inv255) * leakStrength + 0.5) | 0)
      data[idx + 1] = Math.min(255, (g + color.g * (1 - g * inv255) * leakStrength + 0.5) | 0)
      data[idx + 2] = Math.min(255, (b + color.b * (1 - b * inv255) * leakStrength + 0.5) | 0)
    }
  }
}

// ---- worker message handler ----
self.onmessage = (e: MessageEvent) => {
  const { buffer, width, height, params } = e.data as {
    buffer: ArrayBuffer
    width: number
    height: number
    params: FilterParams
  }

  const data = new Uint8ClampedArray(buffer)
  const len = data.length

  applyColorGrade(data, len, params.colorGrade)
  applyFade(data, len, params.fade)
  applyGrain(data, width, height, params.grain)
  applyVignette(data, width, height, params.vignette)
  applyLightLeak(data, width, height, params.lightLeak)

  // Transfer buffer back (zero-copy)
  self.postMessage({ buffer: data.buffer, width, height }, [data.buffer] as any)
}
