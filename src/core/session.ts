import { NIVELES, WORDS } from '../data'
import type { Filtros, State, Word } from '../types'
import { shuffle } from './normalize'
import { newDoneToday } from './progress'
import { today } from './srs'

export interface SessionItem {
  id: number
  isNew: boolean
  /** Práctica libre fuera de calendario (no adelanta fechas al acertar). */
  freeNotDue: boolean
  retry: boolean
}

export type SessionMode = 'daily' | 'free'

export function matchesFilters(w: Word, f: Filtros): boolean {
  return (
    (f.niveles.length === 0 || f.niveles.includes(w.nivel)) &&
    (f.tipos.length === 0 || f.tipos.includes(w.tipo)) &&
    (f.temas.length === 0 || f.temas.includes(w.tema))
  )
}

export function filterWords(f: Filtros): Word[] {
  return WORDS.filter((w) => matchesFilters(w, f))
}

export function homeCounts(s: State) {
  const t = today()
  const words = filterWords(s.settings.filtros)
  let due = 0
  let unseen = 0
  for (const w of words) {
    const r = s.words[w.id]
    if (!r) unseen++
    else if (r.due <= t) due++
  }
  const quota = Math.max(0, s.settings.nuevasPorDia - newDoneToday(s))
  return { due, newToday: Math.min(quota, unseen), unseen, total: words.length }
}

export function buildSession(s: State, mode: SessionMode): SessionItem[] {
  const t = today()
  const words = filterWords(s.settings.filtros)

  if (mode === 'free') {
    const pool = shuffle(words).slice(0, 20)
    return pool.map((w) => {
      const r = s.words[w.id]
      return { id: w.id, isNew: !r, freeNotDue: !!r && r.due > t, retry: false }
    })
  }

  const due = words
    .filter((w) => s.words[w.id] && s.words[w.id].due <= t)
    .sort((a, b) => {
      const ra = s.words[a.id]
      const rb = s.words[b.id]
      return ra.due.localeCompare(rb.due) || ra.box - rb.box
    })
    .slice(0, s.settings.repasosPorSesion)
    .map((w): SessionItem => ({ id: w.id, isNew: false, freeNotDue: false, retry: false }))
  // las vencidas más viejas primero, pero mezcladas entre sí dentro de la misma fecha
  const quota = Math.max(0, s.settings.nuevasPorDia - newDoneToday(s))
  const unseen = words.filter((w) => !s.words[w.id])
  const ordered: Word[] = []
  for (const n of NIVELES) ordered.push(...shuffle(unseen.filter((w) => w.nivel === n)))
  const fresh = ordered
    .slice(0, quota)
    .map((w): SessionItem => ({ id: w.id, isNew: true, freeNotDue: false, retry: false }))

  return [...due, ...fresh]
}
