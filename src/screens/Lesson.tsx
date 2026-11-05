import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LESSONS, LESSON_BY_ID, lessonStatus } from '../curriculum'
import { BY_ID } from '../data'
import { shuffle } from '../core/normalize'
import { completeLesson, getState } from '../core/progress'
import { applyAnswer, today } from '../core/srs'
import { makeLessonExercise, makeRetryExercise, type Exercise, type Kind, type Level } from '../core/exercises'
import { ExerciseView } from '../components/ExerciseView'
import { Speak, WordFacts } from '../components/ui'
import type { Rec, Word } from '../types'

interface Item {
  id: number
  level: Level
  retry: boolean
}

function buildQueue(words: Word[], reinforcement: Word[], cierre: boolean): Item[] {
  if (cierre) {
    return shuffle(words).map((w) => ({ id: w.id, level: (Math.random() < 0.5 ? 2 : 3) as Level, retry: false }))
  }
  const r2 = [...words, ...reinforcement.slice(0, 2)]
  const r3 = [...words, ...reinforcement.slice(2)]
  const mk = (arr: Word[], level: Level): Item[] => shuffle(arr).map((w) => ({ id: w.id, level, retry: false }))
  return [...mk(words, 1), ...mk(r2, 2), ...mk(r3, 3)]
}

function finalRec(prev: Rec | undefined, missed: boolean): Rec {
  const t = today()
  if (missed) {
    const r1 = applyAnswer(prev, false, { isNew: !prev, freeNotDue: false, retry: false }, 'leccion')
    return applyAnswer(r1, true, { isNew: false, freeNotDue: false, retry: true }, 'leccion')
  }
  if (!prev) return applyAnswer(undefined, true, { isNew: true, freeNotDue: false, retry: false }, 'leccion')
  return applyAnswer(prev, true, { isNew: false, freeNotDue: prev.due > t, retry: false }, 'leccion')
}

export function Lesson({ lessonId, onExit, onNext }: { lessonId: string; onExit: () => void; onNext: (id: string) => void }) {
  const lesson = LESSON_BY_ID.get(lessonId)
  const done = new Set(getState().path.done)
  if (!lesson || lessonStatus(lesson, done) === 'locked') {
    return (
      <div className="screen stack">
        <div className="card center stack">
          <h2>Esta lección todavía está bloqueada</h2>
          <p className="muted">Completá las lecciones anteriores para desbloquearla.</p>
          <button type="button" className="btn primary" onClick={onExit}>
            Volver al camino
          </button>
        </div>
      </div>
    )
  }
  return <LessonRun key={lessonId} lessonId={lessonId} onExit={onExit} onNext={onNext} />
}

