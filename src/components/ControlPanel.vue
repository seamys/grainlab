<script setup lang="ts">
import { reactive, computed, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '../stores/editor'
import ToneCurveEditor from './ToneCurveEditor.vue'
import ColorWheel from './ColorWheel.vue'

const { t } = useI18n()
const store = useEditorStore()

// ── Simple / Advanced mode ───────────────────────────────────
const advancedMode = ref(false)

onMounted(() => {
  advancedMode.value = localStorage.getItem('grainlab_advanced') === 'true'
})
watch(advancedMode, v => localStorage.setItem('grainlab_advanced', String(v)))

// ── Section collapse ─────────────────────────────────────────
const sections = reactive({
  color: true,
  grain: true,
  vignette: true,
  lightLeak: true,
  fade: true,
  toneCurve: true,
  halation: false,
  bloom: false,
  watermark: false,
})

function toggle(key: keyof typeof sections) {
  sections[key] = !sections[key]
}

function formatValue(val: number, showSign = true): string {
  if (showSign && val > 0) return `+${val}`
  return String(val)
}

// ── Select options ────────────────────────────────────────────
const leakColorOptions = computed(() => [
  { value: 'warm',    label: t('control.colorWarm') },
  { value: 'cool',    label: t('control.colorCool') },
  { value: 'vintage', label: t('control.colorVintage') },
])

const leakPositionOptions = computed(() => [
  { value: 'top-left',     label: t('control.posTopLeft') },
  { value: 'top-right',    label: t('control.posTopRight') },
  { value: 'bottom-left',  label: t('control.posBottomLeft') },
  { value: 'bottom-right', label: t('control.posBottomRight') },
])

const watermarkPositionOptions = computed(() => [
  { value: 'top-left',     label: t('control.posTopLeft') },
  { value: 'top-right',    label: t('control.posTopRight') },
  { value: 'bottom-left',  label: t('control.posBottomLeft') },
  { value: 'bottom-right', label: t('control.posBottomRight') },
  { value: 'center',       label: t('control.posCenter') },
])

const watermarkColorOptions = computed(() => [
  { value: 'white', label: t('control.colorWhite') },
  { value: 'black', label: t('control.colorBlack') },
])

const watermarkFontWeightOptions = computed(() => [
  { value: 'bold',   label: t('control.fontWeightBold') },
  { value: 'normal', label: t('control.fontWeightNormal') },
])

const watermarkFontStyleOptions = computed(() => [
  { value: 'normal', label: t('control.fontStyleNormal') },
  { value: 'italic', label: t('control.fontStyleItalic') },
])

const watermarkFontFamilyOptions = computed(() => [
  { value: 'sans-serif', label: t('control.fontFamilySans') },
  { value: 'serif',      label: t('control.fontFamilySerif') },
  { value: 'monospace',  label: t('control.fontFamilyMono') },
])

const halationColorOptions = computed(() => [
  { value: 'red',  label: t('control.colorRed') },
  { value: 'warm', label: t('control.colorWarm') },
  { value: 'gold', label: t('control.colorGold') },
])

// ── Color wheel v-models ──────────────────────────────────────
const shadowColor = computed({
  get: () => ({
    r: store.params.colorGrade.shadowR,
    g: store.params.colorGrade.shadowG,
    b: store.params.colorGrade.shadowB,
  }),
  set: (v) => {
    store.params.colorGrade.shadowR = v.r
    store.params.colorGrade.shadowG = v.g
    store.params.colorGrade.shadowB = v.b
  },
})

const midtoneColor = computed({
  get: () => ({
    r: store.params.colorGrade.midtoneR,
    g: store.params.colorGrade.midtoneG,
    b: store.params.colorGrade.midtoneB,
  }),
  set: (v) => {
    store.params.colorGrade.midtoneR = v.r
    store.params.colorGrade.midtoneG = v.g
    store.params.colorGrade.midtoneB = v.b
  },
})

const highlightColor = computed({
  get: () => ({
    r: store.params.colorGrade.highlightR,
    g: store.params.colorGrade.highlightG,
    b: store.params.colorGrade.highlightB,
  }),
  set: (v) => {
    store.params.colorGrade.highlightR = v.r
    store.params.colorGrade.highlightG = v.g
    store.params.colorGrade.highlightB = v.b
  },
})
</script>

<template>
  <!-- Mode toggle -->
  <div class="mode-toggle">
    <button
      class="mode-btn"
      :class="{ active: !advancedMode }"
      @click="advancedMode = false"
    >{{ $t('control.simpleMode') }}</button>
    <button
      class="mode-btn"
      :class="{ active: advancedMode }"
      @click="advancedMode = true"
    >{{ $t('control.advancedMode') }}</button>
  </div>

  <!-- Color Grading -->
  <div class="control-section">
    <div class="section-header" @click="toggle('color')">
      <span class="section-icon"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10"/><path d="M2 12h20"/></svg></span>
      <span class="section-title">{{ $t('control.colorGrade') }}</span>
      <span class="section-toggle" :class="{ open: sections.color }">▼</span>
    </div>
    <div v-show="sections.color" class="section-body">

      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.exposure') }}</span>
          <span class="control-value">{{ formatValue(store.params.colorGrade.exposure) }}</span>
        </div>
        <input
          type="range" min="-100" max="100" step="1"
          data-gradient="exposure"
          :value="store.params.colorGrade.exposure"
          @input="store.params.colorGrade.exposure = +($event.target as HTMLInputElement).value"
        />
      </div>

      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.temperature') }}</span>
          <span class="control-value">{{ formatValue(store.params.colorGrade.temperature) }}</span>
        </div>
        <input
          type="range" min="-100" max="100" step="1"
          data-gradient="temperature"
          :value="store.params.colorGrade.temperature"
          @input="store.params.colorGrade.temperature = +($event.target as HTMLInputElement).value"
        />
      </div>

      <div v-if="advancedMode" class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.tint') }}</span>
          <span class="control-value">{{ formatValue(store.params.colorGrade.tint) }}</span>
        </div>
        <input
          type="range" min="-100" max="100" step="1"
          data-gradient="tint"
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
          type="range" min="-100" max="100" step="1"
          data-gradient="saturation"
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
          type="range" min="-100" max="100" step="1"
          data-gradient="contrast"
          :value="store.params.colorGrade.contrast"
          @input="store.params.colorGrade.contrast = +($event.target as HTMLInputElement).value"
        />
      </div>

      <template v-if="advancedMode">
        <div class="control-row">
          <div class="control-header">
            <span class="control-label">{{ $t('control.highlights') }}</span>
            <span class="control-value">{{ formatValue(store.params.colorGrade.highlights) }}</span>
          </div>
          <input
            type="range" min="-100" max="100" step="1"
            data-gradient="highlights"
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
            type="range" min="-100" max="100" step="1"
            data-gradient="shadows"
            :value="store.params.colorGrade.shadows"
            @input="store.params.colorGrade.shadows = +($event.target as HTMLInputElement).value"
          />
        </div>

        <!-- Color Toning wheels -->
        <div class="subsection-header">{{ $t('control.colorToning') }}</div>
        <div class="wheels-row">
          <ColorWheel v-model="shadowColor"    :label="$t('control.toneCurveShadows')" />
          <ColorWheel v-model="midtoneColor"   :label="$t('control.toneCurveMidtones')" />
          <ColorWheel v-model="highlightColor" :label="$t('control.toneCurveHighlights')" />
        </div>
        <p class="wheels-hint">{{ $t('control.colorToningHint') }}</p>
      </template>
    </div>
  </div>

  <!-- Film Grain -->
  <div class="control-section">
    <div class="section-header" @click="toggle('grain')">
      <span class="section-icon"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="1.5"/><circle cx="16" cy="6" r="1"/><circle cx="5" cy="15" r="1"/><circle cx="13" cy="16" r="1.5"/><circle cx="19" cy="13" r="1"/><circle cx="10" cy="12" r="1"/><circle cx="18" cy="19" r="1"/><circle cx="7" cy="20" r="1.5"/></svg></span>
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
          type="range" min="0" max="100" step="1"
          :value="store.params.grain.intensity"
          @input="store.params.grain.intensity = +($event.target as HTMLInputElement).value"
        />
      </div>

      <template v-if="advancedMode">
        <div class="control-row">
          <div class="control-header">
            <span class="control-label">{{ $t('control.grainSize') }}</span>
            <span class="control-value">{{ store.params.grain.size.toFixed(1) }}</span>
          </div>
          <input
            type="range" min="1" max="3" step="0.5"
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
            type="range" min="0" max="100" step="1"
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
            type="range" min="0" max="100" step="1"
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
            type="range" min="0" max="100" step="1"
            :value="store.params.grain.highlightReduction"
            @input="store.params.grain.highlightReduction = +($event.target as HTMLInputElement).value"
          />
        </div>
      </template>
    </div>
  </div>

  <!-- Vignette -->
  <div class="control-section">
    <div class="section-header" @click="toggle('vignette')">
      <span class="section-icon"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg></span>
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
          type="range" min="0" max="100" step="1"
          :value="store.params.vignette.intensity"
          @input="store.params.vignette.intensity = +($event.target as HTMLInputElement).value"
        />
      </div>

      <template v-if="advancedMode">
        <div class="control-row">
          <div class="control-header">
            <span class="control-label">{{ $t('control.vignetteRadius') }}</span>
            <span class="control-value">{{ store.params.vignette.radius.toFixed(1) }}</span>
          </div>
          <input
            type="range" min="0.5" max="2.0" step="0.1"
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
            type="range" min="0" max="100" step="1"
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
            type="range" min="0" max="100" step="1"
            :value="store.params.vignette.color"
            @input="store.params.vignette.color = +($event.target as HTMLInputElement).value"
          />
        </div>
      </template>
    </div>
  </div>

  <!-- Fade -->
  <div class="control-section">
    <div class="section-header" @click="toggle('fade')">
      <span class="section-icon"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M2 12h20"/><path d="M12 2v20"/></svg></span>
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
          type="range" min="0" max="100" step="1"
          :value="store.params.fade.intensity"
          @input="store.params.fade.intensity = +($event.target as HTMLInputElement).value"
        />
      </div>
    </div>
  </div>

  <!-- Tone Curve (advanced only) -->
  <div v-if="advancedMode" class="control-section">
    <div class="section-header" @click="toggle('toneCurve')">
      <span class="section-icon"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20 C7 20 9 4 12 4 S17 20 21 20"/><line x1="3" y1="20" x2="21" y2="20"/><line x1="3" y1="4" x2="3" y2="20"/></svg></span>
      <span class="section-title">{{ $t('control.toneCurve') }}</span>
      <span class="section-toggle" :class="{ open: sections.toneCurve }">▼</span>
    </div>
    <div v-show="sections.toneCurve" class="section-body">
      <ToneCurveEditor />
    </div>
  </div>

  <!-- Light Leak (advanced only) -->
  <div v-if="advancedMode" class="control-section">
    <div class="section-header" @click="toggle('lightLeak')">
      <span class="section-icon"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg></span>
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
          type="range" min="0" max="100" step="1"
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
          <option v-for="opt in leakColorOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
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
          <option v-for="opt in leakPositionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Halation (advanced only) -->
  <div v-if="advancedMode" class="control-section">
    <div class="section-header" @click="toggle('halation')">
      <span class="section-icon"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7" stroke-dasharray="2 2"/><circle cx="12" cy="12" r="10" stroke-dasharray="1 3"/></svg></span>
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

  <!-- Bloom (advanced only) -->
  <div v-if="advancedMode" class="control-section">
    <div class="section-header" @click="toggle('bloom')">
      <span class="section-icon"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 0 1 0 18A9 9 0 0 1 12 3z"/><path d="M12 8a4 4 0 0 1 0 8 4 4 0 0 1 0-8z"/><line x1="12" y1="3" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="21"/><line x1="3" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="21" y2="12"/></svg></span>
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

  <!-- Watermark -->
  <div class="control-section">
    <div class="section-header" @click="toggle('watermark')">
      <span class="section-icon"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
      <span class="section-title">{{ $t('control.watermark') }}</span>
      <span class="section-toggle" :class="{ open: sections.watermark }">▼</span>
    </div>
    <div v-show="sections.watermark" class="section-body">
      <div class="control-row">
        <div class="control-header">
          <span class="control-label">{{ $t('control.watermarkEnabled') }}</span>
          <label class="toggle-switch">
            <input type="checkbox" v-model="store.watermark.enabled" />
            <span class="toggle-thumb" />
          </label>
        </div>
      </div>
      <template v-if="store.watermark.enabled">
        <div class="control-row">
          <div class="control-header">
            <span class="control-label">{{ $t('control.watermarkText') }}</span>
          </div>
          <textarea
            class="control-text-input"
            rows="2"
            :value="store.watermark.text"
            @input="store.watermark.text = ($event.target as HTMLTextAreaElement).value"
          />
        </div>
        <div class="control-row">
          <div class="control-header">
            <span class="control-label">{{ $t('control.watermarkPosition') }}</span>
          </div>
          <select
            class="control-select"
            :value="store.watermark.position"
            @change="store.watermark.position = ($event.target as HTMLSelectElement).value as any"
          >
            <option v-for="opt in watermarkPositionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="control-row">
          <div class="control-header">
            <span class="control-label">{{ $t('control.watermarkColor') }}</span>
          </div>
          <select
            class="control-select"
            :value="store.watermark.color"
            @change="store.watermark.color = ($event.target as HTMLSelectElement).value as any"
          >
            <option v-for="opt in watermarkColorOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="control-row">
          <div class="control-header">
            <span class="control-label">{{ $t('control.watermarkOpacity') }}</span>
            <span class="control-value">{{ store.watermark.opacity }}%</span>
          </div>
          <input
            type="range" min="10" max="100" step="1"
            :value="store.watermark.opacity"
            @input="store.watermark.opacity = +($event.target as HTMLInputElement).value"
          />
        </div>
        <div class="control-row">
          <div class="control-header">
            <span class="control-label">{{ $t('control.watermarkSize') }}</span>
            <span class="control-value">{{ store.watermark.size }}</span>
          </div>
          <input
            type="range" min="10" max="100" step="1"
            :value="store.watermark.size"
            @input="store.watermark.size = +($event.target as HTMLInputElement).value"
          />
        </div>
        <div class="control-row">
          <div class="control-header">
            <span class="control-label">{{ $t('control.watermarkFontWeight') }}</span>
          </div>
          <select
            class="control-select"
            :value="store.watermark.fontWeight"
            @change="store.watermark.fontWeight = ($event.target as HTMLSelectElement).value as any"
          >
            <option v-for="opt in watermarkFontWeightOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="control-row">
          <div class="control-header">
            <span class="control-label">{{ $t('control.watermarkFontStyle') }}</span>
          </div>
          <select
            class="control-select"
            :value="store.watermark.fontStyle"
            @change="store.watermark.fontStyle = ($event.target as HTMLSelectElement).value as any"
          >
            <option v-for="opt in watermarkFontStyleOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="control-row">
          <div class="control-header">
            <span class="control-label">{{ $t('control.watermarkFontFamily') }}</span>
          </div>
          <select
            class="control-select"
            :value="store.watermark.fontFamily"
            @change="store.watermark.fontFamily = ($event.target as HTMLSelectElement).value as any"
          >
            <option v-for="opt in watermarkFontFamilyOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
      </template>
    </div>
  </div>

  <!-- Reset -->
  <div class="reset-row">
    <button class="btn btn-sm btn-block" @click="store.resetToPreset()">{{ $t('control.resetToPreset') }}</button>
  </div>
</template>

<style scoped>
/* ── Mode toggle ───────────────────────────────────────────── */
.mode-toggle {
  display: flex;
  margin: 10px 12px 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.mode-btn {
  flex: 1;
  padding: 5px 0;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 11px;
  font-family: var(--font-family);
  font-weight: 450;
  cursor: pointer;
  transition: all var(--transition);
  letter-spacing: 0.03em;
}

.mode-btn:first-child {
  border-right: 1px solid var(--border);
}

.mode-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.mode-btn.active {
  background: var(--accent-dim);
  color: var(--accent);
  font-weight: 550;
}

/* ── Color toning subsection ────────────────────────────────── */
.subsection-header {
  font-size: 9.5px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 10px 0 8px;
}

.wheels-row {
  display: flex;
  gap: 4px;
  justify-content: space-between;
}

.wheels-hint {
  font-size: 9.5px;
  color: var(--text-muted);
  text-align: center;
  margin-top: 5px;
  letter-spacing: 0.01em;
}

/* ── Toggle switch ──────────────────────────────────────────── */
.toggle-switch {
  position: relative;
  display: inline-flex;
  width: 32px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.toggle-thumb {
  position: absolute;
  inset: 0;
  background: var(--border);
  border-radius: 9px;
  transition: background var(--transition);
}

.toggle-thumb::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  transition: transform var(--transition);
}

.toggle-switch input:checked ~ .toggle-thumb {
  background: var(--accent);
}

.toggle-switch input:checked ~ .toggle-thumb::after {
  transform: translateX(14px);
}

/* ── Text input ─────────────────────────────────────────────── */
.control-text-input {
  width: 100%;
  box-sizing: border-box;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  font-size: 11px;
  font-family: var(--font-family);
  padding: 5px 8px;
  outline: none;
  transition: border-color var(--transition);
}

.control-text-input:focus {
  border-color: var(--accent);
}
</style>
