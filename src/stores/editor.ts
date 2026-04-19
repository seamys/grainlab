import { defineStore } from 'pinia'
import { ref, reactive, watch } from 'vue'
import type { FilterParams } from '../filters/types'
import { presets, cloneParams } from '../presets'

const STORAGE_KEY = 'grainlab_params'
const PRESET_KEY = 'grainlab_preset'

function loadStoredParams(): FilterParams | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useEditorStore = defineStore('editor', () => {
  // Image state
  const originalBase64 = ref('')
  const fileName = ref('')
  const filePath = ref('')
  const imageLoaded = ref(false)

  // Filter params – restored from localStorage or initialized to first preset
  const storedPresetId = localStorage.getItem(PRESET_KEY) ?? presets[0].id
  const currentPresetId = ref(storedPresetId)
  const storedParams = loadStoredParams() ?? cloneParams(presets[0].params)
  const params = reactive<FilterParams>(storedParams)

  // UI state
  const showBeforeAfter = ref(false)
  const isExporting = ref(false)
  const processing = ref(false)

  // Persist params and presetId to localStorage on change
  watch(params, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  watch(currentPresetId, (val) => {
    localStorage.setItem(PRESET_KEY, val)
  })

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