function LessonRun({ lessonId, onExit, onNext }: { lessonId: string; onExit: () => void; onNext: (id: string) => void }) {
  const lesson = LESSON_BY_ID.get(lessonId)!
  const words = useMemo(() => [...new Map(lesson.words.map((id) => [id, BY_ID.get(id)!])).values()], [lesson])

  // refuerzo: unas pocas palabras de las dos lecciones anteriores ya hechas
  const reinforcement = useMemo(() => {
    if (lesson.cierre) return []
    const doneSet = new Set(getState().path.done)
    const prev = LESSONS.filter((l) => !l.cierre && l.index < lesson.index && doneSet.has(l.id)).slice(-2)
    const own = new Set(lesson.words)
    const ids = [...new Set(prev.flatMap((l) => l.words))].filter((id) => !own.has(id))
    return shuffle(ids).slice(0, 4).map((id) => BY_ID.get(id)!)
  }, [lesson])

  const [phase, setPhase] = useState<'intro' | 'practice' | 'done'>(lesson.cierre ? 'practice' : 'intro')
  const [queue, setQueue] = useState<Item[]>(() => buildQueue(words, reinforcement, lesson.cierre))
  const [total, setTotal] = useState(queue.length)
  const [answered, setAnswered] = useState(0)
  const [turn, setTurn] = useState(0)
  const [failed, setFailed] = useState<number[]>([])
  const lastKind = useRef(new Map<number, Kind>())

  const current = queue[0]
  const exercise: Exercise | null = useMemo(() => {
    if (phase !== 'practice' || !current) return null
    const w = BY_ID.get(current.id)!
    return current.retry ? makeRetryExercise(w) : makeLessonExercise(w, current.level, lastKind.current.get(current.id))
  }, [phase, current])

  const finish = useCallback(
    (failedIds: number[]) => {
      const missed = new Set(failedIds)
      const ids = [...new Set([...words.map((w) => w.id), ...reinforcement.map((w) => w.id)])]
      const recs: Record<number, Rec> = {}
      const state = getState()
      for (const id of ids) recs[id] = finalRec(state.words[id], missed.has(id))
      completeLesson(lesson.id, recs)
      setPhase('done')
    },
    [words, reinforcement, lesson.id],
  )

  const onResult = useCallback(
    (correct: boolean) => {
      if (!current || !exercise) return
      lastKind.current.set(current.id, exercise.kind)
      setTurn((t) => t + 1)
      if (correct) {
        if (!current.retry) setAnswered((a) => a + 1)
        if (queue.length === 1) finish(failed)
        else setQueue((q) => q.slice(1))
        if (queue.length === 1) setQueue([])
      } else {
        const nextFailed = failed.includes(current.id) ? failed : [...failed, current.id]
        setFailed(nextFailed)
        // vuelve al final de la lección hasta que la acierte
        setTotal((n) => n + 1)
        setQueue((q) => [...q.slice(1), { id: current.id, level: 1, retry: true }])
      }
    },
    [current, exercise, queue.length, failed, finish],
  )

  const exit = () => {
    if (phase === 'done' || window.confirm('¿Salir de la lección? Se pierde el avance de esta práctica.')) onExit()
  }

  const next = LESSONS[lesson.index + 1]
  const header = `${lesson.unitTitle} · ${lesson.cierre ? 'Lección de cierre' : lesson.title}`

  if (phase === 'intro') {
    return (
      <div className="screen session">
        <div className="session-top">
          <button type="button" className="icon-btn" aria-label="Salir" onClick={exit}>
            ✕
          </button>
          <span className="muted small grow">{header}</span>
        </div>
        <Intro words={words} onStart={() => setPhase('practice')} />
      </div>
    )
  }

  if (phase === 'done') {
    const hard = failed.map((id) => BY_ID.get(id)!)
    return (
      <div className="screen">
        <div className="card center stack">
          <div className="done-mark" aria-hidden="true">
            ✓
          </div>
          <h2>{lesson.cierre ? 'Unidad terminada' : 'Lección completada'}</h2>
          <p className="muted">{header}</p>
          {hard.length > 0 ? (
            <div className="left">
              <div className="kicker">Las que más te costaron</div>
              <ul className="plain-list">
                {hard.map((w) => (
                  <li key={w.id}>
                    <strong lang="it">{w.italiano}</strong> <span className="muted">· {w.espanol}</span>
                  </li>
                ))}
              </ul>
              <p className="muted small">Las vas a volver a ver en tus repasos.</p>
            </div>
          ) : (
            <p className="muted">No fallaste ninguna palabra.</p>
          )}
          <div className="btn-row">
            <button type="button" className="btn" onClick={onExit}>
              Volver al camino
            </button>
            {next && (
              <button type="button" className="btn primary" onClick={() => onNext(next.id)}>
                Siguiente lección
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!current || !exercise) return null
  const pct = total ? Math.round((answered / total) * 100) : 0
  return (
    <div className="screen session">
      <div className="session-top">
        <button type="button" className="icon-btn" aria-label="Salir" onClick={exit}>
          ✕
        </button>
        <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ExerciseView key={turn} ex={exercise} isNew={false} onDone={onResult} />
    </div>
  )
}

/** Presentación de las palabras nuevas, una por una. */
function Intro({ words, onStart }: { words: Word[]; onStart: () => void }) {
  const [i, setI] = useState(0)
  const w = words[i]
  const last = i === words.length - 1

  const go = useCallback(() => {
    if (last) onStart()
    else setI((n) => n + 1)
  }, [last, onStart])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go()
      else if (e.key === 'ArrowLeft') setI((n) => Math.max(0, n - 1))
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [go])

  return (
    <div className="exercise">
      <div className="kicker">
        Palabra nueva · {i + 1} de {words.length}
      </div>
      <div className="card flash back">
        <div className="flash-front">
          <div className="word-big" lang="it">
            {w.italiano}
          </div>
          <Speak text={w.italiano} />
        </div>
        <div className="flash-back">
          <div className="translation">{w.espanol}</div>
          <WordFacts w={w} />
          {w.ejemplo && (
            <div className="example">
              <span lang="it">{w.ejemplo}</span>
              <Speak text={w.ejemplo} />
            </div>
          )}
        </div>
      </div>
      <div className="btn-row">
        {i > 0 && (
          <button type="button" className="btn" onClick={() => setI(i - 1)}>
            Anterior
          </button>
        )}
        <button type="button" className="btn primary" autoFocus onClick={go}>
          {last ? 'Empezar práctica' : 'Siguiente'}
        </button>
      </div>
    </div>
  )
}
