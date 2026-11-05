import raw from './data/curriculum.json'
import type { Nivel } from './types'

export interface LessonInfo {
  id: string
  unitId: string
  unitIndex: number
  nivel: Nivel
  unitTitle: string
  title: string
  words: number[]
  cierre: boolean
  /** Posición global en el camino (0 = primera lección). */
  index: number
  /** Número de lección dentro de la unidad (1..n); 0 para el cierre. */
  no: number
}

export interface UnitInfo {
  id: string
  index: number
  nivel: Nivel
  titulo: string
  total: number
  lessons: LessonInfo[]
}

interface RawLesson { id: string; titulo: string; cierre?: boolean; palabras: number[] }
interface RawUnit { id: string; nivel: Nivel; titulo: string; total: number; lecciones: RawLesson[] }

export const UNITS: UnitInfo[] = []
export const LESSONS: LessonInfo[] = []
export const LESSON_BY_ID = new Map<string, LessonInfo>()

;(raw as unknown as { unidades: RawUnit[] }).unidades.forEach((u, ui) => {
  const unit: UnitInfo = { id: u.id, index: ui, nivel: u.nivel, titulo: u.titulo, total: u.total, lessons: [] }
  let no = 0
  for (const l of u.lecciones) {
    const cierre = !!l.cierre
    if (!cierre) no++
    const info: LessonInfo = {
      id: l.id,
      unitId: u.id,
      unitIndex: ui,
      nivel: u.nivel,
      unitTitle: u.titulo,
      title: cierre ? 'Cierre' : `Lección ${no}`,
      words: l.palabras,
      cierre,
      index: LESSONS.length,
      no: cierre ? 0 : no,
    }
    unit.lessons.push(info)
    LESSONS.push(info)
    LESSON_BY_ID.set(info.id, info)
  }
  UNITS.push(unit)
})

/** Primera lección sin completar (la "actual"), o null si se terminó todo. */
export function currentLesson(done: ReadonlySet<string>): LessonInfo | null {
  return LESSONS.find((l) => !done.has(l.id)) ?? null
}

export type LessonStatus = 'done' | 'current' | 'locked'

export function lessonStatus(l: LessonInfo, done: ReadonlySet<string>): LessonStatus {
  if (done.has(l.id)) return 'done'
  return currentLesson(done)?.id === l.id ? 'current' : 'locked'
}

/** Ids de palabras de lecciones ya completadas (el cierre no agrega palabras nuevas). */
export function learnedWordIds(done: ReadonlySet<string>): Set<number> {
  const s = new Set<number>()
  for (const l of LESSONS) if (!l.cierre && done.has(l.id)) for (const id of l.words) s.add(id)
  return s
}
