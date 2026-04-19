import type { FilterParams, WatermarkParams } from './types'
import { applyColorGrade } from './colorGrade'
import { applyGrain } from './grain'
import { applyVignette } from './vignette'
import { applyLightLeak } from './lightLeak'
import { applyFade } from './fade'
import { applyHalation } from './halation'
import { applyBloom } from './bloom'
import { applyToneCurve } from './toneCurve'
import { drawWatermark } from './watermark'

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
 * Processing is offloaded to a Web Worker to avoid blocking the main thread.
 * Used for single export and batch processing.
 */
export async function exportImage(
  base64: string,
  params: FilterParams,
  format: 'jpeg' | 'png',
  quality: number,
  onProgress?: (pct: number) => void,
  watermarkParams?: WatermarkParams
): Promise<Uint8Array> {
  onProgress?.(5)
  const img = await loadImageFromBase64(base64)
  onProgress?.(15)

  const canvas = new OffscreenCanvas(img.width, img.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, img.width, img.height)
  onProgress?.(25)

  // Scale pixel-radius effects (grain, halation, bloom) to match the 800px preview reference
  const PREVIEW_MAX_WIDTH = 800
  const pixelScale = img.width / Math.min(img.width, PREVIEW_MAX_WIDTH)

  // Offload heavy filter work to a Web Worker (zero-copy transfer)
  const processedBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const worker = new Worker(new URL('./filter.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer }>) => {
      resolve(e.data.buffer)
      worker.terminate()
    }
    worker.onerror = (e) => {
      reject(new Error(e.message))
      worker.terminate()
    }
    worker.postMessage(
      { buffer: imageData.data.buffer, width: img.width, height: img.height, params: JSON.parse(JSON.stringify(params)), pixelScale },
      [imageData.data.buffer]
    )
  })
  onProgress?.(85)

  const processed = new ImageData(new Uint8ClampedArray(processedBuffer), img.width, img.height)
  ctx.putImageData(processed, 0, 0)

  if (watermarkParams?.enabled) {
    drawWatermark(ctx, img.width, img.height, watermarkParams)
  }
  onProgress?.(90)

  const blob = await canvas.convertToBlob({
    type: `image/${format}`,
    quality: format === 'jpeg' ? quality / 100 : undefined,
  })
  onProgress?.(100)

  const buffer = await blob.arrayBuffer()
  return new Uint8Array(buffer)
}
