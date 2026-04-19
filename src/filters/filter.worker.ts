/**
 * Web Worker for off-main-thread image filter processing.
 * All filter logic is inlined for zero-import overhead.
 */

import type {
  FilterParams,
  ColorGradeParams,
  GrainParams,
  VignetteParams,
  LightLeakParams,
  FadeParams,
  HalationParams,
  BloomParams,
  ToneCurveParams,
} from './types'

// ---- utils ----
function clamp(val: number): number {
  return val < 0 ? 0 : val > 255 ? 255 : (val + 0.5) | 0
}

// ---- box blur (shared by halation + bloom) ----
function boxBlur(src: Float32Array, width: number, height: number, r: number): Float32Array {
  const tmp = new Float32Array(width * height)
  const dst = new Float32Array(width * height)
  const invD = 1 / (2 * r + 1)
  for (let y = 0; y < height; y++) {
    const off = y * width; let sum = 0
    for (let k = 0; k <= r; k++) sum += src[off + k]
    for (let x = 0; x < width; x++) {
      tmp[off + x] = sum * invD
      const add = x + r + 1; const rem = x - r
      if (add < width) sum += src[off + add]
      if (rem >= 0) sum -= src[off + rem]
    }
  }
  for (let x = 0; x < width; x++) {
    let sum = 0
    for (let k = 0; k <= r; k++) sum += tmp[k * width + x]
    for (let y = 0; y < height; y++) {
      dst[y * width + x] = sum * invD
      const add = y + r + 1; const rem = y - r
      if (add < height) sum += tmp[add * width + x]
      if (rem >= 0) sum -= tmp[rem * width + x]
    }
  }
  return dst
}

// ---- toneCurve ----
function applyToneCurve(data: Uint8ClampedArray, len: number, params: ToneCurveParams): void {
  if (!params || (params.shadows === 0 && params.midtones === 0 && params.highlights === 0)) return
  const lut = new Uint8Array(256)
  const cp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v))
  const pts: [number, number][] = [
    [0, 0], [64, cp(64 + params.shadows)], [128, cp(128 + params.midtones)],
    [192, cp(192 + params.highlights)], [255, 255],
  ]
  for (let i = 0; i < 256; i++) {
    let j = 0
    while (j < pts.length - 2 && pts[j + 1][0] <= i) j++
    const [x0, y0] = pts[j]; const [x1, y1] = pts[j + 1]
    lut[i] = cp(y0 + (y1 - y0) * (i - x0) / (x1 - x0))
  }
  for (let i = 0; i < len; i += 4) {
    data[i] = lut[data[i]]; data[i + 1] = lut[data[i + 1]]; data[i + 2] = lut[data[i + 2]]
  }
}

