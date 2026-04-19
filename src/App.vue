<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from './stores/editor'
import { useGalleryStore } from './stores/gallery'
import { pickMultipleImages } from './utils/fileApi'
import { setLocale, LOCALES, type LocaleCode } from './i18n'

// ===== Theme =====
const isDark = ref(true)

function applyTheme(dark: boolean) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  localStorage.setItem('theme', dark ? 'dark' : 'light')
}

function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
}

onMounted(async () => {
  const saved = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = saved ? saved === 'dark' : prefersDark
  applyTheme(isDark.value)

  // Load default example image
  try {
    const res = await fetch('./examples/example.jpg')
    const blob = await res.blob()
    const file = new File([blob], 'example.jpg', { type: 'image/jpeg' })
    await gallery.addFiles([file])
  } catch {
    // silently ignore if example image is not available
  }
})
import ImageCanvas from './components/ImageCanvas.vue'
import PresetPanel from './components/PresetPanel.vue'
import ControlPanel from './components/ControlPanel.vue'
import ExportDialog from './components/ExportDialog.vue'
import BatchPanel from './components/BatchPanel.vue'
import BeforeAfter from './components/BeforeAfter.vue'
import FilmStrip from './components/FilmStrip.vue'

const { t, locale } = useI18n()
const currentLocale = computed({
  get: () => locale.value as LocaleCode,
  set: (val: LocaleCode) => setLocale(val),
})

const store = useEditorStore()
const gallery = useGalleryStore()
const showExport = ref(false)
const showBatch = ref(false)
const imageCanvasRef = ref<InstanceType<typeof ImageCanvas> | null>(null)

async function openFile() {
  const files = await pickMultipleImages()
  if (files.length > 0) {
    await gallery.addFiles(files)
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'o':
        e.preventDefault()
        openFile()
        break
      case 's':
        e.preventDefault()
        if (store.imageLoaded) showExport.value = true
        break
      case '=':
      case '+':
        e.preventDefault()
        imageCanvasRef.value?.zoomIn()
        break
      case '-':
        e.preventDefault()
        imageCanvasRef.value?.zoomOut()
        break
      case '0':
        e.preventDefault()
        imageCanvasRef.value?.resetZoom()
        break
    }
  }
}
</script>

<template>
  <div class="app" @keydown="handleKeydown" tabindex="0">
    <!-- Toolbar -->
    <header class="toolbar">
      <div class="toolbar-left">
        <span class="toolbar-title-icon"></span>
        <span class="toolbar-title">{{ t('app.title') }}</span>
      </div>
      <div class="toolbar-right">
        <button class="btn" @click="openFile">{{ t('app.open') }}</button>
        <button
          class="btn btn-toggle"
          :class="{ active: store.showBeforeAfter }"
          :disabled="!store.imageLoaded"
          @click="store.toggleBeforeAfter()"
        >
          {{ t('app.compare') }}
        </button>
        <button
          class="btn btn-primary"
          :disabled="!store.imageLoaded"
          @click="showExport = true"
        >
          {{ t('app.export') }}
        </button>
        <button class="btn" :disabled="!store.imageLoaded" @click="showBatch = true">
          {{ t('app.batch') }}
        </button>
        <span class="toolbar-divider"></span>
        <button class="btn theme-toggle" @click="toggleTheme" :title="isDark ? 'Light mode' : 'Dark mode'">
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        <select class="lang-select" v-model="currentLocale">
          <option v-for="l in LOCALES" :key="l.code" :value="l.code">{{ l.label }}</option>
        </select>
      </div>
    </header>

    <!-- Workspace -->
    <main class="workspace">
      <!-- Preview area -->
      <div class="preview-area" :class="{ 'has-filmstrip': gallery.items.length > 0 }">
        <BeforeAfter v-if="store.showBeforeAfter && store.imageLoaded" />
        <ImageCanvas v-else ref="imageCanvasRef" />
        <FilmStrip />
        <transition name="status-fade">
          <div v-if="store.processing && store.imageLoaded" class="processing-indicator">
            <div class="processing-dot" />
            <span>{{ t('status.processing') }}</span>
          </div>
        </transition>
      </div>

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-scroll">
          <PresetPanel />
          <ControlPanel />
        </div>
        <footer class="sidebar-copyright">
          © {{ new Date().getFullYear() }} GrainLab
        </footer>
      </aside>
    </main>

    <!-- Modals -->
    <ExportDialog v-if="showExport" @close="showExport = false" />
    <BatchPanel v-if="showBatch" @close="showBatch = false" />
  </div>
</template>
