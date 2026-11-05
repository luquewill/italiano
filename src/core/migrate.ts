import { LESSONS } from '../curriculum'
import mig from '../data/migracion.json'
import type { Rec } from '../types'

/** Versión de los datos del vocabulario/currículo (v2 = base de 2.921 palabras). */
export const DATA_VERSION = 2

interface Mig {
  ids: Record<string, number>
  lecciones: Record<string, number[]>
  cierres: Record<string, number[]>
}
const M = mig as unknown as Mig

function newer(a: Rec, b: Rec): Rec {
  if (a.last !== b.last) return a.last > b.last ? a : b
  return a.reps >= b.reps ? a : b
}

/** Pasa los registros por palabra de los ids viejos (v1) a los nuevos (v2). */
export function migrateWords(words: Record<number, Rec>): Record<number, Rec> {
  const out: Record<number, Rec> = {}
  for (const [k, r] of Object.entries(words)) {
    const nid = M.ids[k]
    if (nid == null) continue
    out[nid] = out[nid] ? newer(r, out[nid]) : r
  }
  return out
}

/**
 * Traduce las lecciones completadas del currículo v1 al v2:
 *  - una lección nueva cuenta como hecha si TODAS sus palabras estaban aprendidas;
 *  - un cierre nuevo cuenta como hecho si algún cierre viejo completado incluía todas las palabras de su unidad.
 */
export function migrateDone(done: string[]): string[] {
  const learned = new Set<number>()
  const cierres: Set<number>[] = []
  for (const id of done) {
    M.lecciones[id]?.forEach((w) => learned.add(w))
    if (M.cierres[id]) cierres.push(new Set(M.cierres[id]))
  }
  const out: string[] = []
  for (const l of LESSONS) {
    if (l.cierre) {
      if (cierres.some((c) => l.words.every((w) => c.has(w)))) out.push(l.id)
    } else if (l.words.every((w) => learned.has(w))) out.push(l.id)
  }
  return out
}
