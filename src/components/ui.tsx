import type { ReactNode } from 'react'
import { speak, speechAvailable } from '../core/speech'
import type { Word, WordStatus } from '../types'

export function Speak({ text, className = '' }: { text: string; className?: string }) {
  if (!speechAvailable()) return null
  return (
    <span className={`speak ${className}`}>
      <button type="button" className="icon-btn" aria-label="Escuchar" title="Escuchar" onClick={() => speak(text, false)}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H3v6h3l5 4V5z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      </button>
      <button type="button" className="icon-btn slow" aria-label="Escuchar despacio" title="Escuchar despacio" onClick={() => speak(text, true)}>
        lento
      </button>
    </span>
  )
}

export function Feedback({
  ok,
  note,
  correct,
  children,
  onContinue,
  continueLabel = 'Continuar',
}: {
  ok: boolean
  note?: string
  /** Texto de la respuesta correcta (se muestra cuando falló, o con acento faltante). */
  correct?: ReactNode
  children?: ReactNode
  onContinue: () => void
  continueLabel?: string
}) {
  return (
    <div className={`feedback ${ok ? 'ok' : 'bad'}`} role="status" aria-live="polite">
      <div className="feedback-title">{ok ? (note ? 'Bien, pero…' : 'Correcto') : 'Incorrecto'}</div>
      {note && <div className="feedback-note">{note}</div>}
      {correct != null && (!ok || note) && (
        <div className="feedback-answer">
          <span className="label">Respuesta:</span> <strong>{correct}</strong>
        </div>
      )}
      {children}
      <button type="button" className="btn primary block" autoFocus onClick={onContinue}>
        {continueLabel}
      </button>
    </div>
  )
}

/** Palabra revelada tras responder: italiano, traducción y frase de ejemplo con audio. */
export function Reveal({ w }: { w: Word }) {
  return (
    <div className="reveal">
      <div>
        <strong lang="it">{w.italiano}</strong> <span className="muted">· {w.espanol}</span> <Speak text={w.italiano} />
      </div>
      {w.ejemplo && (
        <div className="example">
          <span lang="it">{w.ejemplo}</span>
          <Speak text={w.ejemplo} />
        </div>
      )}
    </div>
  )
}

/** Frase con hueco; `fill` rellena el hueco una vez respondido. */
export function Sentence({ before, after, fill, ok }: { before: string; after: string; fill?: string; ok?: boolean }) {
  return (
    <p className="sentence" lang="it">
      {before}
      {fill != null ? (
        <strong className={ok ? 'fill-ok' : 'fill-bad'}>{fill}</strong>
      ) : (
        <span className="blank" aria-label="hueco" />
      )}
      {after}
    </p>
  )
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`chip ${active ? 'active' : ''}`} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  )
}

export function StatusDot({ status }: { status: WordStatus }) {
  return <span className={`dot ${status}`} aria-hidden="true" />
}

export function WordFacts({ w }: { w: Word }) {
  const rows: [string, ReactNode][] = [
    ['Tipo', w.tipo],
    ['Nivel', w.nivel],
    ['Tema', w.tema],
  ]
  if (w.tipo === 'sustantivo') {
    if (w.genero) rows.push(['Género', w.genero])
    if (w.plural) rows.push(['Plural', w.plural])
  }
  if (w.tipo === 'verbo') {
    if (w.auxiliar) rows.push(['Auxiliar', w.auxiliar])
    if (w.participio) rows.push(['Participio', w.participio])
    if (w.presente) rows.push(['Presente', w.presente])
    if (w.reflexivo) rows.push(['Reflexivo', 'sí'])
  }
  if (w.tipo === 'adjetivo') {
    if (w.invariable) rows.push(['Formas', 'invariable'])
    else {
      if (w.femenino) rows.push(['Femenino', w.femenino])
      if (w.plural_masculino) rows.push(['Plural masc.', w.plural_masculino])
      if (w.plural_femenino) rows.push(['Plural fem.', w.plural_femenino])
    }
  }
  return (
    <dl className="facts">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}
