import type { ToneCurveParams } from './types'

/**
 * Build a 256-element LUT from 5 anchor points:
 * (0,0) → (64, 64+shadows) → (128, 128+midtones) → (192, 192+highlights) → (255,255)
 * Linear interpolation between anchors.
 */
function buildLUT(params: ToneCurveParams): Uint8Array {
  const lut = new Uint8Array(256)
  const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v))

  const points: [number, number][] = [
    [0, 0],
    [64, clamp(64 + params.shadows)],
    [128, clamp(128 + params.midtones)],
    [192, clamp(192 + params.highlights)],
    [255, 255],
  ]

  for (let i = 0; i < 256; i++) {
    let j = 0
    while (j < points.length - 2 && points[j + 1][0] <= i) j++
    const [x0, y0] = points[j]
    const [x1, y1] = points[j + 1]
    const t = (i - x0) / (x1 - x0)
    lut[i] = clamp(y0 + (y1 - y0) * t)
  }

  return lut
}

export function applyToneCurve(imageData: ImageData, params: ToneCurveParams): void {
  if (params.shadows === 0 && params.midtones === 0 && params.highlights === 0) return

  const lut = buildLUT(params)
  const data = imageData.data
  const len = data.length

  for (let i = 0; i < len; i += 4) {
    data[i]     = lut[data[i]]
    data[i + 1] = lut[data[i + 1]]
    data[i + 2] = lut[data[i + 2]]
  }
}
