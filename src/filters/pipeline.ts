import type { FilterParams } from './types'
import { applyColorGrade } from './colorGrade'
import { applyGrain } from './grain'
import { applyVignette } from './vignette'
import { applyLightLeak } from './lightLeak'
import { applyFade } from './fade'
import { applyHalation } from './halation'
import { applyBloom } from './bloom'
import { applyToneCurve } from './toneCurve'

/**
 * Apply the full filter pipeline to a copy of the source ImageData.
 * Order: toneCurve → colorGrade → fade → halation → bloom → grain → vignette → lightLeak
 */
export function applyFilters(source: ImageData, params: FilterParams): ImageData {
  const result = new ImageData(
    new Uint8ClampedArray(source.data),
    source.width,
    source.height
  )

  applyToneCurve(result, params.toneCurve)
  applyColorGrade(result, params.colorGrade)
  applyFade(result, params.fade)
  applyHalation(result, params.halation)
  applyBloom(result, params.bloom)
  applyGrain(result, params.grain)
  applyVignette(result, params.vignette)
  applyLightLeak(result, params.lightLeak)

  return result
}

/**
 * Load an image from a base64 data URL.
 */
function loadImageFromBase64(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = base64
  })
}

/**
 * Export a full-resolution image with filters applied.
 * Used for single export and batch processing.
 */
export async function exportImage(
  base64: string,
  params: FilterParams,
  format: 'jpeg' | 'png',
  quality: number
): Promise<Uint8Array> {
  const img = await loadImageFromBase64(base64)
  const canvas = new OffscreenCanvas(img.width, img.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, img.width, img.height)
  const processed = applyFilters(imageData, params)
  ctx.putImageData(processed, 0, 0)

  const blob = await canvas.convertToBlob({
    type: `image/${format}`,
    quality: format === 'jpeg' ? quality / 100 : undefined,
  })

  const buffer = await blob.arrayBuffer()
  return new Uint8Array(buffer)
}
