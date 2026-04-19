import type { FilmPreset, FilterParams } from '../filters/types'

export const presets: FilmPreset[] = [
  {
    id: 'kodak-portra-400',
    name: 'Kodak Portra 400',
    nameZh: 'Portra 400',
    description: '经典人像胶片，暖色调，柔和高光，优雅肤色',
    i18nKey: 'kodakPortra400',
    params: {
      colorGrade: {
        temperature: 25,
        tint: 5,
        saturation: -15,
        contrast: -10,
        shadowR: 20,
        shadowG: 8,
        shadowB: -5,
        highlightR: -5,
        highlightG: -3,
        highlightB: 5,
      },
      grain: { intensity: 25, size: 1.5 },
      vignette: { intensity: 18, radius: 1.2 },
      lightLeak: { intensity: 0, color: 'warm', position: 'top-right' },
      fade: { intensity: 15 },
    },
  },
  {
    id: 'kodak-gold-200',
    name: 'Kodak Gold 200',
    nameZh: 'Gold 200',
    description: '浓郁暖调，高饱和度，适合日常与旅行',
    i18nKey: 'kodakGold200',
    params: {
      colorGrade: {
        temperature: 35,
        tint: 8,
        saturation: 15,
        contrast: 8,
        shadowR: 25,
        shadowG: 15,
        shadowB: -10,
        highlightR: 10,
        highlightG: 5,
        highlightB: -5,
      },
      grain: { intensity: 40, size: 1.5 },
      vignette: { intensity: 30, radius: 1.1 },
      lightLeak: { intensity: 15, color: 'warm', position: 'top-left' },
      fade: { intensity: 10 },
    },
  },
  {
    id: 'fuji-superia-400',
    name: 'Fuji Superia 400',
    nameZh: 'Superia 400',
    description: '清新绿调，冷暖平衡，出色的肤色还原',
    i18nKey: 'fujiSuperia400',
    params: {
      colorGrade: {
        temperature: -10,
        tint: -8,
        saturation: 5,
        contrast: 5,
        shadowR: -5,
        shadowG: 15,
        shadowB: 5,
        highlightR: 5,
        highlightG: -2,
        highlightB: -3,
      },
      grain: { intensity: 22, size: 1 },
      vignette: { intensity: 15, radius: 1.3 },
      lightLeak: { intensity: 0, color: 'cool', position: 'bottom-right' },
      fade: { intensity: 8 },
    },
  },
  {
    id: 'fuji-c200',
    name: 'Fuji C200',
    nameZh: 'C200',
    description: '清淡冷调，低对比度，日系清新风格',
    i18nKey: 'fujiC200',
    params: {
      colorGrade: {
        temperature: -15,
        tint: -5,
        saturation: -10,
        contrast: -15,
        shadowR: -5,
        shadowG: 5,
        shadowB: 15,
        highlightR: 3,
        highlightG: 3,
        highlightB: 8,
      },
      grain: { intensity: 15, size: 1 },
      vignette: { intensity: 10, radius: 1.4 },
      lightLeak: { intensity: 8, color: 'cool', position: 'top-right' },
      fade: { intensity: 25 },
    },
  },
  {
    id: 'ilford-hp5',
    name: 'Ilford HP5 Plus',
    nameZh: 'HP5 黑白',
    description: '经典黑白胶片，高对比度，浓郁颗粒感',
    i18nKey: 'ilfordHP5',
    params: {
      colorGrade: {
        temperature: 0,
        tint: 0,
        saturation: -100,
        contrast: 25,
        shadowR: 0,
        shadowG: 0,
        shadowB: 0,
        highlightR: 0,
        highlightG: 0,
        highlightB: 0,
      },
      grain: { intensity: 65, size: 2 },
      vignette: { intensity: 45, radius: 1.0 },
      lightLeak: { intensity: 0, color: 'warm', position: 'top-left' },
      fade: { intensity: 12 },
    },
  },
]

export function getPresetById(id: string): FilmPreset | undefined {
  return presets.find((p) => p.id === id)
}

export function cloneParams(params: FilterParams): FilterParams {
  return JSON.parse(JSON.stringify(params))
}
