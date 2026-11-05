import { useSyncExternalStore } from 'react'
import type { Rec, Settings, State } from '../types'
import { DATA_VERSION, migrateDone, migrateWords } from './migrate'
import { today } from './srs'

const KEY = 'italiano-progreso-v1'

export const DEFAULT_SETTINGS: Settings = {
  nuevasPorDia: 15,
  repasosPorSesion: 40,
  velocidad: 'normal',
  tema: 'auto',
  filtros: { niveles: [], tipos: [], temas: [] },
}

export const fresh = (): State => ({
  version: 1,
  dataVersion: DATA_VERSION,
  settings: structuredClone(DEFAULT_SETTINGS),
  words: {},
  daily: { date: today(), newDone: 0 },
  path: { done: [] },
})

/** Valida/normaliza un objeto leído de localStorage o de un backup. */
export function sanitize(x: unknown): State | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Partial<State>
  if (o.version !== 1 || typeof o.words !== 'object' || o.words === null) return null
  const s = fresh()
  s.settings = {
    ...s.settings,
    ...(o.settings ?? {}),
    filtros: { ...s.settings.filtros, ...(o.settings?.filtros ?? {}) },
  }
  for (const [k, v] of Object.entries(o.words)) {
    const r = v as Rec
    if (r && typeof r.box === 'number' && typeof r.due === 'string') s.words[Number(k)] = r
  }
  if (o.daily && typeof o.daily.date === 'string') s.daily = { date: o.daily.date, newDone: o.daily.newDone | 0 }
  // migración: los backups/estados anteriores no tienen camino
  if (o.path && Array.isArray(o.path.done)) s.path = { done: o.path.done.filter((x) => typeof x === 'string') }
  // migración: progreso guardado con la base anterior (ids de palabras y lecciones distintos)
  if (o.dataVersion !== DATA_VERSION) {
    s.words = migrateWords(s.words)
    s.path = { done: migrateDone(s.path.done) }
  }
  return s
}

function load(): State {
  try {
    const t = localStorage.getItem(KEY)
    if (t) return sanitize(JSON.parse(t)) ?? fresh()
  } catch {
    /* sin localStorage o datos corruptos */
  }
  return fresh()
}

let state: State = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignorar */
  }
}

export function getState(): State {
  return state
}

export function setState(fn: (s: State) => State) {
  state = fn(state)
  persist()
  listeners.forEach((l) => l())
}

export function subscribeState(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** Reemplaza todo el estado (login, sincronización). */
export function replaceState(next: State) {
  state = next
  persist()
  listeners.forEach((l) => l())
}

export function useAppState(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    getState,
  )
}

export const newDoneToday = (s: State) => (s.daily.date === today() ? s.daily.newDone : 0)

export function saveRec(id: number, rec: Rec, countAsNewToday: boolean) {
  setState((s) => {
    const t = today()
    const daily = s.daily.date === t ? s.daily : { date: t, newDone: 0 }
    return {
      ...s,
      words: { ...s.words, [id]: rec },
      daily: countAsNewToday ? { date: t, newDone: daily.newDone + 1 } : daily,
    }
  })
}

/** Guarda de una vez los registros de una lección y la marca como completada. */
export function completeLesson(lessonId: string, recs: Record<number, Rec>) {
  setState((s) => ({
    ...s,
    words: { ...s.words, ...recs },
    path: { done: s.path.done.includes(lessonId) ? s.path.done : [...s.path.done, lessonId] },
  }))
}

export function resetWord(id: number) {
  setState((s) => {
    const words = { ...s.words }
    delete words[id]
    return { ...s, words }
  })
}

export function updateSettings(patch: Partial<Settings>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
}

export function exportJson(): string {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2)
}

export function importJson(text: string): boolean {
  try {
    const next = sanitize(JSON.parse(text))
    if (!next) return false
    setState(() => next)
    return true
  } catch {
    return false
  }
}

export function resetAll() {
  setState((s) => ({ ...fresh(), settings: s.settings }))
}
