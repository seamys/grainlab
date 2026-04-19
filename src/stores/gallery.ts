import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FilterParams } from '../filters/types'
import { cloneParams, presets } from '../presets'
import { readFileAsBase64 } from '../utils/fileApi'
import { useEditorStore } from './editor'

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
      items.value.push({
        id,
        file,
        thumbUrl,
        params: cloneParams(presets[0].params),
        presetId: presets[0].id,
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
      items.value[activeIndex.value].params = cloneParams(editorStore.params)
      items.value[activeIndex.value].presetId = editorStore.currentPresetId
    }

    activeIndex.value = index
    const item = items.value[index]

    const base64 = await readFileAsBase64(item.file)
    if (myRequest !== requestId) return // stale, newer setActive call won

    editorStore.loadImageWithParams(base64, item.file.name, item.params, item.presetId)
  }

  function removeItem(index: number) {
    items.value.splice(index, 1)

    if (items.value.length === 0) {
      activeIndex.value = -1
      useEditorStore().clearImage()
      return
    }

    if (activeIndex.value === index || activeIndex.value >= items.value.length) {
      const newActive = Math.min(index, items.value.length - 1)
      setActive(newActive)
    } else if (activeIndex.value > index) {
      activeIndex.value--
    }
  }

  return { items, activeIndex, addFiles, setActive, removeItem }
})
