export type Nivel = 'A1' | 'A2' | 'B1'

export interface Word {
  id: number
  italiano: string
  espanol: string
  tipo: string
  nivel: Nivel
  tema: string
  ejemplo: string
  // sustantivos
  genero?: string
  plural?: string
  // verbos
  auxiliar?: string
  participio?: string
  presente?: string
  reflexivo?: boolean
  // adjetivos
  femenino?: string
  plural_masculino?: string
  plural_femenino?: string
  invariable?: boolean
}

/** Progreso de una palabra (Leitner de 5 cajas; sin registro = nueva). */
export interface Rec {
  box: number // 1..5
  due: string // YYYY-MM-DD (fecha local)
  reps: number
  lapses: number
  first: string
  last: string
  lastKind?: string
}

export interface Filtros {
  niveles: string[] // vacío = todos
  tipos: string[]
  temas: string[]
}

export interface Settings {
  nuevasPorDia: number
  repasosPorSesion: number
  velocidad: 'normal' | 'lenta'
  tema: 'auto' | 'claro' | 'oscuro'
  filtros: Filtros
}

export interface State {
  version: 1
  settings: Settings
  words: Record<number, Rec>
  daily: { date: string; newDone: number }
  /** Lecciones del camino completadas (ids de curriculum.json). */
  path: { done: string[] }
}

export type WordStatus = 'nueva' | 'aprendiendo' | 'reconozco' | 'uso'
