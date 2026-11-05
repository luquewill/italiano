import { learnedWordIds } from '../curriculum'
import { WORDS } from '../data'
import type { Filtros, State, Word } from '../types'
import { shuffle } from './normalize'
import { today } from './srs'

export interface SessionItem {
  id: number
  /** Práctica libre fuera de calendario (no adelanta fechas al acertar). */
  freeNotDue: boolean
  retry: boolean
}

/** review = repaso espaciado del día · free = práctica opcional desde Explorar. */
export type SessionMode = 'review' | 'free'

export function matchesFilters(w: Word, f: Filtros): boolean {
  return (
    (f.niveles.length === 0 || f.niveles.includes(w.nivel)) &&
    (f.tipos.length === 0 || f.tipos.includes(w.tipo)) &&
    (f.temas.length === 0 || f.temas.includes(w.tema))
  )
}

export const learnedSet = (s: State) => learnedWordIds(new Set(s.path.done))

/** Palabras de lecciones ya hechas cuyo repaso está vencido. */
export function dueWords(s: State): Word[] {
  const t = today()
  const learned = learnedSet(s)
  return WORDS.filter((w) => learned.has(w.id) && s.words[w.id] && s.words[w.id].due <= t)
}

export function buildSession(s: State, mode: SessionMode): SessionItem[] {
  const t = today()
  if (mode === 'free') {
    const learned = learnedSet(s)
    const pool = shuffle(WORDS.filter((w) => learned.has(w.id) && matchesFilters(w, s.settings.filtros))).slice(0, 20)
    return pool.map((w) => ({ id: w.id, freeNotDue: !s.words[w.id] || s.words[w.id].due > t, retry: false }))
  }
  return dueWords(s)
    .sort((a, b) => {
      const ra = s.words[a.id]
      const rb = s.words[b.id]
      return ra.due.localeCompare(rb.due) || ra.box - rb.box
    })
    .slice(0, s.settings.repasosPorSesion)
    .map((w): SessionItem => ({ id: w.id, freeNotDue: false, retry: false }))
}
