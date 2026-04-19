<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '../stores/editor'

const { t } = useI18n()
import { presets } from '../presets'
import { exportImage } from '../filters/pipeline'
import { cloneParams } from '../presets'
import { pickMultipleImages, readFileAsBase64, downloadBlob } from '../utils/fileApi'
import JSZip from 'jszip'

const emit = defineEmits<{ close: [] }>()
const store = useEditorStore()

const imageFiles = ref<File[]>([])
const presetId = ref(store.currentPresetId)
const format = ref<'jpeg' | 'png'>('jpeg')
const quality = ref(92)
const processing = ref(false)
const progress = ref(0)
const cancelled = ref(false)

const total = computed(() => imageFiles.value.length)

async function selectImages() {
  const files = await pickMultipleImages()
  if (files.length > 0) {
    imageFiles.value = files
  }
}

async function startBatch() {
  if (imageFiles.value.length === 0) return

  processing.value = true
  progress.value = 0
  cancelled.value = false

  const preset = presets.find((p) => p.id === presetId.value)
  if (!preset) return
  const params = cloneParams(preset.params)
  const ext = format.value === 'jpeg' ? 'jpg' : 'png'
  const mimeType = format.value === 'jpeg' ? 'image/jpeg' : 'image/png'

  const zip = new JSZip()

  for (let i = 0; i < imageFiles.value.length; i++) {
    if (cancelled.value) break

    const file = imageFiles.value[i]
    const base64 = await readFileAsBase64(file)
    const data = await exportImage(base64, params, format.value, quality.value, undefined, store.watermark)

    const baseName = file.name.replace(/\.[^.]+$/, '')
    zip.file(`${baseName}_film.${ext}`, data, { binary: true })

    progress.value = i + 1
  }

  if (!cancelled.value) {
    const zipBlob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip' })
    downloadBlob(zipBlob, 'film_batch.zip')
  }

  processing.value = false
  if (!cancelled.value) {
    setTimeout(() => emit('close'), 800)
  }
}

function cancelBatch() {
  cancelled.value = true
}
</script>

<template>
  <div class="modal-overlay" @click.self="!processing && emit('close')">
    <div class="modal-content">
      <div class="modal-title">{{ t('batch.title') }}</div>

      <!-- Select images -->
      <div class="modal-row">
        <label class="modal-label">{{ t('batch.selectImages') }}</label>
        <button class="btn btn-block btn-sm" @click="selectImages" :disabled="processing">
          {{ total > 0 ? t('batch.selectedCount', { count: total }) : t('batch.selectHint') }}
        </button>
      </div>

      <!-- Preset selection -->
      <div class="modal-row">
        <label class="modal-label">{{ t('batch.applyPreset') }}</label>
        <select v-model="presetId" class="control-select" :disabled="processing">
          <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>

      <!-- Format -->
      <div class="modal-row">
        <label class="modal-label">{{ t('batch.format') }}</label>
        <select v-model="format" class="control-select" :disabled="processing">
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
        </select>
      </div>

      <div v-if="format === 'jpeg'" class="modal-row">
        <div class="control-header">
          <label class="modal-label" style="margin-bottom: 0">{{ t('batch.jpegQuality') }}</label>
          <span class="control-value">{{ quality }}%</span>
        </div>
        <input type="range" min="1" max="100" step="1" v-model.number="quality" :disabled="processing" />
      </div>

      <div class="modal-row" style="font-size: 11px; color: var(--text-muted)">
        {{ t('batch.zipHint') }}
      </div>

      <!-- Progress -->
      <div v-if="processing" class="modal-row">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${(progress / total) * 100}%` }" />
        </div>
        <div class="progress-text">{{ progress }} / {{ total }}</div>
      </div>

      <div class="modal-actions">
        <button v-if="!processing" class="btn" @click="emit('close')">{{ t('batch.cancel') }}</button>
        <button v-if="processing" class="btn btn-danger" @click="cancelBatch">{{ t('batch.stop') }}</button>
        <button
          v-if="!processing"
          class="btn btn-primary"
          :disabled="total === 0"
          @click="startBatch"
        >
          {{ t('batch.start') }}
        </button>
        <span v-if="processing && cancelled" class="loading-text">{{ t('batch.stopping') }}</span>
        <span v-if="!processing && progress > 0 && !cancelled" class="loading-text" style="color: var(--success)">
          {{ t('batch.done') }}
        </span>
      </div>
    </div>
  </div>
</template>
