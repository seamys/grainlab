<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useEditorStore } from '../stores/editor'
import FilterWorker from '../filters/filter.worker?worker'

const store = useEditorStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isDragOver = ref(false)

const MAX_PREVIEW_WIDTH = 800
let originalImageData: ImageData | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let pendingRender = false

// Worker setup
const worker = new FilterWorker()
worker.onmessage = (e: MessageEvent) => {
  const { buffer, width, height } = e.data
  if (!canvasRef.value) return
  const result = new ImageData(new Uint8ClampedArray(buffer), width, height)
  canvasRef.value.getContext('2d')!.putImageData(result, 0, 0)

  // If another render was requested while we were busy, dispatch it
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
})

// Watch for image change
watch(
  () => store.originalBase64,
  async (base64) => {
    if (!base64) return
    await loadImage(base64)
    dispatchRender()
  }
)

// Watch for params change – debounced
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
  // Copy buffer to send to worker (transferable)
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

// Drag and drop
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
  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return
  const file = files[0]
  if (!file.type.startsWith('image/')) return

  const reader = new FileReader()
  reader.onload = () => {
    store.loadImage(reader.result as string, file.name, '')
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div
    class="canvas-container"
    :class="{ 'drag-over': isDragOver }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <canvas v-show="store.imageLoaded" ref="canvasRef" class="preview-canvas" />
    <div v-if="!store.imageLoaded" class="placeholder">
      <div class="placeholder-icon">+</div>
      <p>{{ $t('canvas.dropHint') }}</p>
      <p class="placeholder-hint">{{ $t('canvas.openHint') }}</p>
    </div>
  </div>
</template>
