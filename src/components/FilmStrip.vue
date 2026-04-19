<script setup lang="ts">
import { useGalleryStore } from '../stores/gallery'
import { pickMultipleImages } from '../utils/fileApi'

const gallery = useGalleryStore()

async function addMore() {
  const files = await pickMultipleImages()
  if (files.length > 0) await gallery.addFiles(files)
}
</script>

<template>
  <div v-if="gallery.items.length > 0" class="filmstrip">
    <div class="filmstrip-inner">
      <div
        v-for="(item, i) in gallery.items"
        :key="item.id"
        class="filmstrip-item"
        :class="{ active: gallery.activeIndex === i }"
        @click="gallery.setActive(i)"
      >
        <img
          v-if="item.thumbUrl"
          :src="item.thumbUrl"
          class="filmstrip-thumb"
          :alt="item.file.name"
        />
        <div v-else class="filmstrip-thumb filmstrip-thumb-empty" />
        <button
          class="filmstrip-remove"
          title="Remove"
          @click.stop="gallery.removeItem(i)"
        >✕</button>
        <span class="filmstrip-name" :title="item.file.name">{{ item.file.name }}</span>
      </div>
      <button class="filmstrip-add" title="Add more images" @click="addMore">+</button>
    </div>
  </div>
</template>
