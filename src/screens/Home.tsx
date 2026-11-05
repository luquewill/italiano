import { NIVELES, TEMAS, TIPOS } from '../data'
import { updateSettings, useAppState } from '../core/progress'
import { homeCounts } from '../core/session'
import { Chip } from '../components/ui'
import type { Filtros } from '../types'

const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

export function Home({ onStart }: { onStart: (mode: 'daily' | 'free') => void }) {
  const s = useAppState()
  const f = s.settings.filtros
  const c = homeCounts(s)
  const set = (patch: Partial<Filtros>) => updateSettings({ filtros: { ...f, ...patch } })
  const filtered = f.niveles.length + f.tipos.length + f.temas.length > 0
  const nothing = c.due + c.newToday === 0

  return (
    <div className="screen stack">
      <header>
        <h1>Italiano</h1>
        <p className="muted">Vocabulario A1–B1</p>
      </header>

      <section className="card stack">
        <div className="today">
          <div>
            <div className="big-number">{c.due}</div>
            <div className="muted">{c.due === 1 ? 'repaso hoy' : 'repasos hoy'}</div>
          </div>
          <div>
            <div className="big-number">{c.newToday}</div>
            <div className="muted">{c.newToday === 1 ? 'palabra nueva' : 'palabras nuevas'}</div>
          </div>
        </div>
        {filtered && <p className="muted small">Con filtros activos: {c.total} palabras en total.</p>}
        <button type="button" className="btn primary block" disabled={nothing} onClick={() => onStart('daily')}>
          Empezar sesión
        </button>
        {nothing && <p className="muted small center">Por hoy no queda nada pendiente. Podés hacer un repaso libre.</p>}
      </section>

      <section className="card stack">
        <h2>Qué practicar</h2>
        <div>
          <div className="kicker">Nivel</div>
          <div className="chips">
            {NIVELES.map((n) => (
              <Chip key={n} active={f.niveles.includes(n)} onClick={() => set({ niveles: toggle(f.niveles, n) })}>
                {n}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <div className="kicker">Tipo</div>
          <div className="chips">
            {TIPOS.map((t) => (
              <Chip key={t} active={f.tipos.includes(t)} onClick={() => set({ tipos: toggle(f.tipos, t) })}>
                {t}
              </Chip>
            ))}
          </div>
        </div>
        <label className="field">
          <span className="kicker">Tema</span>
          <select
            value={f.temas[0] ?? ''}
            onChange={(e) => set({ temas: e.target.value ? [e.target.value] : [] })}
          >
            <option value="">Todos los temas</option>
            {TEMAS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <div className="btn-row">
          {filtered && (
            <button type="button" className="btn" onClick={() => updateSettings({ filtros: { niveles: [], tipos: [], temas: [] } })}>
              Quitar filtros
            </button>
          )}
          <button type="button" className="btn" disabled={c.total === 0} onClick={() => onStart('free')}>
            Repaso libre (20 palabras)
          </button>
        </div>
        <p className="muted small">
          El repaso libre toma palabras de lo filtrado aunque no estén vencidas; acertarlas no adelanta su fecha.
        </p>
      </section>
    </div>
  )
}
