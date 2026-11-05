export const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Minúsculas, sin puntuación, apóstrofes unificados, espacios colapsados. Conserva los acentos. */
export function clean(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.,;:!?¡¿"()«»…]/g, ' ')
    .replace(/\s*'\s*/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export type Verdict = 'ok' | 'accent' | 'wrong'

/**
 * Compara lo escrito contra una o varias respuestas válidas.
 * 'ok' = exacta (sin importar mayúsculas), 'accent' = bien salvo acentos, 'wrong' = mal.
 */
export function judge(input: string, targets: string[]): { verdict: Verdict; target: string } {
  const i = clean(input)
  let accentHit: string | null = null
  for (const t of targets) {
    const c = clean(t)
    if (!c) continue
    if (i === c) return { verdict: 'ok', target: t }
    if (i && stripAccents(i) === stripAccents(c)) accentHit ??= t
  }
  if (accentHit) return { verdict: 'accent', target: accentHit }
  return { verdict: 'wrong', target: targets[0] ?? '' }
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
