import type { Rec, WordStatus } from '../types'

/** Días hasta el próximo repaso según la caja (1..5). */
export const INTERVALS = [0, 1, 3, 7, 16, 35]

export function today(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return today(new Date(y, m - 1, d + n))
}

export function statusOf(rec: Rec | undefined): WordStatus {
  if (!rec) return 'nueva'
  if (rec.box <= 2) return 'aprendiendo'
  if (rec.box <= 4) return 'reconozco'
  return 'uso'
}

export const STATUS_LABEL: Record<WordStatus, string> = {
  nueva: 'Nueva',
  aprendiendo: 'Aprendiendo',
  reconozco: 'La reconozco',
  uso: 'La uso',
}

export interface AnswerCtx {
  /** Palabra sin registro previo. */
  isNew: boolean
  /** Práctica libre fuera de calendario: acertar no adelanta la fecha. */
  freeNotDue: boolean
  /** Reintento dentro de la misma sesión tras un fallo. */
  retry: boolean
}

/**
 * Aplica una respuesta al registro de la palabra (Leitner):
 *  - acierto: sube una caja y se espacia (palabra nueva que se sabe: arranca en caja 2)
 *  - fallo: vuelve a caja 1 y queda vencida hoy (se repite en la sesión)
 *  - reintento acertado: no sube de caja; el repaso queda para mañana
 */
export function applyAnswer(prev: Rec | undefined, correct: boolean, ctx: AnswerCtx, kind: string, now = today()): Rec {
  const base: Rec = prev ?? { box: 0, due: now, reps: 0, lapses: 0, first: now, last: now }
  const rec: Rec = { ...base, last: now, lastKind: kind }

  if (ctx.retry) {
    if (correct) rec.due = addDays(now, 1)
    return rec
  }
  if (!correct) {
    rec.box = 1
    rec.due = now
    rec.lapses += 1
    rec.reps += 1
    return rec
  }
  if (ctx.freeNotDue) {
    return rec
  }
  rec.reps += 1
  rec.box = ctx.isNew ? 2 : Math.min(5, Math.max(1, base.box) + 1)
  rec.due = addDays(now, INTERVALS[rec.box])
  return rec
}
