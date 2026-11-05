import { BY_ID } from '../data'
import { resetWord, saveRec, useAppState } from '../core/progress'
import { STATUS_LABEL, addDays, statusOf, today } from '../core/srs'
import { Speak, WordFacts } from '../components/ui'

export function WordDetail({ id }: { id: number }) {
  const s = useAppState()
  const w = BY_ID.get(id)
  if (!w) {
    return (
      <div className="screen stack">
        <a className="back-link" href="#/explorar">
          ← Explorar
        </a>
        <p>No encontré esa palabra.</p>
      </div>
    )
  }
  const rec = s.words[w.id]
  const status = statusOf(rec)
  const t = today()

  return (
    <div className="screen stack">
      <a className="back-link" href="#/explorar">
        ← Explorar
      </a>
      <div className="card stack">
        <div className="detail-head">
          <div className="word-big" lang="it">
            {w.italiano}
          </div>
          <Speak text={w.italiano} />
          <div className="translation">{w.espanol}</div>
        </div>
        <WordFacts w={w} />
        {w.ejemplo && (
          <div className="example">
            <span lang="it">{w.ejemplo}</span>
            <Speak text={w.ejemplo} />
          </div>
        )}
      </div>

      <div className="card stack">
        <h2>Mi estado</h2>
        <div>
          <span className="pill">{STATUS_LABEL[status]}</span>
        </div>
        {rec && (
          <p className="muted small">
            {rec.due <= t ? 'Toca repasarla hoy.' : `Próximo repaso: ${rec.due}.`} Vista {rec.reps} {rec.reps === 1 ? 'vez' : 'veces'}, falló {rec.lapses}.
          </p>
        )}
        <div className="btn-row">
          <button
            type="button"
            className="btn"
            onClick={() =>
              saveRec(w.id, { box: 4, due: addDays(t, 16), reps: rec?.reps ?? 0, lapses: rec?.lapses ?? 0, first: rec?.first ?? t, last: t }, false)
            }
          >
            Ya la sé
          </button>
          {rec && (
            <button type="button" className="btn" onClick={() => resetWord(w.id)}>
              Volver a empezar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
