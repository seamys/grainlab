<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '../stores/editor'
import { exportImage } from '../filters/pipeline'
import { downloadBlob } from '../utils/fileApi'

const emit = defineEmits<{ close: [] }>()
const store = useEditorStore()

const format = ref<'jpeg' | 'png'>('jpeg')
const quality = ref(92)
const exporting = ref(false)

async function doExport() {
  if (!store.originalBase64) return

  exporting.value = true
  try {
    const data = await exportImage(store.originalBase64, store.params, format.value, quality.value)

    const ext = format.value === 'jpeg' ? 'jpg' : 'png'
    const baseName = store.fileName.replace(/\.[^.]+$/, '')
    const defaultName = `${baseName}_film.${ext}`
    const mimeType = format.value === 'jpeg' ? 'image/jpeg' : 'image/png'

    downloadBlob(new Blob([data.buffer as ArrayBuffer], { type: mimeType }), defaultName)
    emit('close')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <div class="modal-title">{{ $t('export.title') }}</div>

      <div class="modal-row">
        <label class="modal-label">{{ $t('export.format') }}</label>
        <select v-model="format" class="control-select">
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
        </select>
      </div>

      <div v-if="format === 'jpeg'" class="modal-row">
        <div class="control-header">
          <label class="modal-label" style="margin-bottom: 0">{{ $t('export.jpegQuality') }}</label>
          <span class="control-value">{{ quality }}%</span>
        </div>
        <input type="range" min="1" max="100" step="1" v-model.number="quality" />
      </div>

      <div class="modal-actions">
        <button class="btn" @click="emit('close')">{{ $t('export.cancel') }}</button>
        <button class="btn btn-primary" :disabled="exporting" @click="doExport">
          {{ exporting ? $t('export.exporting') : $t('export.exportBtn') }}
        </button>
      </div>
    </div>
  </div>
</template>
