import { LESSONS, UNITS, currentLesson } from '../curriculum'
import { NIVELES, TIPOS, WORDS } from '../data'
import { useAppState } from '../core/progress'
import { STATUS_LABEL, statusOf } from '../core/srs'
import type { State, Word, WordStatus } from '../types'

const ORDER: WordStatus[] = ['uso', 'reconozco', 'aprendiendo', 'nueva']

function count(words: Word[], s: State): Record<WordStatus, number> {
  const c: Record<WordStatus, number> = { nueva: 0, aprendiendo: 0, reconozco: 0, uso: 0 }
  for (const w of words) c[statusOf(s.words[w.id])]++
  return c
}

function Bar({ label, c }: { label: string; c: Record<WordStatus, number> }) {
  const total = c.nueva + c.aprendiendo + c.reconozco + c.uso
  return (
    <div className="prog-row">
      <div className="head">
        <span>{label}</span>
        <span className="muted">
          {total - c.nueva} de {total}
        </span>
      </div>
      <div className="stacked" role="img" aria-label={ORDER.map((k) => `${STATUS_LABEL[k]}: ${c[k]}`).join(', ')}>
        {ORDER.filter((k) => k !== 'nueva').map((k) => (
          <div key={k} className={`seg ${k}`} style={{ width: `${total ? (c[k] / total) * 100 : 0}%` }} />
        ))}
      </div>
    </div>
  )
}

export function Progress() {
  const s = useAppState()
  const all = count(WORDS, s)
  const done = new Set(s.path.done)
  const cur = currentLesson(done)
  const faltan = (nivel: string) => {
    const ls = LESSONS.filter((l) => l.nivel === nivel)
    const left = ls.filter((l) => !done.has(l.id))
    const units = UNITS.filter((u) => u.nivel === nivel)
    const unitsLeft = units.filter((u) => !u.lessons.every((l) => done.has(l.id))).length
    return { total: ls.length, left: left.length, units: units.length, unitsLeft }
  }
  return (
    <div className="screen stack">
      <header>
        <h1>Mi progreso</h1>
        <p className="muted">
          {WORDS.length - all.nueva} de {WORDS.length} palabras vistas
        </p>
      </header>

      <section className="card stack">
        <h2>Dónde voy</h2>
        {cur ? (
          <p>
            Unidad {cur.unitIndex + 1} de {UNITS.length} · <strong>{cur.unitTitle}</strong>
            <br />
            <span className="muted">
              {cur.cierre ? 'Lección de cierre' : cur.title} · nivel {cur.nivel}
            </span>
          </p>
        ) : (
          <p>¡Completaste todo el camino!</p>
        )}
        {NIVELES.map((n) => {
          const f = faltan(n)
          return (
            <div key={n} className="prog-row">
              <div className="head">
                <span>{n}</span>
                <span className="muted">
                  {f.left === 0 ? 'terminado' : `faltan ${f.left} lecciones (${f.unitsLeft} ${f.unitsLeft === 1 ? 'unidad' : 'unidades'})`}
                </span>
              </div>
              <div className="stacked">
                <div className="seg uso" style={{ width: `${((f.total - f.left) / f.total) * 100}%` }} />
              </div>
            </div>
          )
        })}
      </section>

      <section className="card stack">
        <div className="legend">
          {ORDER.map((k) => (
            <span key={k}>
              <i className={`dot ${k}`} /> {STATUS_LABEL[k]} · <strong>{all[k]}</strong>
            </span>
          ))}
        </div>
        <Bar label="Todo el vocabulario" c={all} />
      </section>

      <section className="card stack">
        <h2>Por nivel</h2>
        {NIVELES.map((n) => (
          <Bar key={n} label={n} c={count(WORDS.filter((w) => w.nivel === n), s)} />
        ))}
      </section>

      <section className="card stack">
        <h2>Por tipo</h2>
        {TIPOS.map((t) => (
          <Bar key={t} label={t} c={count(WORDS.filter((w) => w.tipo === t), s)} />
        ))}
      </section>
    </div>
  )
}
