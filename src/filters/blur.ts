/**
 * Fast separable box blur for Float32Array pixel maps.
 * Uses sliding-window O(1) per pixel, zero-padding at borders.
 */
export function boxBlur(
  src: Float32Array,
  width: number,
  height: number,
  r: number,
): Float32Array {
  const tmp = new Float32Array(width * height)
  const dst = new Float32Array(width * height)
  const invD = 1 / (2 * r + 1)

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    const off = y * width
    let sum = 0
    for (let k = 0; k <= r; k++) sum += src[off + k]
    for (let x = 0; x < width; x++) {
      tmp[off + x] = sum * invD
      const add = x + r + 1
      const remove = x - r
      if (add < width) sum += src[off + add]
      if (remove >= 0) sum -= src[off + remove]
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    let sum = 0
    for (let k = 0; k <= r; k++) sum += tmp[k * width + x]
    for (let y = 0; y < height; y++) {
      dst[y * width + x] = sum * invD
      const add = y + r + 1
      const remove = y - r
      if (add < height) sum += tmp[add * width + x]
      if (remove >= 0) sum -= tmp[remove * width + x]
    }
  }

  return dst
}
