<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useEditorStore } from '../stores/editor'
import { presets } from '../presets'
import { applyFilters } from '../filters/pipeline'

const store = useEditorStore()
const thumbnails = ref<Record<string, string>>({})

// Regenerate thumbnails when image changes
watch(
  () => store.originalBase64,
  async (base64) => {
    if (!base64) return
    await generateThumbnails(base64)
  }
)

onBeforeUnmount(() => {
  revokeThumbnails()
})

function revokeThumbnails() {
  for (const url of Object.values(thumbnails.value)) {
    URL.revokeObjectURL(url)
  }
}

async function generateThumbnails(base64: string) {
  revokeThumbnails()

  const img = await loadImg(base64)
  const thumbWidth = 120
  const thumbHeight = Math.round((img.height * thumbWidth) / img.width)

  const newThumbs: Record<string, string> = {}

  for (const preset of presets) {
    const offscreen = new OffscreenCanvas(thumbWidth, thumbHeight)
    const ctx = offscreen.getContext('2d')!
    ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight)
    const imageData = ctx.getImageData(0, 0, thumbWidth, thumbHeight)
    const processed = applyFilters(imageData, preset.params)
    ctx.putImageData(processed, 0, 0)

    const blob = await offscreen.convertToBlob({ type: 'image/jpeg', quality: 0.75 })
    newThumbs[preset.id] = URL.createObjectURL(blob)
  }

  thumbnails.value = newThumbs
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
</script>

<template>
  <div class="preset-section">
    <div class="preset-section-title">{{ $t('preset.title') }}</div>
    <div class="preset-list">
      <div
        v-for="preset in presets"
        :key="preset.id"
        class="preset-card"
        :class="{ active: store.currentPresetId === preset.id }"
        :title="$t(`preset.${preset.i18nKey}.desc`)"
        @click="store.applyPreset(preset.id)"
      >
        <img
          v-if="thumbnails[preset.id]"
          :src="thumbnails[preset.id]"
          class="preset-thumb"
          :alt="preset.name"
        />
        <div v-else class="preset-thumb" />
        <span class="preset-name">{{ $t(`preset.${preset.i18nKey}.name`) }}</span>
      </div>
    </div>
  </div>
</template>
