import { useSyncExternalStore } from 'react'
import type { Rec, State } from '../types'
import { fresh, getState, replaceState, sanitize, subscribeState } from '../core/progress'
import { supabase } from './client'

export interface AuthInfo {
  status: 'loading' | 'out' | 'in'
  userId: string | null
  email: string | null
  /** Eligió usar la app sin cuenta (solo este dispositivo). */
  guest: boolean
  sync: 'idle' | 'saving' | 'ok' | 'error'
  lastSync: number | null
}

const GUEST_KEY = 'italiano-sin-cuenta'
const OWNER_KEY = 'italiano-dueno'

const read = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k: string, v: string | null) => {
  try {
    if (v == null) localStorage.removeItem(k)
    else localStorage.setItem(k, v)
  } catch {
    /* ignorar */
  }
}

let info: AuthInfo = {
  status: 'loading',
  userId: null,
  email: null,
  guest: read(GUEST_KEY) === '1',
  sync: 'idle',
  lastSync: null,
}
const listeners = new Set<() => void>()
const set = (patch: Partial<AuthInfo>) => {
  info = { ...info, ...patch }
  listeners.forEach((l) => l())
}

export function useAuth(): AuthInfo {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => info,
  )
}

/* ---------- fusión de progreso ---------- */

function newer(a: Rec, b: Rec): Rec {
  if (a.last !== b.last) return a.last > b.last ? a : b
  return a.reps >= b.reps ? a : b
}

/** Une dos progresos: por palabra gana el registro más reciente; las lecciones hechas se suman. */
export function mergeStates(local: State, remote: State): State {
  const words: Record<number, Rec> = { ...remote.words }
  for (const [k, r] of Object.entries(local.words)) {
    const id = Number(k)
    words[id] = words[id] ? newer(r, words[id]) : r
  }
  const done = [...new Set([...remote.path.done, ...local.path.done])]
  const daily =
    local.daily.date === remote.daily.date
      ? { date: local.daily.date, newDone: Math.max(local.daily.newDone, remote.daily.newDone) }
      : local.daily.date > remote.daily.date
        ? local.daily
        : remote.daily
  return { version: 1, settings: remote.settings, words, daily, path: { done } }
}

/* ---------- subida / bajada ---------- */

let applying = false
let timer: ReturnType<typeof setTimeout> | undefined

async function push(userId: string, s: State) {
  set({ sync: 'saving' })
  const { error } = await supabase
    .from('progreso')
    .upsert({ user_id: userId, data: s, updated_at: new Date().toISOString() })
  if (error) throw error
  set({ sync: 'ok', lastSync: Date.now() })
}

function apply(next: State) {
  applying = true
  try {
    replaceState(next)
  } finally {
    applying = false
  }
}

async function pullMerge(userId: string) {
  set({ sync: 'saving' })
  const { data, error } = await supabase.from('progreso').select('data').eq('user_id', userId).maybeSingle()
  if (error) throw error
  const remote = data ? sanitize(data.data) : null
  const merged = remote ? mergeStates(getState(), remote) : getState()
  apply(merged)
  await push(userId, merged)
}

function guarded<T>(p: Promise<T>) {
  return p.catch(() => set({ sync: 'error' }))
}

function schedulePush() {
  if (!info.userId) return
  clearTimeout(timer)
  timer = setTimeout(() => {
    if (info.userId) void guarded(push(info.userId, getState()))
  }, 1500)
}

/** Sincroniza ya. Con `overwrite` pisa lo guardado en la nube (tras importar un backup o reiniciar). */
export async function pushNow(overwrite = false) {
  if (!info.userId) return
  clearTimeout(timer)
  await guarded(overwrite ? push(info.userId, getState()) : pullMerge(info.userId))
}

async function handleSignedIn(user: { id: string; email?: string | null }) {
  // si en este dispositivo había progreso de OTRA cuenta, no mezclarlo
  const owner = read(OWNER_KEY)
  if (owner && owner !== user.id) apply(fresh())
  write(OWNER_KEY, user.id)
  write(GUEST_KEY, null)
  set({ status: 'in', userId: user.id, email: user.email ?? null, guest: false })
  await guarded(pullMerge(user.id))
}

let started = false
export function initCloud() {
  if (started) return
  started = true
  subscribeState(() => {
    if (!applying) schedulePush()
  })
  supabase.auth.onAuthStateChange((event, session) => {
    // no llamar a supabase de forma síncrona dentro de este callback
    setTimeout(() => {
      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') void handleSignedIn(session.user)
        else set({ status: 'in', userId: session.user.id, email: session.user.email ?? null })
      } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        set({ status: 'out', userId: null, email: null, sync: 'idle' })
      }
    }, 0)
  })
  window.addEventListener('online', () => {
    if (info.userId) void pushNow()
  })
  let last = 0
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && info.userId && Date.now() - last > 30_000) {
      last = Date.now()
      void pushNow()
    }
  })
}

/* ---------- acciones de cuenta ---------- */

const MSG: [RegExp, string][] = [
  [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
  [/already registered|already been registered/i, 'Ese correo ya tiene una cuenta. Probá iniciar sesión.'],
  [/at least \d+ characters/i, 'La contraseña tiene que tener al menos 6 caracteres.'],
  [/email not confirmed/i, 'Primero confirmá tu correo con el enlace que te enviamos.'],
  [/valid email|invalid.*email/i, 'Ese correo no parece válido.'],
  [/rate limit|too many/i, 'Demasiados intentos. Esperá un rato y probá de nuevo.'],
  [/failed to fetch|network/i, 'No hay conexión con el servidor. Revisá tu internet.'],
]
const friendly = (m: string) => MSG.find(([re]) => re.test(m))?.[1] ?? 'No se pudo completar. Probá de nuevo.'

export async function signUp(email: string, password: string): Promise<{ error?: string; confirm?: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: friendly(error.message) }
  // con confirmación de correo activada no hay sesión hasta confirmar
  if (!data.session) return { confirm: true }
  return {}
}

export async function signIn(email: string, password: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? { error: friendly(error.message) } : {}
}

export async function signOut() {
  clearTimeout(timer)
  await supabase.auth.signOut()
  // el progreso queda en este dispositivo, pero deja de sincronizarse
  set({ status: 'out', userId: null, email: null, sync: 'idle' })
}

export function continueAsGuest() {
  write(GUEST_KEY, '1')
  set({ guest: true })
}

export function leaveGuest() {
  write(GUEST_KEY, null)
  set({ guest: false })
}
