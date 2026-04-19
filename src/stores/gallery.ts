import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { FilterParams } from '../filters/types'
import { cloneParams, presets } from '../presets'
import { readFileAsBase64 } from '../utils/fileApi'
import { useEditorStore } from './editor'
import { dbSaveItem, dbDeleteItem, dbLoadAll, dbUpdateParams } from '../utils/galleryDb'

const ACTIVE_KEY = 'grainlab_active'

export interface GalleryItem {
  id: string
  file: File
  thumbUrl: string
  params: FilterParams
  presetId: string
}

export const useGalleryStore = defineStore('gallery', () => {
  const items = ref<GalleryItem[]>([])
  const activeIndex = ref(-1)
  let requestId = 0

  async function generateThumb(file: File): Promise<string> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        const W = 72
        const H = 52
        const canvas = document.createElement('canvas')
        canvas.width = W
        canvas.height = H
        const ctx = canvas.getContext('2d')!
        // Cover crop: scale to fill, center
        const srcAspect = img.width / img.height
        const dstAspect = W / H
        let sx = 0, sy = 0, sw = img.width, sh = img.height
        if (srcAspect > dstAspect) {
          sw = img.height * dstAspect
          sx = (img.width - sw) / 2
        } else {
          sh = img.width / dstAspect
          sy = (img.height - sh) / 2
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve('')
      }
      img.src = url
    })
  }

  async function addFiles(files: File[]) {
    const wasEmpty = items.value.length === 0
    const startIndex = items.value.length

    for (const file of files) {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`
      const thumbUrl = await generateThumb(file)
      const defaultParams = cloneParams(presets[0].params)
      const defaultPresetId = presets[0].id
      const order = items.value.length

      items.value.push({
        id,
        file,
        thumbUrl,
        params: defaultParams,
        presetId: defaultPresetId,
      })

      // Persist to IndexedDB (don't await — keep UI responsive)
      file.arrayBuffer().then((buffer) => {
        dbSaveItem({
          id,
          name: file.name,
          type: file.type,
          buffer,
          thumbUrl,
          params: defaultParams,
          presetId: defaultPresetId,
          order,
        })
      })
    }

    // If gallery was empty, activate the first new item
    if (wasEmpty && items.value.length > 0) {
      await setActive(startIndex)
    }
  }

  async function setActive(index: number) {
    if (index < 0 || index >= items.value.length) return
    const myRequest = ++requestId
    const editorStore = useEditorStore()

    // Save current item's params before switching
    if (activeIndex.value >= 0 && activeIndex.value < items.value.length) {
      const prev = items.value[activeIndex.value]
      prev.params = cloneParams(editorStore.params)
      prev.presetId = editorStore.currentPresetId
      dbUpdateParams(prev.id, prev.params, prev.presetId)
    }

    activeIndex.value = index
    localStorage.setItem(ACTIVE_KEY, String(index))
    const item = items.value[index]

    const base64 = await readFileAsBase64(item.file)
    if (myRequest !== requestId) return // stale, newer setActive call won

    editorStore.loadImageWithParams(base64, item.file.name, item.params, item.presetId)
  }

  function removeItem(index: number) {
    dbDeleteItem(items.value[index].id)
    items.value.splice(index, 1)

    if (items.value.length === 0) {
      activeIndex.value = -1
      localStorage.removeItem(ACTIVE_KEY)
      useEditorStore().clearImage()
      return
    }

    if (activeIndex.value === index || activeIndex.value >= items.value.length) {
      const newActive = Math.min(index, items.value.length - 1)
      setActive(newActive)
    } else if (activeIndex.value > index) {
      activeIndex.value--
      localStorage.setItem(ACTIVE_KEY, String(activeIndex.value))
    }
  }

  // Debounced watcher: persist active item's params whenever the user adjusts sliders
  // This ensures params are saved even without switching images.
  let paramsSyncTimer: ReturnType<typeof setTimeout> | null = null
  function schedulePersistParams() {
    if (paramsSyncTimer) clearTimeout(paramsSyncTimer)
    paramsSyncTimer = setTimeout(() => {
      if (activeIndex.value < 0 || activeIndex.value >= items.value.length) return
      const editorStore = useEditorStore()
      const item = items.value[activeIndex.value]
      item.params = cloneParams(editorStore.params)
      item.presetId = editorStore.currentPresetId
      dbUpdateParams(item.id, item.params, item.presetId)
    }, 300)
  }

  // Start watching after store is ready (called from App.vue once gallery is initialized)
  function startParamsWatch() {
    const editorStore = useEditorStore()
    watch(() => editorStore.params, schedulePersistParams, { deep: true })
    watch(() => editorStore.currentPresetId, schedulePersistParams)
  }

  /**
   * Restore gallery from IndexedDB on app startup.
   * Returns true if any items were restored, false if DB was empty.
   */
  async function restoreFromDB(): Promise<boolean> {
    const records = await dbLoadAll()
    if (records.length === 0) return false

    items.value = records.map((rec) => ({
      id: rec.id,
      file: new File([rec.buffer], rec.name, { type: rec.type }),
      thumbUrl: rec.thumbUrl,
      params: rec.params,
      presetId: rec.presetId,
    }))

    const savedActive = parseInt(localStorage.getItem(ACTIVE_KEY) ?? '0', 10)
    const idx = Math.max(0, Math.min(savedActive, items.value.length - 1))
    await setActive(idx)
    return true
  }

  return { items, activeIndex, addFiles, setActive, removeItem, restoreFromDB, startParamsWatch }
})
