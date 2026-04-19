<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '../stores/editor'

const { t } = useI18n()
const store = useEditorStore()

const sections = reactive({
  color: true,
  grain: true,
  vignette: true,
  lightLeak: true,
  fade: true,
  toneCurve: false,
  halation: false,
  bloom: false,
})

function toggle(key: keyof typeof sections) {
  sections[key] = !sections[key]
}

function formatValue(val: number, showSign = true): string {
  if (showSign && val > 0) return `+${val}`
  return String(val)
}

const leakColorOptions = computed(() => [
  { value: 'warm', label: t('control.colorWarm') },
  { value: 'cool', label: t('control.colorCool') },
  { value: 'vintage', label: t('control.colorVintage') },
])

const leakPositionOptions = computed(() => [
  { value: 'top-left', label: t('control.posTopLeft') },
  { value: 'top-right', label: t('control.posTopRight') },
  { value: 'bottom-left', label: t('control.posBottomLeft') },
  { value: 'bottom-right', label: t('control.posBottomRight') },
])

const halationColorOptions = computed(() => [
  { value: 'red',  label: t('control.colorRed') },
  { value: 'warm', label: t('control.colorWarm') },
  { value: 'gold', label: t('control.colorGold') },
])
</script>

<template>
  <!-- Color Grading -->
  <div class="control-section">
    <div class="section-header" @click="toggle('color')">
      <span class="section-title">{{ $t('control.colorGrade') }}</span>
      <span class="section-toggle" :class="{ open: sections.color }">▼</span>
    </div>
    <div v-show="sections.color" class="section-body">
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.temperature') }}</span>
          <span class="control-value">{{ formatValue(store.params.colorGrade.temperature) }}</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          step="1"
          :value="store.params.colorGrade.temperature"
          @input="store.params.colorGrade.temperature = +($event.target as HTMLInputElement).value"
        />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.tint') }}</span>
          <span class="control-value">{{ formatValue(store.params.colorGrade.tint) }}</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          step="1"
          :value="store.params.colorGrade.tint"
          @input="store.params.colorGrade.tint = +($event.target as HTMLInputElement).value"
        />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.saturation') }}</span>
          <span class="control-value">{{ formatValue(store.params.colorGrade.saturation) }}</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          step="1"
          :value="store.params.colorGrade.saturation"
          @input="store.params.colorGrade.saturation = +($event.target as HTMLInputElement).value"
        />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.contrast') }}</span>
          <span class="control-value">{{ formatValue(store.params.colorGrade.contrast) }}</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          step="1"
          :value="store.params.colorGrade.contrast"
          @input="store.params.colorGrade.contrast = +($event.target as HTMLInputElement).value"
        />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.exposure') }}</span>
          <span class="control-value">{{ formatValue(store.params.colorGrade.exposure) }}</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          step="1"
          :value="store.params.colorGrade.exposure"
          @input="store.params.colorGrade.exposure = +($event.target as HTMLInputElement).value"
        />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.highlights') }}</span>
          <span class="control-value">{{ formatValue(store.params.colorGrade.highlights) }}</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          step="1"
          :value="store.params.colorGrade.highlights"
          @input="store.params.colorGrade.highlights = +($event.target as HTMLInputElement).value"
        />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.shadows') }}</span>
          <span class="control-value">{{ formatValue(store.params.colorGrade.shadows) }}</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          step="1"
          :value="store.params.colorGrade.shadows"
          @input="store.params.colorGrade.shadows = +($event.target as HTMLInputElement).value"
        />
      </div>
    </div>
  </div>

  <!-- Grain -->
  <div class="control-section">
    <div class="section-header" @click="toggle('grain')">
      <span class="section-title">{{ $t('control.grain') }}</span>
      <span class="section-toggle" :class="{ open: sections.grain }">▼</span>
    </div>
    <div v-show="sections.grain" class="section-body">
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.grainIntensity') }}</span>
          <span class="control-value">{{ store.params.grain.intensity }}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="store.params.grain.intensity"
          @input="store.params.grain.intensity = +($event.target as HTMLInputElement).value"
        />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.grainSize') }}</span>
          <span class="control-value">{{ store.params.grain.size.toFixed(1) }}</span>
        </div>
        <input
          type="range"
          min="1"
          max="3"
          step="0.5"
          :value="store.params.grain.size"
          @input="store.params.grain.size = +($event.target as HTMLInputElement).value"
        />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.grainColorVariance') }}</span>
          <span class="control-value">{{ store.params.grain.colorVariance }}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="store.params.grain.colorVariance"
          @input="store.params.grain.colorVariance = +($event.target as HTMLInputElement).value"
        />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.grainShadowBoost') }}</span>
          <span class="control-value">{{ store.params.grain.shadowBoost }}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="store.params.grain.shadowBoost"
          @input="store.params.grain.shadowBoost = +($event.target as HTMLInputElement).value"
        />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.grainHighlightReduction') }}</span>
          <span class="control-value">{{ store.params.grain.highlightReduction }}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="store.params.grain.highlightReduction"
          @input="store.params.grain.highlightReduction = +($event.target as HTMLInputElement).value"
        />
      </div>
    </div>
  </div>

  <!-- Vignette -->
  <div class="control-section">
    <div class="section-header" @click="toggle('vignette')">
      <span class="section-title">{{ $t('control.vignette') }}</span>
      <span class="section-toggle" :class="{ open: sections.vignette }">▼</span>
    </div>
    <div v-show="sections.vignette" class="section-body">
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.vignetteIntensity') }}</span>
          <span class="control-value">{{ store.params.vignette.intensity }}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="store.params.vignette.intensity"
          @input="store.params.vignette.intensity = +($event.target as HTMLInputElement).value"
        />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.vignetteRadius') }}</span>
          <span class="control-value">{{ store.params.vignette.radius.toFixed(1) }}</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          :value="store.params.vignette.radius"
          @input="store.params.vignette.radius = +($event.target as HTMLInputElement).value"
        />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.vignetteFeather') }}</span>
          <span class="control-value">{{ store.params.vignette.feather }}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="store.params.vignette.feather"
          @input="store.params.vignette.feather = +($event.target as HTMLInputElement).value"
        />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.vignetteColor') }}</span>
          <span class="control-value">{{ store.params.vignette.color }}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="store.params.vignette.color"
          @input="store.params.vignette.color = +($event.target as HTMLInputElement).value"
        />
      </div>
    </div>
  </div>

  <!-- Light Leak -->
  <div class="control-section">
    <div class="section-header" @click="toggle('lightLeak')">
      <span class="section-title">{{ $t('control.lightLeak') }}</span>
      <span class="section-toggle" :class="{ open: sections.lightLeak }">▼</span>
    </div>
    <div v-show="sections.lightLeak" class="section-body">
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.lightLeakIntensity') }}</span>
          <span class="control-value">{{ store.params.lightLeak.intensity }}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="store.params.lightLeak.intensity"
          @input="store.params.lightLeak.intensity = +($event.target as HTMLInputElement).value"
        />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.lightLeakColor') }}</span>
        </div>
        <select
          class="control-select"
          :value="store.params.lightLeak.color"
          @change="store.params.lightLeak.color = ($event.target as HTMLSelectElement).value as any"
        >
          <option v-for="opt in leakColorOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.lightLeakPosition') }}</span>
        </div>
        <select
          class="control-select"
          :value="store.params.lightLeak.position"
          @change="store.params.lightLeak.position = ($event.target as HTMLSelectElement).value as any"
        >
          <option v-for="opt in leakPositionOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>
  </div>

  <!-- Fade -->
  <div class="control-section">
    <div class="section-header" @click="toggle('fade')">
      <span class="section-title">{{ $t('control.fade') }}</span>
      <span class="section-toggle" :class="{ open: sections.fade }">▼</span>
    </div>
    <div v-show="sections.fade" class="section-body">
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.fadeIntensity') }}</span>
          <span class="control-value">{{ store.params.fade.intensity }}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="store.params.fade.intensity"
          @input="store.params.fade.intensity = +($event.target as HTMLInputElement).value"
        />
      </div>
    </div>
  </div>

  <!-- Tone Curve -->
  <div class="control-section">
    <div class="section-header" @click="toggle('toneCurve')">
      <span class="section-title">{{ $t('control.toneCurve') }}</span>
      <span class="section-toggle" :class="{ open: sections.toneCurve }">▼</span>
    </div>
    <div v-show="sections.toneCurve" class="section-body">
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.toneCurveShadows') }}</span>
          <span class="control-value">{{ formatValue(store.params.toneCurve.shadows) }}</span>
        </div>
        <input type="range" min="-50" max="50" step="1"
          :value="store.params.toneCurve.shadows"
          @input="store.params.toneCurve.shadows = +($event.target as HTMLInputElement).value" />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.toneCurveMidtones') }}</span>
          <span class="control-value">{{ formatValue(store.params.toneCurve.midtones) }}</span>
        </div>
        <input type="range" min="-50" max="50" step="1"
          :value="store.params.toneCurve.midtones"
          @input="store.params.toneCurve.midtones = +($event.target as HTMLInputElement).value" />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.toneCurveHighlights') }}</span>
          <span class="control-value">{{ formatValue(store.params.toneCurve.highlights) }}</span>
        </div>
        <input type="range" min="-50" max="50" step="1"
          :value="store.params.toneCurve.highlights"
          @input="store.params.toneCurve.highlights = +($event.target as HTMLInputElement).value" />
      </div>
    </div>
  </div>

  <!-- Halation -->
  <div class="control-section">
    <div class="section-header" @click="toggle('halation')">
      <span class="section-title">{{ $t('control.halation') }}</span>
      <span class="section-toggle" :class="{ open: sections.halation }">▼</span>
    </div>
    <div v-show="sections.halation" class="section-body">
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.halationIntensity') }}</span>
          <span class="control-value">{{ store.params.halation.intensity }}</span>
        </div>
        <input type="range" min="0" max="100" step="1"
          :value="store.params.halation.intensity"
          @input="store.params.halation.intensity = +($event.target as HTMLInputElement).value" />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.halationRadius') }}</span>
          <span class="control-value">{{ store.params.halation.radius }}</span>
        </div>
        <input type="range" min="1" max="20" step="1"
          :value="store.params.halation.radius"
          @input="store.params.halation.radius = +($event.target as HTMLInputElement).value" />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.halationColor') }}</span>
        </div>
        <select class="control-select"
          :value="store.params.halation.color"
          @change="store.params.halation.color = ($event.target as HTMLSelectElement).value as any">
          <option v-for="opt in halationColorOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Bloom -->
  <div class="control-section">
    <div class="section-header" @click="toggle('bloom')">
      <span class="section-title">{{ $t('control.bloom') }}</span>
      <span class="section-toggle" :class="{ open: sections.bloom }">▼</span>
    </div>
    <div v-show="sections.bloom" class="section-body">
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.bloomIntensity') }}</span>
          <span class="control-value">{{ store.params.bloom.intensity }}</span>
        </div>
        <input type="range" min="0" max="100" step="1"
          :value="store.params.bloom.intensity"
          @input="store.params.bloom.intensity = +($event.target as HTMLInputElement).value" />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.bloomThreshold') }}</span>
          <span class="control-value">{{ store.params.bloom.threshold }}</span>
        </div>
        <input type="range" min="0" max="100" step="1"
          :value="store.params.bloom.threshold"
          @input="store.params.bloom.threshold = +($event.target as HTMLInputElement).value" />
      </div>
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.bloomRadius') }}</span>
          <span class="control-value">{{ store.params.bloom.radius }}</span>
        </div>
        <input type="range" min="1" max="20" step="1"
          :value="store.params.bloom.radius"
          @input="store.params.bloom.radius = +($event.target as HTMLInputElement).value" />
      </div>
    </div>
  </div>

  <!-- Reset -->
  <div class="reset-row">
    <button class="btn btn-sm btn-block" @click="store.resetToPreset()">{{ $t('control.resetToPreset') }}</button>
  </div>
</template>
