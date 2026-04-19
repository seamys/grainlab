import { defineStore } from 'pinia'
import { ref, reactive, watch } from 'vue'
import type { FilterParams, WatermarkParams } from '../filters/types'
import { presets, cloneParams } from '../presets'

const STORAGE_KEY = 'grainlab_params'
const PRESET_KEY = 'grainlab_preset'
const WATERMARK_KEY = 'grainlab_watermark'

const DEFAULT_WATERMARK: WatermarkParams = {
  enabled: false,
  text: '© GrainLab',
  position: 'bottom-right',
  opacity: 70,
  size: 30,
  color: 'white',
  fontWeight: 'bold',
  fontStyle: 'normal',
  fontFamily: 'sans-serif',
}

function loadStoredWatermark(): WatermarkParams {
  try {
    const raw = localStorage.getItem(WATERMARK_KEY)
    if (!raw) return { ...DEFAULT_WATERMARK }
    return { ...DEFAULT_WATERMARK, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_WATERMARK }
  }
}

/** Deep-merge stored params with current defaults so new fields always exist */
function mergeParams(stored: Partial<FilterParams>, defaults: FilterParams): FilterParams {
  return {
    colorGrade: { ...defaults.colorGrade, ...stored.colorGrade },
    grain:      { ...defaults.grain,      ...stored.grain },
    vignette:   { ...defaults.vignette,   ...stored.vignette },
    lightLeak:  { ...defaults.lightLeak,  ...stored.lightLeak },
    fade:       { ...defaults.fade,       ...stored.fade },
    halation:   { ...defaults.halation,   ...stored.halation },
    bloom:      { ...defaults.bloom,      ...stored.bloom },
    toneCurve:  { ...defaults.toneCurve,  ...stored.toneCurve },
  }
}

function loadStoredParams(defaults: FilterParams): FilterParams {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneParams(defaults)
    return mergeParams(JSON.parse(raw), defaults)
  } catch {
    return cloneParams(defaults)
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
  const params = reactive<FilterParams>(loadStoredParams(cloneParams(presets[0].params)))

  // Watermark state – persisted separately so presets never overwrite it
  const watermark = reactive<WatermarkParams>(loadStoredWatermark())
  watch(watermark, (val) => {
    localStorage.setItem(WATERMARK_KEY, JSON.stringify(val))
  }, { deep: true })

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

  function loadImageWithParams(base64: string, name: string, newParams: FilterParams, newPresetId: string) {
    originalBase64.value = base64
    fileName.value = name
    filePath.value = ''
    imageLoaded.value = true
    currentPresetId.value = newPresetId
    const cloned = cloneParams(newParams)
    Object.assign(params.colorGrade, cloned.colorGrade)
    Object.assign(params.grain, cloned.grain)
    Object.assign(params.vignette, cloned.vignette)
    Object.assign(params.lightLeak, cloned.lightLeak)
    Object.assign(params.fade, cloned.fade)
    Object.assign(params.halation, cloned.halation)
    Object.assign(params.bloom, cloned.bloom)
    Object.assign(params.toneCurve, cloned.toneCurve)
  }

  function clearImage() {
    originalBase64.value = ''
    fileName.value = ''
    imageLoaded.value = false
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
    Object.assign(params.halation, cloned.halation)
    Object.assign(params.bloom, cloned.bloom)
    Object.assign(params.toneCurve, cloned.toneCurve)
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
    watermark,
    showBeforeAfter,
    isExporting,
    processing,
    loadImage,
    loadImageWithParams,
    clearImage,
    applyPreset,
    resetToPreset,
    toggleBeforeAfter,
  }
})
