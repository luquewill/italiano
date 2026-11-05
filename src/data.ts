import raw from './data/vocabulario.json'
import type { Word } from './types'

export const WORDS: Word[] = (raw as unknown as { palabras: Word[] }).palabras
export const BY_ID = new Map<number, Word>(WORDS.map((w) => [w.id, w]))

export const NIVELES = ['A1', 'A2', 'B1'] as const
export const TIPOS = [...new Set(WORDS.map((w) => w.tipo))]
export const TEMAS = [...new Set(WORDS.map((w) => w.tema))].sort((a, b) => a.localeCompare(b, 'es'))

const ARTICLE_RE = /^(il|lo|la|l'|i|gli|le)(?=\s|[a-zà-ü])/i

/** Artículo inicial de un sustantivo ("la carta" → "la"), o null si no tiene. */
export function articleOf(it: string): string | null {
  if (/^l'/i.test(it)) return "l'"
  const m = it.match(/^(il|lo|la|i|gli|le)\s/i)
  return m ? m[1].toLowerCase() : null
}

export function stripArticle(it: string): string {
  const a = articleOf(it)
  if (!a) return it
  return it.slice(a.length).trim()
}

export const isPluralArticle = (a: string | null) => a === 'i' || a === 'gli' || a === 'le'

export { ARTICLE_RE }

/** Palabras que comparten la misma traducción al español (para aceptar sinónimos al escribir). */
export const BY_ESPANOL = new Map<string, Word[]>()
for (const w of WORDS) {
  const k = w.espanol.toLowerCase()
  const arr = BY_ESPANOL.get(k)
  if (arr) arr.push(w)
  else BY_ESPANOL.set(k, [w])
}

export const SINGLE_FORMS = new Set(WORDS.map((w) => stripArticle(w.italiano).toLowerCase()))
