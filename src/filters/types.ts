export interface ColorGradeParams {
  temperature: number // -100 (cool) to 100 (warm)
  tint: number // -100 (green) to 100 (magenta)
  saturation: number // -100 to 100
  contrast: number // -100 to 100
  exposure: number // -100 to 100
  highlights: number // -100 to 100
  shadows: number // -100 to 100
  midtoneR: number // -50 to 50
  midtoneG: number // -50 to 50
  midtoneB: number // -50 to 50
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
  colorVariance: number // 0 to 100 — per-channel color noise
  shadowBoost: number // 0 to 100 — extra grain in shadows
  highlightReduction: number // 0 to 100 — reduce grain in highlights
}

export interface VignetteParams {
  intensity: number // 0 to 100
  radius: number // 0.5 to 2.0
  feather: number // 0 (hard) to 100 (soft)
  color: number // 0 (black) to 100 (white)
}

export interface LightLeakParams {
  intensity: number // 0 to 100
  color: 'warm' | 'cool' | 'vintage'
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export interface FadeParams {
  intensity: number // 0 to 100
}

export interface HalationParams {
  intensity: number // 0 to 100
  color: 'red' | 'warm' | 'gold'
  radius: number // 1 to 20
}

export interface BloomParams {
  intensity: number // 0 to 100
  threshold: number // 0 to 100 — luminance threshold
  radius: number // 1 to 20
}

export interface ToneCurveParams {
  shadows: number // -50 to 50
  midtones: number // -50 to 50
  highlights: number // -50 to 50
}

export interface FilterParams {
  colorGrade: ColorGradeParams
  grain: GrainParams
  vignette: VignetteParams
  lightLeak: LightLeakParams
  fade: FadeParams
  halation: HalationParams
  bloom: BloomParams
  toneCurve: ToneCurveParams
}

export interface WatermarkParams {
  enabled: boolean
  text: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  opacity: number // 0 to 100
  size: number // 10 to 100
  color: 'white' | 'black'
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  fontFamily: 'sans-serif' | 'serif' | 'monospace'
}

export interface FilmPreset {
  id: string
  name: string
  nameZh: string
  description: string
  i18nKey: string
  params: FilterParams
}
