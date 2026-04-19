<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '../stores/editor'

const store = useEditorStore()

const svgRef = ref<SVGSVGElement | null>(null)

const VW = 256
const VH = 200

// ── Histogram ───────────────────────────────────────────────
const histogram = ref<number[]>(new Array(256).fill(0))

async function computeHistogram(base64: string) {
  if (!base64) {
    histogram.value = new Array(256).fill(0)
    return
  }
  const img = new Image()
  img.src = base64
  await new Promise<void>(res => { img.onload = () => res() })

  const canvas = document.createElement('canvas')
  const scale = Math.min(1, 200 / Math.max(img.width, img.height))
  canvas.width  = Math.round(img.width  * scale)
  canvas.height = Math.round(img.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const bins = new Array(256).fill(0)
  for (let i = 0; i < data.length; i += 4) {
    bins[Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])]++
  }
  const maxBin = Math.max(...bins, 1)
  histogram.value = bins.map(v => v / maxBin)
}

watch(() => store.originalBase64, computeHistogram, { immediate: true })

const histogramPath = computed(() => {
  const h = histogram.value
  let d = `M 0 ${VH}`
  for (let i = 0; i < 256; i++) {
    d += ` L ${i} ${VH - h[i] * (VH - 4)}`
  }
  return d + ` L 255 ${VH} Z`
})

// ── Anchors ─────────────────────────────────────────────────
function anchorSvgY(xInput: number, value: number): number {
  return (255 - (xInput + value)) / 255 * VH
}

const anchors = computed(() => [
  { x: 64,  y: anchorSvgY(64,  store.params.toneCurve.shadows),    key: 'shadows'    as const },
  { x: 128, y: anchorSvgY(128, store.params.toneCurve.midtones),   key: 'midtones'   as const },
  { x: 192, y: anchorSvgY(192, store.params.toneCurve.highlights), key: 'highlights' as const },
])

// ── Bezier curve (Catmull-Rom-style control points) ──────────
const curvePath = computed(() => {
  const pts: [number, number][] = [
    [0,   VH],
    [anchors.value[0].x, anchors.value[0].y],
    [anchors.value[1].x, anchors.value[1].y],
    [anchors.value[2].x, anchors.value[2].y],
    [255, 0],
  ]

  // Catmull-Rom tangent helper → cubic bezier control point
  function ctrlPt(prev: [number, number], cur: [number, number], next: [number, number], tension = 0.4): [number, number] {
    return [
      cur[0] + tension * (next[0] - prev[0]) / 6,
      cur[1] + tension * (next[1] - prev[1]) / 6,
    ]
  }

  let d = `M ${pts[0][0]} ${pts[0][1].toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1 = ctrlPt(p0, p1, p2)
    const cp2r = ctrlPt(p3, p2, p1)  // reverse tangent
    d += ` C ${cp1[0].toFixed(2)} ${cp1[1].toFixed(2)}, ${cp2r[0].toFixed(2)} ${cp2r[1].toFixed(2)}, ${p2[0]} ${p2[1].toFixed(2)}`
  }
  return d
})

// ── Drag ─────────────────────────────────────────────────────
const dragging = ref<number | null>(null)

function startDrag(index: number, e: MouseEvent | TouchEvent) {
  e.preventDefault()
  e.stopPropagation()
  dragging.value = index
}

function onMove(e: MouseEvent | TouchEvent) {
  if (dragging.value === null || !svgRef.value) return
  const rect = svgRef.value.getBoundingClientRect()
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
  const svgY = ((clientY - rect.top) / rect.height) * VH
  const xInput = [64, 128, 192][dragging.value]
  const output = 255 - (svgY / VH) * 255
  const value = Math.round(Math.max(-50, Math.min(50, output - xInput)))
  store.params.toneCurve[anchors.value[dragging.value].key] = value
}

function stopDrag() {
  dragging.value = null
}

onMounted(() => {
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchmove', onMove, { passive: false })
  window.addEventListener('touchend', stopDrag)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchmove', onMove)
  window.removeEventListener('touchend', stopDrag)
})

function fmtVal(v: number) {
  return v > 0 ? `+${v}` : String(v)
}
</script>

<template>
  <div class="curve-editor">
    <svg
      ref="svgRef"
      :viewBox="`0 0 ${VW} ${VH}`"
      preserveAspectRatio="none"
      class="curve-svg"
    >
      <!-- Grid -->
      <line v-for="i in 3" :key="`vg${i}`" :x1="i * 64" y1="0" :x2="i * 64" :y2="VH" class="grid-line" />
      <line v-for="i in 3" :key="`hg${i}`" x1="0" :y1="i * (VH / 4)" :x2="VW" :y2="i * (VH / 4)" class="grid-line" />

      <!-- Histogram -->
      <path :d="histogramPath" class="histogram-fill" />

      <!-- Neutral diagonal -->
      <line x1="0" :y1="VH" x2="255" y2="0" class="diagonal-line" />

      <!-- Curve -->
      <path :d="curvePath" class="curve-path" />

      <!-- Anchor hit areas -->
      <circle
        v-for="(a, i) in anchors"
        :key="`hit${i}`"
        :cx="a.x"
        :cy="a.y"
        r="12"
        class="anchor-hit"
        @mousedown.prevent="startDrag(i, $event)"
        @touchstart.prevent="startDrag(i, $event)"
      />

      <!-- Anchor dots -->
      <circle
        v-for="(a, i) in anchors"
        :key="`dot${i}`"
        :cx="a.x"
        :cy="a.y"
        r="4.5"
        class="anchor-dot"
        :class="{ active: dragging === i }"
        @mousedown.prevent="startDrag(i, $event)"
        @touchstart.prevent="startDrag(i, $event)"
      />
    </svg>

    <!-- Labels & values -->
    <div class="curve-footer">
      <div v-for="(a, i) in anchors" :key="i" class="curve-stat">
        <span class="curve-stat-label">{{ ['S', 'M', 'H'][i] }}</span>
        <span class="curve-stat-val" :class="{ nonzero: store.params.toneCurve[a.key] !== 0 }">
          {{ fmtVal(store.params.toneCurve[a.key]) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.curve-editor {
  padding: 2px 0 4px;
}

.curve-svg {
  width: 100%;
  height: 150px;
  display: block;
  cursor: crosshair;
  border-radius: var(--radius);
  background: var(--bg-primary);
  border: 1px solid var(--border);
}

.grid-line {
  stroke: var(--border);
  stroke-width: 0.6;
  vector-effect: non-scaling-stroke;
}

.histogram-fill {
  fill: var(--text-muted);
  opacity: 0.18;
}

.diagonal-line {
  stroke: var(--border-light);
  stroke-width: 0.8;
  stroke-dasharray: 4 4;
  vector-effect: non-scaling-stroke;
}

.curve-path {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.6;
  vector-effect: non-scaling-stroke;
}

.anchor-hit {
  fill: transparent;
  cursor: grab;
}
.anchor-hit:active {
  cursor: grabbing;
}

.anchor-dot {
  fill: var(--bg-secondary);
  stroke: var(--accent);
  stroke-width: 1.5;
  cursor: grab;
  vector-effect: non-scaling-stroke;
  transition: fill 80ms ease;
  pointer-events: none;
}
.anchor-dot.active {
  fill: var(--accent);
  cursor: grabbing;
}

.curve-footer {
  display: flex;
  justify-content: space-around;
  margin-top: 5px;
}

.curve-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 40px;
}

.curve-stat-label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.curve-stat-val {
  font-size: 10.5px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.curve-stat-val.nonzero {
  color: var(--accent);
}
</style>
