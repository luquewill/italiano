import { useMemo, useState } from 'react'
import { NIVELES, TEMAS, TIPOS, WORDS } from '../data'
import { stripAccents } from '../core/normalize'
import { updateSettings, useAppState } from '../core/progress'
import { learnedSet } from '../core/session'
import { statusOf } from '../core/srs'
import { StatusDot } from '../components/ui'

const PAGE = 60
const norm = (s: string) => stripAccents(s.toLowerCase())

export function Explore() {
  const s = useAppState()
  const [q, setQ] = useState('')
  const [nivel, setNivel] = useState('')
  const [tipo, setTipo] = useState('')
  const [tema, setTema] = useState('')
  const [shown, setShown] = useState(PAGE)

  const list = useMemo(() => {
    const nq = norm(q.trim())
    return WORDS.filter(
      (w) =>
        (!nivel || w.nivel === nivel) &&
        (!tipo || w.tipo === tipo) &&
        (!tema || w.tema === tema) &&
        (!nq || norm(w.italiano).includes(nq) || norm(w.espanol).includes(nq) || norm(w.ejemplo).includes(nq)),
    )
  }, [q, nivel, tipo, tema])

  const learned = useMemo(() => learnedSet(s), [s])
  const practicable = list.filter((w) => learned.has(w.id)).length
  const practice = () => {
    updateSettings({ filtros: { niveles: nivel ? [nivel] : [], tipos: tipo ? [tipo] : [], temas: tema ? [tema] : [] } })
    window.location.hash = '/sesion/free'
  }

  const reset = (fn: () => void) => {
    fn()
    setShown(PAGE)
  }

  return (
    <div className="screen stack">
      <header>
        <h1>Explorar</h1>
        <p className="muted">{list.length} palabras</p>
      </header>

      <input
        type="search"
        className="search"
        placeholder="Buscar en italiano o español"
        value={q}
        onChange={(e) => reset(() => setQ(e.target.value))}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <div className="filters">
        <select aria-label="Nivel" value={nivel} onChange={(e) => reset(() => setNivel(e.target.value))}>
          <option value="">Nivel</option>
          {NIVELES.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <select aria-label="Tipo" value={tipo} onChange={(e) => reset(() => setTipo(e.target.value))}>
          <option value="">Tipo</option>
          {TIPOS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select aria-label="Tema" value={tema} onChange={(e) => reset(() => setTema(e.target.value))}>
          <option value="">Tema</option>
          {TEMAS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="card stack">
        <div>
          <strong>Práctica libre</strong>
          <p className="muted small">
            Practicá con las palabras de lecciones que ya hiciste, usando estos filtros. No cambia el orden del camino.
          </p>
        </div>
        <button type="button" className="btn" disabled={practicable === 0} onClick={practice}>
          {practicable === 0 ? 'Sin palabras aprendidas con estos filtros' : `Practicar estas palabras (${Math.min(20, practicable)})`}
        </button>
      </div>

      <div className="list">
        {list.slice(0, shown).map((w) => (
          <a key={w.id} className="row-item" href={`#/palabra/${w.id}`}>
            <StatusDot status={statusOf(s.words[w.id])} />
            <div className="row-main">
              <strong lang="it">{w.italiano}</strong>
              <div className="muted">{w.espanol}</div>
            </div>
            <span className="row-meta">
              {w.nivel} · {w.tipo}
            </span>
          </a>
        ))}
        {list.length === 0 && <div className="row-item muted">No hay resultados.</div>}
      </div>
      {shown < list.length && (
        <button type="button" className="btn" onClick={() => setShown((n) => n + PAGE)}>
          Mostrar más ({list.length - shown} restantes)
        </button>
      )}
    </div>
  )
}
