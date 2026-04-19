<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface RGBOffset { r: number; g: number; b: number }

const props = defineProps<{
  modelValue: RGBOffset
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RGBOffset]
}>()

// Canvas dimensions
const RADIUS = 43
const SIZE   = RADIUS * 2 + 2   // 88px

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isDragging = ref(false)

// ── Color math ──────────────────────────────────────────────
function hsvToRgb(hDeg: number, s: number, v: number): [number, number, number] {
  const c = v * s
  const x = c * (1 - Math.abs((hDeg / 60) % 2 - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if      (hDeg < 60)  { r = c; g = x; b = 0 }
  else if (hDeg < 120) { r = x; g = c; b = 0 }
  else if (hDeg < 180) { r = 0; g = c; b = x }
  else if (hDeg < 240) { r = 0; g = x; b = c }
  else if (hDeg < 300) { r = x; g = 0; b = c }
  else                 { r = c; g = 0; b = x }
  return [r + m, g + m, b + m]
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  const s = max === 0 ? 0 : d / max
  const v = max
  let h = 0
  if (d !== 0) {
    if      (max === r) h = ((g - b) / d + 6) % 6
    else if (max === g) h = (b - r) / d + 2
    else                h = (r - g) / d + 4
    h *= 60
  }
  return [h, s, v]
}

// ── Draw wheel ───────────────────────────────────────────────
function drawWheel() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const cx = RADIUS + 1
  const cy = RADIUS + 1
  const img = ctx.createImageData(SIZE, SIZE)

  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const dx = px - cx
      const dy = py - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > RADIUS) continue
      const hDeg = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360
      const sat  = dist / RADIUS
      const [r, g, b] = hsvToRgb(hDeg, sat, 1)
      const idx = (py * SIZE + px) * 4
      img.data[idx]     = Math.round(r * 255)
      img.data[idx + 1] = Math.round(g * 255)
      img.data[idx + 2] = Math.round(b * 255)
      img.data[idx + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
}

onMounted(drawWheel)

// ── Puck position from modelValue ────────────────────────────
const puck = computed(() => {
  const { r, g, b } = props.modelValue
  // Map offsets (-50..50) back to normalized 0..1 color (center 0.5 = neutral)
  const rn = r / 100 + 0.5
  const gn = g / 100 + 0.5
  const bn = b / 100 + 0.5
  const [hDeg, s] = rgbToHsv(rn, gn, bn)
  // s from rgbToHsv peaks at 0.5 for pure channel (+/-50 offset), scale × 2
  const sDisk = Math.min(1, s * 2)
  const angle = hDeg * Math.PI / 180
  const cx = RADIUS + 1
  const cy = RADIUS + 1
  return {
    x: cx + sDisk * RADIUS * Math.cos(angle),
    y: cy + sDisk * RADIUS * Math.sin(angle),
  }
})

// ── Hit → offset ─────────────────────────────────────────────
function posToOffset(px: number, py: number): RGBOffset {
  const cx = RADIUS + 1
  const cy = RADIUS + 1
  const dx = px - cx
  const dy = py - cy
  const dist = Math.min(Math.sqrt(dx * dx + dy * dy), RADIUS)
  const hDeg = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360
  const sDisk = dist / RADIUS
  const [br, bg, bb] = hsvToRgb(hDeg, 1, 1)
  const clamp50 = (n: number) => Math.round(Math.max(-50, Math.min(50, n)))
  return {
    r: clamp50(sDisk * (br - 0.5) * 100),
    g: clamp50(sDisk * (bg - 0.5) * 100),
    b: clamp50(sDisk * (bb - 0.5) * 100),
  }
}

function getCanvasPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  const scaleX = SIZE / rect.width
  const scaleY = SIZE / rect.height
  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top)  * scaleY,
  }
}

// ── Event handlers ────────────────────────────────────────────
function onMousedown(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  isDragging.value = true
  emit('update:modelValue', posToOffset(...Object.values(getCanvasPos(e)) as [number, number]))
}

function onMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value || !canvasRef.value) return
  emit('update:modelValue', posToOffset(...Object.values(getCanvasPos(e)) as [number, number]))
}

function onUp() { isDragging.value = false }

function onDblClick() { emit('update:modelValue', { r: 0, g: 0, b: 0 }) }

onMounted(() => {
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
  window.addEventListener('touchmove', onMove, { passive: false })
  window.addEventListener('touchend', onUp)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onUp)
  window.removeEventListener('touchmove', onMove)
  window.removeEventListener('touchend', onUp)
})

const hasColor = computed(() =>
  props.modelValue.r !== 0 || props.modelValue.g !== 0 || props.modelValue.b !== 0,
)
</script>

<template>
  <div class="cw-wrap">
    <div class="cw-label">{{ label }}</div>

    <div class="cw-container">
      <canvas
        ref="canvasRef"
        :width="SIZE"
        :height="SIZE"
        class="cw-canvas"
        @mousedown.prevent="onMousedown"
        @touchstart.prevent="onMousedown"
        @dblclick="onDblClick"
      />
      <!-- Puck + ring overlay -->
      <svg class="cw-overlay" :viewBox="`0 0 ${SIZE} ${SIZE}`">
        <!-- outer ring -->
        <circle
          :cx="RADIUS + 1"
          :cy="RADIUS + 1"
          :r="RADIUS"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          stroke-width="1"
        />
        <!-- puck outer -->
        <circle
          :cx="puck.x"
          :cy="puck.y"
          r="5"
          fill="none"
          stroke="white"
          stroke-width="1.5"
          pointer-events="none"
        />
        <!-- puck inner shadow -->
        <circle
          :cx="puck.x"
          :cy="puck.y"
          r="4"
          fill="none"
          stroke="rgba(0,0,0,0.45)"
          stroke-width="1"
          pointer-events="none"
        />
      </svg>
    </div>

    <!-- Active dot indicator -->
    <div class="cw-dot" :class="{ active: hasColor }" />
  </div>
</template>

<style scoped>
.cw-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  flex: 1;
}

.cw-label {
  font-size: 9.5px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  text-align: center;
}

.cw-container {
  position: relative;
  width: 80px;
  height: 80px;
  cursor: crosshair;
  border-radius: 50%;
}

.cw-canvas {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
}

.cw-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.cw-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--border-light);
  transition: background var(--transition);
}

.cw-dot.active {
  background: var(--accent);
}
</style>
