import type { WatermarkParams } from './types'

/**
 * Draw a text watermark onto a canvas context.
 * Call this after all pixel-level filters have been applied.
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  params: WatermarkParams
): void {
  if (!params.enabled || !params.text.trim()) return

  const shortSide = Math.min(width, height)
  // Font size: size param (10–100) maps to ~1%–8% of the short side
  const fontSize = Math.max(12, Math.round(shortSide * (params.size / 100) * 0.08))
  const lineHeight = Math.round(fontSize * 1.3)
  const padding = Math.round(shortSide * 0.02)

  const lines = params.text.split('\n')

  ctx.save()
  ctx.font = `${params.fontStyle} ${params.fontWeight} ${fontSize}px ${params.fontFamily}`
  ctx.globalAlpha = params.opacity / 100
  ctx.fillStyle = params.color === 'white' ? '#ffffff' : '#000000'
  ctx.shadowColor = params.color === 'white' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)'
  ctx.shadowBlur = Math.max(2, fontSize * 0.12)
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  let x: number
  let startY: number

  switch (params.position) {
    case 'top-left':
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      x = padding
      startY = padding
      break
    case 'top-right':
      ctx.textAlign = 'right'
      ctx.textBaseline = 'top'
      x = width - padding
      startY = padding
      break
    case 'bottom-left':
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      x = padding
      startY = height - padding - lines.length * lineHeight
      break
    case 'center':
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      x = width / 2
      startY = height / 2 - (lines.length * lineHeight) / 2
      break
    case 'bottom-right':
    default:
      ctx.textAlign = 'right'
      ctx.textBaseline = 'top'
      x = width - padding
      startY = height - padding - lines.length * lineHeight
      break
  }

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, startY + i * lineHeight)
  }

  ctx.restore()
}
