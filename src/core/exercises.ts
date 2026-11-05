import { BY_ESPANOL, SINGLE_FORMS, WORDS, articleOf, isPluralArticle, stripArticle } from '../data'
import type { Rec, Word } from '../types'
import { shuffle } from './normalize'
import { speechAvailable } from './speech'

export type Kind = 'flashcard' | 'choice' | 'typing' | 'article' | 'aux' | 'adj' | 'cloze' | 'listen'

export type Exercise =
  | { kind: 'flashcard'; word: Word }
  | { kind: 'choice'; word: Word; dir: 'it2es' | 'es2it'; options: string[]; answer: string }
  | { kind: 'typing'; word: Word; answers: string[] }
  | { kind: 'article'; word: Word; article: string; plural: string[] | null }
  | { kind: 'aux'; word: Word; auxes: string[]; participio: string }
  | {
      kind: 'adj'
      word: Word
      before: string
      after: string
      answer: string
      /** Solo en modo "forma" (sin frase): qué forma se pide. */
      formLabel: string | null
      options: string[] | null
    }
  | {
      kind: 'cloze'
      word: Word
      before: string
      after: string
      answer: string
      options: string[] | null
    }
  | {
      kind: 'listen'
      word: Word
      what: 'word' | 'sentence'
      mode: 'choice' | 'typing'
      speakText: string
      answers: string[]
      options: string[] | null
    }

/* ---------- utilidades ---------- */

const alts = (it: string) => it.split(/\s+\/\s+/).map((s) => s.trim()).filter(Boolean)
const stripPunct = (s: string) => s.replace(/[!?¡¿.,;:]/g, '').trim()

