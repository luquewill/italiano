import { useCallback, useMemo, useState } from 'react'
import { BY_ID } from '../data'
import { applyAnswer } from '../core/srs'
import { getState, saveRec } from '../core/progress'
import { makeExercise, type Exercise, type Kind } from '../core/exercises'
import { buildSession, type SessionItem, type SessionMode } from '../core/session'
import { ExerciseView } from '../components/ExerciseView'

// Ejercicios habilitados (se amplía a medida que se construyen).
const ENABLED: ReadonlySet<Kind> | undefined = undefined

export function Session({ mode, onExit }: { mode: SessionMode; onExit: () => void }) {
  const [round, setRound] = useState(0)
  return <Round key={round} mode={mode} onExit={onExit} onAgain={() => setRound((r) => r + 1)} />
}

function Round({ mode, onExit, onAgain }: { mode: SessionMode; onExit: () => void; onAgain: () => void }) {
  const [queue, setQueue] = useState<SessionItem[]>(() => buildSession(getState(), mode))
  const [total] = useState(queue.length)
  const [done, setDone] = useState(0)
  const [turn, setTurn] = useState(0)
  const [failed, setFailed] = useState<number[]>([])
  const [newCount, setNewCount] = useState(0)

  const current = queue[0]
  const exercise: Exercise | null = useMemo(() => {
    if (!current) return null
    const w = BY_ID.get(current.id)!
    return makeExercise(w, getState().words[current.id], { isNew: current.isNew, retry: current.retry }, ENABLED)
  }, [current])

  const onResult = useCallback(
    (correct: boolean) => {
      if (!current || !exercise) return
      const prev = getState().words[current.id]
      const rec = applyAnswer(
        prev,
        correct,
        { isNew: current.isNew, freeNotDue: current.freeNotDue, retry: current.retry },
        exercise.kind,
      )
      saveRec(current.id, rec, current.isNew && mode === 'daily')
      setTurn((t) => t + 1)
      if (correct) {
        if (!current.retry) {
          setDone((d) => d + 1)
          if (current.isNew) setNewCount((n) => n + 1)
        }
        setQueue((q) => q.slice(1))
      } else {
        setFailed((f) => (f.includes(current.id) ? f : [...f, current.id]))
        setQueue((q) => {
          const rest = q.slice(1)
          const at = Math.min(3, rest.length)
          const again: SessionItem = { id: current.id, isNew: false, freeNotDue: false, retry: true }
          return [...rest.slice(0, at), again, ...rest.slice(at)]
        })
      }
    },
    [current, exercise, mode],
  )

  if (!current || !exercise) {
    return (
      <div className="screen">
        <div className="card center stack">
          <h2>{total === 0 ? 'No hay nada para practicar' : 'Sesión terminada'}</h2>
          {total === 0 ? (
            <p className="muted">No tenés repasos vencidos ni palabras nuevas para hoy con estos filtros.</p>
          ) : (
            <p className="muted">
              Repasaste {total} {total === 1 ? 'palabra' : 'palabras'}
              {newCount > 0 && <>, {newCount} nuevas</>}.
            </p>
          )}
          {failed.length > 0 && (
            <div className="left">
              <div className="kicker">Para volver a ver pronto</div>
              <ul className="plain-list">
                {failed.map((id) => {
                  const w = BY_ID.get(id)!
                  return (
                    <li key={id}>
                      <strong>{w.italiano}</strong> <span className="muted">· {w.espanol}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          <div className="btn-row">
            <button type="button" className="btn" onClick={onExit}>
              Volver al inicio
            </button>
            {total > 0 && mode === 'daily' && (
              <button type="button" className="btn primary" onClick={onAgain}>
                Otra tanda
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div className="screen session">
      <div className="session-top">
        <button type="button" className="icon-btn" aria-label="Salir de la sesión" onClick={onExit}>
          ✕
        </button>
        <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="muted small">
          {done}/{total}
        </span>
      </div>
      <ExerciseView key={turn} ex={exercise} isNew={current.isNew} onDone={onResult} />
    </div>
  )
}
