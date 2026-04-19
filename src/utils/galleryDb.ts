/**
 * IndexedDB persistence for the gallery.
 * Stores raw image buffers + per-image params so they survive page refresh.
 */

import type { FilterParams } from '../filters/types'

export interface PersistedItem {
  id: string
  name: string
  type: string
  buffer: ArrayBuffer
  thumbUrl: string
  params: FilterParams
  presetId: string
  order: number
}

const DB_NAME = 'grainlab_gallery'
const DB_VERSION = 1
const STORE = 'items'

let _db: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => {
      _db = req.result
      resolve(_db)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function dbSaveItem(item: PersistedItem): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(item)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // silent — private browsing or quota exceeded
  }
}

export async function dbDeleteItem(id: string): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // silent
  }
}

export async function dbLoadAll(): Promise<PersistedItem[]> {
  try {
    const db = await openDB()
    const records = await new Promise<PersistedItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).getAll()
      req.onsuccess = () => resolve((req.result as PersistedItem[]) ?? [])
      req.onerror = () => reject(req.error)
    })
    return records.sort((a, b) => a.order - b.order)
  } catch {
    return []
  }
}

export async function dbUpdateParams(
  id: string,
  params: FilterParams,
  presetId: string
): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const getReq = store.get(id)
      getReq.onsuccess = () => {
        const rec = getReq.result as PersistedItem | undefined
        if (rec) store.put({ ...rec, params: JSON.parse(JSON.stringify(params)), presetId })
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // silent
  }
}
