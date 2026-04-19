<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

// ===== Mobile detection =====
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)
const mobilePanelTab = ref<'presets' | 'controls'>('controls')
const mobilePanelExpanded = ref(true)

function handleResize() {
  windowWidth.value = window.innerWidth
}

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

onMounted(async () => {
  const saved = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = saved ? saved === 'dark' : prefersDark
  applyTheme(isDark.value)

  window.addEventListener('resize', handleResize)

  // Restore gallery from IndexedDB; only load example if DB was empty
  const restored = await gallery.restoreFromDB()
  if (!restored) {
    try {
      const res = await fetch('./examples/example.jpg')
      const blob = await res.blob()
      const file = new File([blob], 'example.jpg', { type: 'image/jpeg' })
      await gallery.addFiles([file])
    } catch {
      // silently ignore if example image is not available
    }
  }

  // Start watching editor params to persist changes to IndexedDB
  gallery.startParamsWatch()
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
  <div class="app" :class="{ 'app-mobile': isMobile }" @keydown="handleKeydown" tabindex="0">

    <!-- ===== DESKTOP LAYOUT ===== -->
    <template v-if="!isMobile">
      <!-- Toolbar -->
      <header class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title-icon"></span>
          <span class="toolbar-title">{{ t('app.title') }}</span>
          <span class="toolbar-divider"></span>
          <span class="toolbar-tagline">Film Photography Simulator</span>
        </div>
        <div class="toolbar-right">
          <button class="btn" @click="openFile">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:-1px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {{ t('app.open') }}
          </button>
          <button
            class="btn btn-toggle"
            :class="{ active: store.showBeforeAfter }"
            :disabled="!store.imageLoaded"
            @click="store.toggleBeforeAfter()"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:-1px"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
            {{ t('app.compare') }}
          </button>
          <button
            class="btn btn-primary"
            :disabled="!store.imageLoaded"
            @click="showExport = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:-1px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {{ t('app.export') }}
          </button>
          <button class="btn" :disabled="!store.imageLoaded" @click="showBatch = true">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:-1px"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/></svg>
            {{ t('app.batch') }}
          </button>
          <span class="toolbar-divider"></span>
          <a
            class="btn icon-btn"
            href="https://github.com/seamys/grainlab"
            target="_blank"
            rel="noopener noreferrer"
            title="View source on GitHub"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
          </a>
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

        <aside class="sidebar">
          <div class="sidebar-scroll">
            <PresetPanel />
            <ControlPanel />
          </div>
          <footer class="sidebar-copyright">
            © {{ new Date().getFullYear() }} GrainLab · Made by <a href="https://github.com/seamys" target="_blank" rel="noopener noreferrer" class="copyright-link">Flying Pizza</a>
          </footer>
        </aside>
      </main>
    </template>

    <!-- ===== MOBILE LAYOUT ===== -->
    <template v-else>
      <!-- Compact mobile toolbar -->
      <header class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title-icon"></span>
          <span class="toolbar-title">{{ t('app.title') }}</span>
        </div>
        <div class="toolbar-right">
          <button class="btn mobile-icon-btn" @click="openFile" :title="t('app.open')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </button>
          <button
            class="btn btn-toggle mobile-icon-btn"
            :class="{ active: store.showBeforeAfter }"
            :disabled="!store.imageLoaded"
            @click="store.toggleBeforeAfter()"
            :title="t('app.compare')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
          </button>
          <button
            class="btn btn-primary mobile-icon-btn"
            :disabled="!store.imageLoaded"
            @click="showExport = true"
            :title="t('app.export')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button class="btn mobile-icon-btn" :disabled="!store.imageLoaded" @click="showBatch = true" :title="t('app.batch')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/></svg>
          </button>
          <button class="btn mobile-icon-btn theme-toggle" @click="toggleTheme" :title="isDark ? 'Light mode' : 'Dark mode'">
            <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <select class="lang-select" v-model="currentLocale" style="font-size:11px;padding:4px 6px">
            <option v-for="l in LOCALES" :key="l.code" :value="l.code">{{ l.code.toUpperCase() }}</option>
          </select>
        </div>
      </header>

      <!-- Mobile workspace -->
      <div class="mobile-workspace">
        <!-- Canvas area -->
        <div class="mobile-canvas-area" :class="{ 'has-filmstrip': gallery.items.length > 0 }">
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

        <!-- Bottom panel -->
        <div class="mobile-panel" :class="{ expanded: mobilePanelExpanded }">
          <div class="mobile-panel-header" @click="mobilePanelExpanded = !mobilePanelExpanded">
            <div class="mobile-panel-drag-bar"></div>
            <div class="mobile-panel-tabs">
              <button
                class="mobile-panel-tab"
                :class="{ active: mobilePanelTab === 'presets' }"
                @click.stop="mobilePanelTab = 'presets'; mobilePanelExpanded = true"
              >{{ t('panel.presets') }}</button>
              <button
                class="mobile-panel-tab"
                :class="{ active: mobilePanelTab === 'controls' }"
                @click.stop="mobilePanelTab = 'controls'; mobilePanelExpanded = true"
              >{{ t('panel.adjust') }}</button>
            </div>
          </div>
          <div class="mobile-panel-content">
            <PresetPanel v-show="mobilePanelTab === 'presets'" />
            <ControlPanel v-show="mobilePanelTab === 'controls'" />
          </div>
        </div>
      </div>
    </template>

    <!-- Modals (shared by both layouts) -->
    <ExportDialog v-if="showExport" @close="showExport = false" />
    <BatchPanel v-if="showBatch" @close="showBatch = false" />
  </div>
</template>
