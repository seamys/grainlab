import type { ColorGradeParams } from './types'

function clamp(val: number): number {
  return val < 0 ? 0 : val > 255 ? 255 : (val + 0.5) | 0
}

export function applyColorGrade(imageData: ImageData, params: ColorGradeParams): void {
  const data = imageData.data
  const len = data.length

  const tempShift = params.temperature / 100
  const tintShift = params.tint / 100
  const satFactor = 1 + params.saturation / 100
  const c = params.contrast * 2.55
  const contrastFactor = (259 * (c + 255)) / (255 * (259 - c))
  // Exposure: ±2 EV range
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

    // 1. Exposure
    r = clamp(r * exposureFactor)
    g = clamp(g * exposureFactor)
    b = clamp(b * exposureFactor)

    // 2. Temperature
    r = clamp(r + tempShift * 30)
    b = clamp(b - tempShift * 30)

    // 3. Tint
    g = clamp(g - tintShift * 20)

    // 4. Shadow / Midtone / Highlight color shifts
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    const shadowWeight = lum < 128 ? 1 - lum / 128 : 0
    const highlightWeight = lum > 128 ? (lum - 128) / 127 : 0
    const midWeight = 1 - shadowWeight - highlightWeight

    r = clamp(r + params.shadowR * shadowWeight + params.highlightR * highlightWeight + midR * midWeight)
    g = clamp(g + params.shadowG * shadowWeight + params.highlightG * highlightWeight + midG * midWeight)
    b = clamp(b + params.shadowB * shadowWeight + params.highlightB * highlightWeight + midB * midWeight)

    // 5. Highlights / Shadows tonal range
    const lum2 = 0.299 * r + 0.587 * g + 0.114 * b
    if (highlightAdj !== 0 && lum2 > 128) {
      const adj = highlightAdj * ((lum2 - 128) / 127) * 50
      r = clamp(r + adj)
      g = clamp(g + adj)
      b = clamp(b + adj)
    }
    if (shadowAdj !== 0 && lum2 < 128) {
      const adj = shadowAdj * (1 - lum2 / 128) * 50
      r = clamp(r + adj)
      g = clamp(g + adj)
      b = clamp(b + adj)
    }

    // 6. Saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    r = clamp(gray + satFactor * (r - gray))
    g = clamp(gray + satFactor * (g - gray))
    b = clamp(gray + satFactor * (b - gray))

    // 7. Contrast
    r = clamp(contrastFactor * (r - 128) + 128)
    g = clamp(contrastFactor * (g - 128) + 128)
    b = clamp(contrastFactor * (b - 128) + 128)

    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }
}
