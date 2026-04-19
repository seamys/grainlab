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

  <!-- Reset -->
  <div class="reset-row">
    <button class="btn btn-sm btn-block" @click="store.resetToPreset()">{{ $t('control.resetToPreset') }}</button>
  </div>
</template>
