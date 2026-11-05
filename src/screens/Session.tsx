import { useCallback, useMemo, useState } from 'react'
import { BY_ID } from '../data'
import { applyAnswer } from '../core/srs'
import { getState, saveRec } from '../core/progress'
import { makeExercise, type Exercise } from '../core/exercises'
import { buildSession, type SessionItem, type SessionMode } from '../core/session'
import { ExerciseView } from '../components/ExerciseView'

/** Repaso espaciado (o práctica libre) con palabras de lecciones ya hechas. */
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

  const current = queue[0]
  const exercise: Exercise | null = useMemo(() => {
    if (!current) return null
    const w = BY_ID.get(current.id)!
    return makeExercise(w, getState().words[current.id], { isNew: false, retry: current.retry })
  }, [current])

  const onResult = useCallback(
    (correct: boolean) => {
      if (!current || !exercise) return
      const prev = getState().words[current.id]
      const rec = applyAnswer(
        prev,
        correct,
        { isNew: !prev, freeNotDue: current.freeNotDue, retry: current.retry },
        exercise.kind,
      )
      saveRec(current.id, rec, false)
      setTurn((t) => t + 1)
      if (correct) {
        if (!current.retry) setDone((d) => d + 1)
        setQueue((q) => q.slice(1))
      } else {
        setFailed((f) => (f.includes(current.id) ? f : [...f, current.id]))
        setQueue((q) => {
          const rest = q.slice(1)
          const at = Math.min(3, rest.length)
          const again: SessionItem = { id: current.id, freeNotDue: false, retry: true }
          return [...rest.slice(0, at), again, ...rest.slice(at)]
        })
      }
    },
    [current, exercise],
  )

  if (!current || !exercise) {
    return (
      <div className="screen">
        <div className="card center stack">
          <h2>{total === 0 ? 'No hay nada para repasar' : 'Repaso terminado'}</h2>
          {total === 0 ? (
            <p className="muted">
              {mode === 'review'
                ? 'No tenés repasos vencidos. Seguí con la próxima lección del camino.'
                : 'No hay palabras ya aprendidas con esos filtros. Completá lecciones para practicarlas acá.'}
            </p>
          ) : (
            <p className="muted">
              Repasaste {total} {total === 1 ? 'palabra' : 'palabras'}.
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
              Volver
            </button>
            {total > 0 && mode === 'review' && (
              <button type="button" className="btn primary" onClick={onAgain}>
                Seguir repasando
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
        <button type="button" className="icon-btn" aria-label="Salir" onClick={onExit}>
          ✕
        </button>
        <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="muted small">
          {done}/{total}
        </span>
      </div>
      <ExerciseView key={turn} ex={exercise} isNew={false} onDone={onResult} />
    </div>
  )
}
