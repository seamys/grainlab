export interface ColorGradeParams {
  temperature: number // -100 (cool) to 100 (warm)
  tint: number // -100 (green) to 100 (magenta)
  saturation: number // -100 to 100
  contrast: number // -100 to 100
  shadowR: number // -50 to 50
  shadowG: number // -50 to 50
  shadowB: number // -50 to 50
  highlightR: number // -50 to 50
  highlightG: number // -50 to 50
  highlightB: number // -50 to 50
}

export interface GrainParams {
  intensity: number // 0 to 100
  size: number // 1 to 3
}

export interface VignetteParams {
  intensity: number // 0 to 100
  radius: number // 0.5 to 2.0
}

export interface LightLeakParams {
  intensity: number // 0 to 100
  color: 'warm' | 'cool' | 'vintage'
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export interface FadeParams {
  intensity: number // 0 to 100
}

export interface FilterParams {
  colorGrade: ColorGradeParams
  grain: GrainParams
  vignette: VignetteParams
  lightLeak: LightLeakParams
  fade: FadeParams
}

export interface FilmPreset {
  id: string
  name: string
  nameZh: string
  description: string
  i18nKey: string
  params: FilterParams
}