// ---- colorGrade ----
function applyColorGrade(data: Uint8ClampedArray, len: number, params: ColorGradeParams): void {
  const tempShift = params.temperature / 100
  const tintShift = params.tint / 100
  const satFactor = 1 + params.saturation / 100
  const c = params.contrast * 2.55
  const contrastFactor = (259 * (c + 255)) / (255 * (259 - c))
  const exposureFactor = Math.pow(2, (params.exposure ?? 0) / 100 * 2)
  const highlightAdj = (params.highlights ?? 0) / 100
  const shadowAdj = (params.shadows ?? 0) / 100
  const midR = params.midtoneR ?? 0
  const midG = params.midtoneG ?? 0
  const midB = params.midtoneB ?? 0

  for (let i = 0; i < len; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    r = clamp(r * exposureFactor); g = clamp(g * exposureFactor); b = clamp(b * exposureFactor)
    r = clamp(r + tempShift * 30); b = clamp(b - tempShift * 30)
    g = clamp(g - tintShift * 20)

    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    const sw = lum < 128 ? 1 - lum / 128 : 0
    const hw = lum > 128 ? (lum - 128) / 127 : 0
    const mw = 1 - sw - hw

    r = clamp(r + params.shadowR * sw + params.highlightR * hw + midR * mw)
    g = clamp(g + params.shadowG * sw + params.highlightG * hw + midG * mw)
    b = clamp(b + params.shadowB * sw + params.highlightB * hw + midB * mw)

    const lum2 = 0.299 * r + 0.587 * g + 0.114 * b
    if (highlightAdj !== 0 && lum2 > 128) {
      const adj = highlightAdj * ((lum2 - 128) / 127) * 50
      r = clamp(r + adj); g = clamp(g + adj); b = clamp(b + adj)
    }
    if (shadowAdj !== 0 && lum2 < 128) {
      const adj = shadowAdj * (1 - lum2 / 128) * 50
      r = clamp(r + adj); g = clamp(g + adj); b = clamp(b + adj)
    }

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

// ---- halation ----
const HALATION_COLORS: Record<string, { r: number; g: number; b: number }> = {
  red:  { r: 255, g: 40,  b: 20 },
  warm: { r: 255, g: 120, b: 60 },
  gold: { r: 255, g: 200, b: 80 },
}

function applyHalation(data: Uint8ClampedArray, width: number, height: number, params: HalationParams, pixelScale = 1): void {
  if (!params || params.intensity <= 0) return
  const strength = params.intensity / 100
  const r = Math.max(1, Math.min(Math.round(20 * pixelScale), Math.round(params.radius * pixelScale)))
  const hc = HALATION_COLORS[params.color] ?? HALATION_COLORS.warm
  const bright = new Float32Array(width * height)
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    bright[i >> 2] = lum > 180 ? (lum - 180) / 75 : 0
  }
  const blurred = boxBlur(bright, width, height, r)
  for (let i = 0; i < data.length; i += 4) {
    const bp = Math.min(1, blurred[i >> 2] * strength * 1.5)
    if (bp <= 0) continue
    data[i]     = Math.min(255, (data[i]     + hc.r * (1 - data[i]     / 255) * bp + 0.5) | 0)
    data[i + 1] = Math.min(255, (data[i + 1] + hc.g * (1 - data[i + 1] / 255) * bp + 0.5) | 0)
    data[i + 2] = Math.min(255, (data[i + 2] + hc.b * (1 - data[i + 2] / 255) * bp + 0.5) | 0)
  }
}

// ---- bloom ----
function applyBloom(data: Uint8ClampedArray, width: number, height: number, params: BloomParams, pixelScale = 1): void {
  if (!params || params.intensity <= 0) return
  const strength = params.intensity / 100
  const threshold = (params.threshold / 100) * 255
  const r = Math.max(1, Math.min(Math.round(20 * pixelScale), Math.round(params.radius * pixelScale)))
  const bR = new Float32Array(width * height)
  const bG = new Float32Array(width * height)
  const bB = new Float32Array(width * height)
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    if (lum > threshold) {
      const f = (lum - threshold) / (255 - threshold + 1)
      const idx = i >> 2
      bR[idx] = (data[i] / 255) * f; bG[idx] = (data[i + 1] / 255) * f; bB[idx] = (data[i + 2] / 255) * f
    }
  }
  const blR = boxBlur(bR, width, height, r)
  const blG = boxBlur(bG, width, height, r)
  const blB = boxBlur(bB, width, height, r)
  for (let i = 0; i < data.length; i += 4) {
    const idx = i >> 2
    const br = blR[idx] * 255 * strength; const bg = blG[idx] * 255 * strength; const bb = blB[idx] * 255 * strength
    data[i]     = Math.min(255, (data[i]     + br * (1 - data[i]     / 255) + 0.5) | 0)
    data[i + 1] = Math.min(255, (data[i + 1] + bg * (1 - data[i + 1] / 255) + 0.5) | 0)
    data[i + 2] = Math.min(255, (data[i + 2] + bb * (1 - data[i + 2] / 255) + 0.5) | 0)
  }
}

// ---- grain (optimized: precomputed noise LUT) ----
function seededRandom(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1013904223) | 0
  h = ((h ^ (h >> 13)) * 1274126177) | 0
  h = h ^ (h >> 16)
  return (h & 0x7fffffff) / 0x7fffffff
}

