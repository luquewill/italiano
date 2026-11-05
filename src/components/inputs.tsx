import { useState } from 'react'
import { judge, type Verdict } from '../core/normalize'

export interface Checked {
  verdict: Verdict
  target: string
  input: string
}

/** Campo de texto con botón "Comprobar"; tolera mayúsculas y acentos (avisa si faltó uno). */
export function Answer({
  answers,
  placeholder = 'Escribí tu respuesta',
  onChecked,
}: {
  answers: string[]
  placeholder?: string
  onChecked: (r: Checked) => void
}) {
  const [value, setValue] = useState('')
  const [res, setRes] = useState<Checked | null>(null)

  const submit = () => {
    if (res || !value.trim()) return
    const j = judge(value, answers)
    const r = { ...j, input: value }
    setRes(r)
    onChecked(r)
  }

  const cls = res ? (res.verdict === 'wrong' ? 'bad' : 'ok') : ''
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <input
        type="text"
        className={`answer-input ${cls}`}
        value={value}
        placeholder={placeholder}
        readOnly={!!res}
        autoFocus
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        lang="it"
        onChange={(e) => setValue(e.target.value)}
      />
      {!res && (
        <button type="submit" className="btn primary block" disabled={!value.trim()}>
          Comprobar
        </button>
      )}
    </form>
  )
}

export const accentNote = (r: Checked) => (r.verdict === 'accent' ? `Ojo con los acentos: se escribe «${r.target}».` : undefined)

/** Lista de opciones; tras responder marca la correcta en verde y la elegida (si falló) en rojo. */
export function Options({
  options,
  answer,
  picked,
  onPick,
  row = false,
}: {
  options: string[]
  answer: string
  picked: string | null
  onPick: (o: string) => void
  row?: boolean
}) {
  return (
    <div className={`options ${row ? 'row' : ''}`}>
      {options.map((o) => {
        let cls = ''
        if (picked != null) {
          if (o === answer) cls = 'correct'
          else if (o === picked) cls = 'wrong'
        }
        return (
          <button key={o} type="button" className={`option ${cls}`} disabled={picked != null} onClick={() => onPick(o)}>
            {o}
          </button>
        )
      })}
    </div>
  )
}
