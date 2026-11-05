import { useEffect } from 'react'
import { UNITS, currentLesson, lessonStatus, type LessonInfo, type UnitInfo } from '../curriculum'
import { useAppState } from '../core/progress'
import { dueWords } from '../core/session'

const OFFSETS = [0, 46, 72, 46, 0, -46, -72, -46]

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)
const ICONS = {
  done: 'M5 12.5 10 17.5 19 7.5',
  current: 'M8 5.5v13l11-6.5z',
  locked: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  cierre: 'M6 21V4M6 4h12l-2.5 4L18 12H6',
}

function Node({ lesson, status, onOpen }: { lesson: LessonInfo; status: 'done' | 'current' | 'locked'; onOpen: (id: string) => void }) {
  const label = `${lesson.unitTitle}, ${lesson.cierre ? 'lección de cierre' : lesson.title}${status === 'done' ? ', completada' : status === 'locked' ? ', bloqueada' : ', actual'}`
  const icon = status === 'locked' ? ICONS.locked : lesson.cierre && status !== 'done' ? ICONS.cierre : status === 'done' ? ICONS.done : ICONS.current
  return (
    <div className="node-row" style={{ transform: `translateX(${OFFSETS[lesson.index % OFFSETS.length]}px)` }}>
      <button
        type="button"
        className={`node ${status} ${lesson.cierre ? 'cierre' : ''}`}
        aria-label={label}
        disabled={status === 'locked'}
        onClick={() => onOpen(lesson.id)}
        data-current={status === 'current' ? '' : undefined}
      >
        <Icon d={icon} />
      </button>
      {status === 'current' && (
        <div className="node-tip">
          {lesson.cierre ? 'Lección de cierre' : lesson.title} · {lesson.words.length} palabras
        </div>
      )}
    </div>
  )
}

function UnitBlock({ unit, done, onOpen }: { unit: UnitInfo; done: ReadonlySet<string>; onOpen: (id: string) => void }) {
  const finished = unit.lessons.every((l) => done.has(l.id))
  const first = UNITS.findIndex((u) => u.nivel === unit.nivel) === unit.index
  return (
    <section className="unit" aria-label={unit.titulo}>
      {[...unit.lessons].reverse().map((l) => (
        <Node key={l.id} lesson={l} status={lessonStatus(l, done)} onOpen={onOpen} />
      ))}
      <header className={`unit-head ${finished ? 'finished' : ''}`}>
        <div className="unit-kicker">
          Unidad {unit.index + 1} · {unit.nivel}
        </div>
        <div className="unit-title">{unit.titulo}</div>
        <div className="unit-meta">{unit.total} palabras</div>
      </header>
      {first && <div className="level-banner">Nivel {unit.nivel}</div>}
    </section>
  )
}

export function Home({ onOpenLesson, onReview }: { onOpenLesson: (id: string) => void; onReview: () => void }) {
  const s = useAppState()
  const done = new Set(s.path.done)
  const cur = currentLesson(done)
  const due = dueWords(s).length

  // el camino es ascendente: al entrar, centrar la lección actual (abajo del todo si recién empezás)
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    const toCurrent = () => {
      const el = document.querySelector('[data-current]')
      if (el) el.scrollIntoView({ block: 'center' })
      else window.scrollTo(0, 0)
    }
    toCurrent()
    const t = setTimeout(toCurrent, 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="path-screen">
      <div className="path-top">
        <div className="path-top-row">
          <h1>Italiano</h1>
          {cur && (
            <div className="path-where">
              <span className="badge">{cur.nivel}</span> Unidad {cur.unitIndex + 1}
            </div>
          )}
        </div>
        {due > 0 && (
          <button type="button" className="review-banner" onClick={onReview}>
            <span>
              Repaso del día · <strong>{due}</strong> {due === 1 ? 'palabra' : 'palabras'}
            </span>
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>

      <div className="path">
        {!cur && <p className="path-end">¡Terminaste todo el camino! Podés repetir cualquier lección.</p>}
        {[...UNITS].reverse().map((u) => (
          <UnitBlock key={u.id} unit={u} done={done} onOpen={onOpenLesson} />
        ))}
      </div>

      {cur && (
        <div className="continue-bar">
          <button type="button" className="btn primary big" onClick={() => onOpenLesson(cur.id)}>
            Continuar
            <span className="continue-sub">
              {cur.unitTitle} · {cur.cierre ? 'Cierre' : cur.title}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