function applyGrain(data: Uint8ClampedArray, width: number, height: number, params: GrainParams, pixelScale = 1): void {
  if (params.intensity <= 0) return
  const strength = (params.intensity / 100) * 60
  const gs = Math.max(1, Math.round(params.size * pixelScale))
  const colorVariance = (params.colorVariance ?? 0) / 100
  const shadowBoost = (params.shadowBoost ?? 0) / 100 * 1.5
  const highlightReduction = (params.highlightReduction ?? 0) / 100

  const gw = ((width / gs) | 0) + 1
  const gh = ((height / gs) | 0) + 1
  const lut0 = new Float32Array(gw * gh)
  const lutR = colorVariance > 0 ? new Float32Array(gw * gh) : null
  const lutG = colorVariance > 0 ? new Float32Array(gw * gh) : null
  const lutB = colorVariance > 0 ? new Float32Array(gw * gh) : null

  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const off = gy * gw + gx
      const u0 = Math.max(0.0001, seededRandom(gx, gy, 1))
      const v0 = seededRandom(gx + 7919, gy + 6037, 2)
      lut0[off] = Math.sqrt(-2 * Math.log(u0)) * Math.cos(2 * Math.PI * v0) * strength
      if (colorVariance > 0 && lutR && lutG && lutB) {
        const noiseR = Math.sqrt(-2 * Math.log(Math.max(0.0001, seededRandom(gx, gy, 11)))) * Math.cos(2 * Math.PI * seededRandom(gx + 7919, gy + 6037, 12)) * strength
        const noiseG = Math.sqrt(-2 * Math.log(Math.max(0.0001, seededRandom(gx, gy, 21)))) * Math.cos(2 * Math.PI * seededRandom(gx + 7919, gy + 6037, 22)) * strength
        const noiseB = Math.sqrt(-2 * Math.log(Math.max(0.0001, seededRandom(gx, gy, 31)))) * Math.cos(2 * Math.PI * seededRandom(gx + 7919, gy + 6037, 32)) * strength
        lutR[off] = lut0[off] + (noiseR - lut0[off]) * colorVariance
        lutG[off] = lut0[off] + (noiseG - lut0[off]) * colorVariance
        lutB[off] = lut0[off] + (noiseB - lut0[off]) * colorVariance
      }
    }
  }

  for (let y = 0; y < height; y++) {
    const gy = (y / gs) | 0
    const rowOff = gy * gw
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const off = rowOff + ((x / gs) | 0)
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
      const sf = lum < 128 ? 1 + shadowBoost * (1 - lum / 128) : 1
      const hf = lum > 200 ? 1 - highlightReduction * ((lum - 200) / 55) : 1
      const lumF = sf * hf
      const base = lut0[off] * lumF
      const rn = data[idx]     + (lutR ? lutR[off] * lumF : base)
      const gn = data[idx + 1] + (lutG ? lutG[off] * lumF : base)
      const bn = data[idx + 2] + (lutB ? lutB[off] * lumF : base)
      data[idx]     = rn < 0 ? 0 : rn > 255 ? 255 : (rn + 0.5) | 0
      data[idx + 1] = gn < 0 ? 0 : gn > 255 ? 255 : (gn + 0.5) | 0
      data[idx + 2] = bn < 0 ? 0 : bn > 255 ? 255 : (bn + 0.5) | 0
    }
  }
}

// ---- vignette ----
function applyVignette(data: Uint8ClampedArray, width: number, height: number, params: VignetteParams): void {
  if (params.intensity <= 0) return
  const cx = width / 2; const cy = height / 2
  const strength = params.intensity / 100
  const invRadius = 1 / params.radius
  const exponent = Math.max(0.5, 5 - (params.feather ?? 50) * 0.045)
  const vigColorVal = ((params.color ?? 0) / 100) * 255

  for (let y = 0; y < height; y++) {
    const dy = (y - cy) / cy; const dy2 = dy * dy
    for (let x = 0; x < width; x++) {
      const dx = (x - cx) / cx
      const dist = Math.sqrt(dx * dx + dy2)
      const normalized = dist * invRadius
      const vignette = 1 - strength * Math.pow(Math.max(0, normalized), exponent)
      const factor = vignette > 0 ? vignette : 0
      const idx = (y * width + x) * 4
      data[idx]     = (data[idx]     * factor + vigColorVal * (1 - factor) + 0.5) | 0
      data[idx + 1] = (data[idx + 1] * factor + vigColorVal * (1 - factor) + 0.5) | 0
      data[idx + 2] = (data[idx + 2] * factor + vigColorVal * (1 - factor) + 0.5) | 0
    }
  }
}

// ---- light leak ----
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
    const dy = y - oy!; const dy2 = dy * dy
    for (let x = 0; x < width; x++) {
      const dx = x - ox!
      const dist = Math.sqrt(dx * dx + dy2) * invMaxDist
      const leakStrength = (1 - dist * 1.8) * strength
      if (leakStrength <= 0) continue
      const idx = (y * width + x) * 4
      const r = data[idx]; const g = data[idx + 1]; const b = data[idx + 2]
      data[idx]     = Math.min(255, (r + color.r * (1 - r * inv255) * leakStrength + 0.5) | 0)
      data[idx + 1] = Math.min(255, (g + color.g * (1 - g * inv255) * leakStrength + 0.5) | 0)
      data[idx + 2] = Math.min(255, (b + color.b * (1 - b * inv255) * leakStrength + 0.5) | 0)
    }
  }
}

// ---- worker message handler ----
self.onmessage = (e: MessageEvent) => {
  const { buffer, width, height, params, pixelScale = 1 } = e.data as {
    buffer: ArrayBuffer
    width: number
    height: number
    params: FilterParams
    pixelScale?: number
  }

  const data = new Uint8ClampedArray(buffer)
  const len = data.length

  applyToneCurve(data, len, params.toneCurve)
  applyColorGrade(data, len, params.colorGrade)
  applyFade(data, len, params.fade)
  applyHalation(data, width, height, params.halation, pixelScale)
  applyBloom(data, width, height, params.bloom, pixelScale)
  applyGrain(data, width, height, params.grain, pixelScale)
  applyVignette(data, width, height, params.vignette)
  applyLightLeak(data, width, height, params.lightLeak)


  // Transfer buffer back (zero-copy)
  self.postMessage({ buffer: data.buffer, width, height }, [data.buffer] as any)
}