function distractors(word: Word, n: number, get: (w: Word) => string, exclude: string[] = []): string[] {
  const seen = new Set([get(word), ...exclude].map((s) => s.toLowerCase()))
  const out: string[] = []
  const tiers = [
    WORDS.filter((w) => w.id !== word.id && w.tipo === word.tipo && w.nivel === word.nivel),
    WORDS.filter((w) => w.id !== word.id && w.tipo === word.tipo),
    WORDS.filter((w) => w.id !== word.id),
  ]
  for (const tier of tiers) {
    for (const w of shuffle(tier)) {
      const v = get(w)
      const k = v.toLowerCase()
      if (!v || seen.has(k)) continue
      seen.add(k)
      out.push(v)
      if (out.length >= n) return out
    }
  }
  return out
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/['’]/g, "['’]")

/** Busca en la frase de ejemplo la palabra (o alguna de sus formas) y devuelve el texto partido. */
function findInSentence(
  sentence: string,
  forms: string[],
  stem?: string,
  self?: string,
): { before: string; surface: string; after: string } | null {
  let re: RegExp
  if (stem) {
    re = new RegExp(`(?<![\\p{L}])(${esc(stem)}\\p{L}{0,4})(?![\\p{L}])`, 'iu')
  } else {
    const fs = [...new Set(forms.filter(Boolean))].sort((a, b) => b.length - a.length)
    if (!fs.length) return null
    re = new RegExp(`(?<![\\p{L}])(${fs.map(esc).join('|')})(?![\\p{L}])`, 'iu')
  }
  const m = re.exec(sentence)
  if (!m) return null
  const surface = m[1]
  if (stem && SINGLE_FORMS.has(surface.toLowerCase()) && surface.toLowerCase() !== self) return null
  const before = sentence.slice(0, m.index)
  const after = sentence.slice(m.index + surface.length)
  if (!before.trim() && !after.replace(/[\s.!?¿¡,]/g, '')) return null
  return { before, surface, after }
}

/* ---------- constructores por ejercicio ---------- */

function buildChoice(w: Word, dir: 'it2es' | 'es2it'): Exercise {
  if (dir === 'it2es') {
    const syn = (BY_ESPANOL.get(w.espanol.toLowerCase()) ?? []).map((x) => x.espanol)
    const opts = distractors(w, 3, (x) => x.espanol, syn)
    return { kind: 'choice', word: w, dir, answer: w.espanol, options: shuffle([w.espanol, ...opts]) }
  }
  const syn = (BY_ESPANOL.get(w.espanol.toLowerCase()) ?? []).map((x) => x.italiano)
  const opts = distractors(w, 3, (x) => x.italiano, syn)
  return { kind: 'choice', word: w, dir, answer: w.italiano, options: shuffle([w.italiano, ...opts]) }
}

function buildTyping(w: Word): Exercise {
  const syn = BY_ESPANOL.get(w.espanol.toLowerCase()) ?? [w]
  const answers: string[] = []
  const push = (s: string) => {
    const t = stripPunct(s)
    if (t && !answers.includes(t)) answers.push(t)
  }
  for (const a of alts(w.italiano)) push(a)
  for (const x of syn) {
    for (const a of alts(x.italiano)) {
      push(a)
      push(stripArticle(a))
    }
  }
  push(stripArticle(w.italiano))
  // la primera respuesta es la de la palabra misma
  return { kind: 'typing', word: w, answers: [stripPunct(alts(w.italiano)[0]), ...answers.filter((a) => a !== stripPunct(alts(w.italiano)[0]))] }
}

function nounArticle(w: Word): string | null {
  if (w.tipo !== 'sustantivo' || w.genero === 'masc./fem.') return null
  const a = articleOf(w.italiano)
  if (!a || isPluralArticle(a)) return null
  return a
}

function pluralAnswers(w: Word): string[] | null {
  if (!w.plural || /solo pl/i.test(w.plural)) return null
  return [w.plural, stripArticle(w.plural)]
}

function buildArticle(w: Word): Exercise | null {
  const a = nounArticle(w)
  if (!a) return null
  return { kind: 'article', word: w, article: a, plural: pluralAnswers(w) }
}

function buildAux(w: Word): Exercise | null {
  if (w.tipo !== 'verbo' || !w.auxiliar || !w.participio) return null
  return { kind: 'aux', word: w, auxes: w.auxiliar.split('/').map((s) => s.trim()), participio: w.participio }
}

const ADJ_LABELS = ['masculino singular', 'femenino singular', 'masculino plural', 'femenino plural']

function buildAdj(w: Word, allowChoice: boolean): Exercise | null {
  if (w.tipo !== 'adjetivo' || w.invariable || !w.femenino) return null
  const forms = [w.italiano, w.femenino, w.plural_masculino ?? w.italiano, w.plural_femenino ?? w.femenino]
  const unique = [...new Set(forms.map((f) => f.toLowerCase()))]
  const hit = findInSentence(w.ejemplo, forms)
  if (hit) {
    const options = allowChoice && unique.length >= 3 ? shuffle(unique.map((u) => forms.find((f) => f.toLowerCase() === u)!)) : null
    return { kind: 'adj', word: w, before: hit.before, after: hit.after, answer: hit.surface, formLabel: null, options }
  }
  const candidates = [1, 2, 3].filter((i) => forms[i].toLowerCase() !== forms[0].toLowerCase())
  if (!candidates.length) return null
  const i = candidates[Math.floor(Math.random() * candidates.length)]
  return { kind: 'adj', word: w, before: '', after: '', answer: forms[i], formLabel: ADJ_LABELS[i], options: null }
}

function clozeSplit(w: Word) {
  if (!w.ejemplo) return null
  if (w.tipo === 'verbo') {
    const inf = w.reflexivo && w.italiano.endsWith('si') ? w.italiano.slice(0, -2) + 'e' : w.italiano
    const stem = inf.slice(0, -3)
    if (stem.length < 3) return null
    return findInSentence(w.ejemplo, [], stem, inf.toLowerCase())
  }
  if (w.tipo === 'sustantivo') {
    const forms = [stripArticle(w.italiano)]
    const p = pluralAnswers(w)
    if (p) forms.push(p[1])
    return findInSentence(w.ejemplo, forms)
  }
  if (w.tipo === 'adjetivo') {
    return findInSentence(w.ejemplo, [w.italiano, w.femenino ?? '', w.plural_masculino ?? '', w.plural_femenino ?? ''])
  }
  return findInSentence(w.ejemplo, alts(w.italiano).map(stripPunct))
}

function buildCloze(w: Word, allowChoice: boolean): Exercise | null {
  const hit = clozeSplit(w)
  if (!hit) return null
  const base = (w.tipo === 'sustantivo' ? stripArticle(w.italiano) : w.italiano).toLowerCase()
  let options: string[] | null = null
  if (allowChoice && w.tipo !== 'verbo' && hit.surface.toLowerCase() === base) {
    const d = distractors(w, 3, (x) => (x.tipo === 'sustantivo' ? stripArticle(x.italiano) : x.italiano), [hit.surface])
    options = shuffle([hit.surface, ...d])
  }
  return { kind: 'cloze', word: w, before: hit.before, after: hit.after, answer: hit.surface, options }
}

function buildListen(w: Word, what: 'word' | 'sentence', mode: 'choice' | 'typing'): Exercise | null {
  if (what === 'sentence' && !w.ejemplo) return null
  const speakText = what === 'word' ? w.italiano : w.ejemplo
  if (what === 'word') {
    const answers = [...new Set(alts(w.italiano).flatMap((a) => [stripPunct(a), stripPunct(stripArticle(a))]))]
    const options = mode === 'choice' ? shuffle([w.italiano, ...distractors(w, 3, (x) => x.italiano)]) : null
    return { kind: 'listen', word: w, what, mode, speakText, answers, options }
  }
  const options =
    mode === 'choice'
      ? shuffle([w.ejemplo, ...distractors(w, 3, (x) => x.ejemplo, [w.ejemplo]).filter((s) => s && s !== w.ejemplo)])
      : null
  return { kind: 'listen', word: w, what, mode, speakText, answers: [w.ejemplo], options }
}

/* ---------- selección ---------- */

export interface PickCtx {
  isNew: boolean
  retry: boolean
}

/** Elige y construye el ejercicio de una palabra según su caja y tipo. */
export function makeExercise(w: Word, rec: Rec | undefined, ctx: PickCtx, enabled?: ReadonlySet<Kind>): Exercise {
  const on = (k: Kind) => !enabled || enabled.has(k)
  if (ctx.isNew || !on('choice')) return { kind: 'flashcard', word: w }
  if (ctx.retry) return buildChoice(w, Math.random() < 0.5 ? 'it2es' : 'es2it')

  const box = rec?.box ?? 1
  const low = box <= 2
  const mid = box <= 4
  const speech = speechAvailable()

  const c: { kind: Kind; weight: number; build: () => Exercise | null }[] = []
  const add = (kind: Kind, weight: number, build: () => Exercise | null) => {
    if (weight > 0 && on(kind)) c.push({ kind, weight, build })
  }

  add('flashcard', box >= 5 ? 0.5 : 1, () => ({ kind: 'flashcard', word: w }))
  add('choice', low ? 4 : mid ? 1.5 : 0.5, () => buildChoice(w, Math.random() < (low ? 0.5 : 0.25) ? 'it2es' : 'es2it'))
  add('typing', low ? 0.5 : mid ? 3 : 4, () => buildTyping(w))
  add('article', 2.5, () => buildArticle(w))
  add('aux', 2.5, () => buildAux(w))
  add('adj', 2.5, () => buildAdj(w, low))
  add('cloze', w.tipo === 'verbo' && low ? 0.5 : 2.5, () => buildCloze(w, low))
  if (speech) {
    add('listen', 3, () => {
      const r = Math.random()
      if (low) return buildListen(w, r < 0.65 ? 'word' : 'sentence', 'choice')
      if (mid) return r < 0.4 ? buildListen(w, 'word', 'typing') : buildListen(w, 'sentence', 'choice')
      return r < 0.5 ? buildListen(w, 'word', 'typing') : buildListen(w, 'sentence', 'typing')
    })
  }

  // probar candidatos en orden aleatorio ponderado, evitando repetir el último tipo
  let pool = c.filter((x) => x.kind !== rec?.lastKind)
  if (!pool.length) pool = c
  while (pool.length) {
    const total = pool.reduce((s, x) => s + x.weight, 0)
    let r = Math.random() * total
    let idx = 0
    for (; idx < pool.length; idx++) {
      r -= pool[idx].weight
      if (r <= 0) break
    }
    const pick = pool[Math.min(idx, pool.length - 1)]
    const ex = pick.build()
    if (ex) return ex
    pool = pool.filter((x) => x !== pick)
  }
  return buildChoice(w, 'it2es')
}
