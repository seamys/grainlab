<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useEditorStore } from '../stores/editor'
import FilterWorker from '../filters/filter.worker?worker'

const store = useEditorStore()
const containerRef = ref<HTMLDivElement | null>(null)
const beforeCanvas = ref<HTMLCanvasElement | null>(null)
const afterCanvas = ref<HTMLCanvasElement | null>(null)
const position = ref(50)

let originalImageData: ImageData | null = null
let isDragging = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let pendingRender = false

// Worker setup
const worker = new FilterWorker()
worker.onmessage = (e: MessageEvent) => {
  const { buffer, width, height } = e.data
  if (!afterCanvas.value) return
  const result = new ImageData(new Uint8ClampedArray(buffer), width, height)
  afterCanvas.value.getContext('2d')!.putImageData(result, 0, 0)

  if (pendingRender) {
    pendingRender = false
    dispatchRender()
  } else {
    store.processing = false
  }
}

watch(
  () => store.originalBase64,
  async (base64) => {
    if (!base64) return
    await loadAndRender(base64)
  },
  { immediate: true }
)

watch(
  () => store.params,
  () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      dispatchRender()
    }, 30)
  },
  { deep: true }
)

onBeforeUnmount(() => {
  worker.terminate()
  if (debounceTimer) clearTimeout(debounceTimer)
})

async function loadAndRender(base64: string) {
  const img = await loadImg(base64)

  let w = img.width
  let h = img.height
  const MAX = 800
  if (w > MAX || h > MAX) {
    const scale = Math.min(MAX / w, MAX / h)
    w = Math.round(w * scale)
    h = Math.round(h * scale)
  }

  const bc = beforeCanvas.value!
  const ac = afterCanvas.value!
  bc.width = w
  bc.height = h
  ac.width = w
  ac.height = h

  const ctx = bc.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  originalImageData = ctx.getImageData(0, 0, w, h)

  dispatchRender()
}

function dispatchRender() {
  if (!originalImageData) return
  store.processing = true
  const copy = new Uint8ClampedArray(originalImageData.data)
  const params = JSON.parse(JSON.stringify(store.params))
  worker.postMessage(
    {
      buffer: copy.buffer,
      width: originalImageData.width,
      height: originalImageData.height,
      params,
    },
    [copy.buffer]
  )
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function onPointerDown(e: PointerEvent) {
  isDragging = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  updatePosition(e)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging) return
  updatePosition(e)
}

function onPointerUp(e: PointerEvent) {
  isDragging = false
  ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
}

function updatePosition(e: PointerEvent) {
  const wrap = containerRef.value?.querySelector('.ba-canvas-wrap') as HTMLElement | null
  if (!wrap) return
  const rect = wrap.getBoundingClientRect()
  const pct = ((e.clientX - rect.left) / rect.width) * 100
  position.value = Math.max(0, Math.min(100, pct))
}
</script>

<template>
  <div
    ref="containerRef"
    class="before-after"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div class="ba-canvas-wrap">
      <!-- Before (original) – full canvas visible -->
      <canvas ref="beforeCanvas" class="ba-canvas" />

      <!-- After (processed) – clipped to right portion -->
      <div
        class="ba-after-wrap"
        :style="{ clipPath: `inset(0 0 0 ${position}%)` }"
      >
        <canvas ref="afterCanvas" class="ba-canvas" />
      </div>

      <!-- Divider line -->
      <div class="ba-divider" :style="{ left: position + '%' }">
        <div class="ba-handle" />
      </div>

      <div class="ba-label ba-label-before">{{ $t('compare.before') }}</div>
      <div class="ba-label ba-label-after">{{ $t('compare.after') }}</div>
    </div>
  </div>
</template>
