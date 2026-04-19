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

  // Contrast: standard formula
  const c = params.contrast * 2.55
  const contrastFactor = (259 * (c + 255)) / (255 * (259 - c))

  for (let i = 0; i < len; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    // 1. Temperature (warm / cool)
    r = clamp(r + tempShift * 30)
    b = clamp(b - tempShift * 30)

    // 2. Tint
    g = clamp(g - tintShift * 20)

    // 3. Shadow / Highlight color shifts based on luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    const shadowWeight = lum < 128 ? 1 - lum / 128 : 0
    const highlightWeight = lum > 128 ? (lum - 128) / 127 : 0

    r = clamp(r + params.shadowR * shadowWeight + params.highlightR * highlightWeight)
    g = clamp(g + params.shadowG * shadowWeight + params.highlightG * highlightWeight)
    b = clamp(b + params.shadowB * shadowWeight + params.highlightB * highlightWeight)

    // 4. Saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    r = clamp(gray + satFactor * (r - gray))
    g = clamp(gray + satFactor * (g - gray))
    b = clamp(gray + satFactor * (b - gray))

    // 5. Contrast
    r = clamp(contrastFactor * (r - 128) + 128)
    g = clamp(contrastFactor * (g - 128) + 128)
    b = clamp(contrastFactor * (b - 128) + 128)

    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }
}
