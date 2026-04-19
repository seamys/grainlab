/**
 * Browser File API utilities — replaces Electron IPC file operations.
 */

export function pickImage(): Promise<{ base64: string; name: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp,image/tiff,image/bmp'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      readFileAsBase64(file).then((base64) => resolve({ base64, name: file.name }))
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

export function pickMultipleImages(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp,image/tiff,image/bmp'
    input.multiple = true
    input.onchange = () => {
      resolve(Array.from(input.files || []))
    }
    input.oncancel = () => resolve([])
    input.click()
  })
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
