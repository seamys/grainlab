<script setup lang="ts">
import { ref, watch, reactive, onBeforeUnmount } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useGalleryStore } from '../stores/gallery'
import FilterWorker from '../filters/filter.worker?worker'

const store = useEditorStore()
const gallery = useGalleryStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const isDragOver = ref(false)

// ===== Zoom / Pan =====
const zoom = ref(1)
const pan = reactive({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = reactive({ x: 0, y: 0, panX: 0, panY: 0 })
const showZoomIndicator = ref(false)
let zoomHideTimer: ReturnType<typeof setTimeout> | null = null

function onWheel(e: WheelEvent) {
  if (!store.imageLoaded) return
  e.preventDefault()
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  // Mouse offset from container center
  const mx = e.clientX - rect.left - rect.width / 2
  const my = e.clientY - rect.top - rect.height / 2
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
  const newZoom = Math.max(0.1, Math.min(4, zoom.value * factor))
  const ratio = newZoom / zoom.value
  pan.x = mx * (1 - ratio) + pan.x * ratio
  pan.y = my * (1 - ratio) + pan.y * ratio
  zoom.value = newZoom
  showZoomHint()
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0 || isDragOver.value) return
  isDragging.value = true
  dragStart.x = e.clientX
  dragStart.y = e.clientY
  dragStart.panX = pan.x
  dragStart.panY = pan.y
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  pan.x = dragStart.panX + e.clientX - dragStart.x
  pan.y = dragStart.panY + e.clientY - dragStart.y
}

function onPointerUp() {
  isDragging.value = false
}

function onDblClick() {
  resetZoom()
}

function showZoomHint() {
  showZoomIndicator.value = true
  if (zoomHideTimer) clearTimeout(zoomHideTimer)
  zoomHideTimer = setTimeout(() => { showZoomIndicator.value = false }, 2000)
}

function resetZoom() {
  zoom.value = 1
  pan.x = 0
  pan.y = 0
  showZoomHint()
}

function zoomIn() {
  const newZoom = Math.min(4, zoom.value * 1.25)
  const ratio = newZoom / zoom.value
  pan.x = pan.x * ratio
  pan.y = pan.y * ratio
  zoom.value = newZoom
  showZoomHint()
}

function zoomOut() {
  const newZoom = Math.max(0.1, zoom.value / 1.25)
  const ratio = newZoom / zoom.value
  pan.x = pan.x * ratio
  pan.y = pan.y * ratio
  zoom.value = newZoom
  showZoomHint()
}

defineExpose({ resetZoom, zoomIn, zoomOut })

// ===== Render engine =====
const MAX_PREVIEW_WIDTH = 800
let originalImageData: ImageData | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let pendingRender = false

const worker = new FilterWorker()
worker.onmessage = (e: MessageEvent) => {
  const { buffer, width, height } = e.data
  if (!canvasRef.value) return
  const result = new ImageData(new Uint8ClampedArray(buffer), width, height)
  canvasRef.value.getContext('2d')!.putImageData(result, 0, 0)
  if (pendingRender) {
    pendingRender = false
    dispatchRender()
  } else {
    store.processing = false
  }
}

onBeforeUnmount(() => {
  worker.terminate()
  if (debounceTimer) clearTimeout(debounceTimer)
  if (zoomHideTimer) clearTimeout(zoomHideTimer)
})

watch(
  () => store.originalBase64,
  async (base64) => {
    if (!base64) return
    zoom.value = 1
    pan.x = 0
    pan.y = 0
    await loadImage(base64)
    dispatchRender()
  }
)

watch(
  () => store.params,
  () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => { dispatchRender() }, 30)
  },
  { deep: true }
)

async function loadImage(base64: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => {
      let w = img.width
      let h = img.height
      if (w > MAX_PREVIEW_WIDTH) {
        h = Math.round((h * MAX_PREVIEW_WIDTH) / w)
        w = MAX_PREVIEW_WIDTH
      }
      const canvas = canvasRef.value!
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      originalImageData = ctx.getImageData(0, 0, w, h)
      resolve()
    }
    img.src = base64
  })
}

function dispatchRender() {
  if (!originalImageData) return
  store.processing = true
  const copy = new Uint8ClampedArray(originalImageData.data)
  const params = JSON.parse(JSON.stringify(store.params))
  worker.postMessage(
    { buffer: copy.buffer, width: originalImageData.width, height: originalImageData.height, params },
    [copy.buffer]
  )
}

// ===== Drag and drop =====
function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'))
  if (files.length === 0) return
  gallery.addFiles(files)
}
</script>

<template>
  <div
    ref="containerRef"
    class="canvas-container"
    :class="{ 'drag-over': isDragOver, 'dragging': isDragging }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @wheel="onWheel"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @dblclick="onDblClick"
  >
    <div
      class="canvas-viewport"
      :style="{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }"
    >
      <canvas v-show="store.imageLoaded" ref="canvasRef" class="preview-canvas" />
    </div>
    <div v-if="!store.imageLoaded" class="placeholder">
      <div class="placeholder-icon">+</div>
      <p>{{ $t('canvas.dropHint') }}</p>
      <p class="placeholder-hint">{{ $t('canvas.openHint') }}</p>
    </div>
    <transition name="zoom-fade">
      <div v-if="showZoomIndicator && store.imageLoaded" class="zoom-indicator">
        {{ Math.round(zoom * 100) }}%
      </div>
    </transition>
  </div>
</template>
