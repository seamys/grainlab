import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { FilterParams } from '../filters/types'
import { presets, cloneParams } from '../presets'

export const useEditorStore = defineStore('editor', () => {
  // Image state
  const originalBase64 = ref('')
  const fileName = ref('')
  const filePath = ref('')
  const imageLoaded = ref(false)

  // Filter params – initialized to first preset
  const currentPresetId = ref(presets[0].id)
  const params = reactive<FilterParams>(cloneParams(presets[0].params))

  // UI state
  const showBeforeAfter = ref(false)
  const isExporting = ref(false)
  const processing = ref(false)

  function loadImage(base64: string, name: string, path: string) {
    originalBase64.value = base64
    fileName.value = name
    filePath.value = path
    imageLoaded.value = true
    applyPreset(presets[0].id)
  }

  function applyPreset(presetId: string) {
    const preset = presets.find((p) => p.id === presetId)
    if (!preset) return
    currentPresetId.value = presetId
    const cloned = cloneParams(preset.params)
    Object.assign(params.colorGrade, cloned.colorGrade)
    Object.assign(params.grain, cloned.grain)
    Object.assign(params.vignette, cloned.vignette)
    Object.assign(params.lightLeak, cloned.lightLeak)
    Object.assign(params.fade, cloned.fade)
  }

  function resetToPreset() {
    applyPreset(currentPresetId.value)
  }

  function toggleBeforeAfter() {
    showBeforeAfter.value = !showBeforeAfter.value
  }

  return {
    originalBase64,
    fileName,
    filePath,
    imageLoaded,
    currentPresetId,
    params,
    showBeforeAfter,
    isExporting,
    processing,
    loadImage,
    applyPreset,
    resetToPreset,
    toggleBeforeAfter,
  }
})
