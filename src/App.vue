<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from './stores/editor'
import { pickImage } from './utils/fileApi'
import { toggleLocale } from './i18n'
import ImageCanvas from './components/ImageCanvas.vue'
import PresetPanel from './components/PresetPanel.vue'
import ControlPanel from './components/ControlPanel.vue'
import ExportDialog from './components/ExportDialog.vue'
import BatchPanel from './components/BatchPanel.vue'
import BeforeAfter from './components/BeforeAfter.vue'

const { t } = useI18n()

const store = useEditorStore()
const showExport = ref(false)
const showBatch = ref(false)

async function openFile() {
  const result = await pickImage()
  if (result) {
    store.loadImage(result.base64, result.name, '')
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
        <button class="btn" @click="toggleLocale">{{ t('lang.toggle') }}</button>
      </div>
    </header>

    <!-- Workspace -->
    <main class="workspace">
      <!-- Preview area -->
      <div class="preview-area">
        <BeforeAfter v-if="store.showBeforeAfter && store.imageLoaded" />
        <ImageCanvas v-else />
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
      </aside>
    </main>

    <!-- Modals -->
    <ExportDialog v-if="showExport" @close="showExport = false" />
    <BatchPanel v-if="showBatch" @close="showBatch = false" />
  </div>
</template>
