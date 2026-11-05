import { useEffect, useState } from 'react'
import type { Exercise } from '../core/exercises'
import { stripArticle } from '../data'
import { speak } from '../core/speech'
import { Answer, Options, accentNote, type Checked } from './inputs'
import { Feedback, Reveal, Sentence, Speak } from './ui'

type Done = (correct: boolean) => void
type Ex<K extends Exercise['kind']> = Extract<Exercise, { kind: K }>

/* 2. Elegir la traducción (ambas direcciones) */
export function ChoiceEx({ ex, onDone }: { ex: Ex<'choice'>; onDone: Done }) {
  const [picked, setPicked] = useState<string | null>(null)
  const ok = picked === ex.answer
  const it2es = ex.dir === 'it2es'
  return (
    <div className="exercise">
      <div className="kicker">{it2es ? '¿Qué significa?' : '¿Cómo se dice en italiano?'}</div>
      <div className="prompt" lang={it2es ? 'it' : 'es'}>
        {it2es ? ex.word.italiano : ex.word.espanol}
        {it2es && (
          <>
            {' '}
            <Speak text={ex.word.italiano} />
          </>
        )}
      </div>
      <Options options={ex.options} answer={ex.answer} picked={picked} onPick={setPicked} />
      {picked != null && (
        <Feedback ok={ok} correct={ex.answer} onContinue={() => onDone(ok)}>
          <Reveal w={ex.word} />
        </Feedback>
      )}
    </div>
  )
}

/* 3. Escribir en italiano a partir del español */
export function TypingEx({ ex, onDone }: { ex: Ex<'typing'>; onDone: Done }) {
  const [res, setRes] = useState<Checked | null>(null)
  const noun = ex.word.tipo === 'sustantivo'
  return (
    <div className="exercise">
      <div className="kicker">Escribilo en italiano</div>
      <div className="prompt">{ex.word.espanol}</div>
      <div className="hint">
        {ex.word.tipo}
        {noun && ' · con artículo (si lo olvidás, también vale sin él)'}
      </div>
      <Answer answers={ex.answers} placeholder="en italiano" onChecked={setRes} />
      {res && (
        <Feedback
          ok={res.verdict !== 'wrong'}
          note={accentNote(res)}
          correct={ex.word.italiano}
          onContinue={() => onDone(res.verdict !== 'wrong')}
        >
          <Reveal w={ex.word} />
        </Feedback>
      )}
    </div>
  )
}

/* 4. Sustantivos: artículo + plural */
export function ArticleEx({ ex, onDone }: { ex: Ex<'article'>; onDone: Done }) {
  const [art, setArt] = useState<string | null>(null)
  const [res, setRes] = useState<Checked | null>(null)
  const artOk = art === ex.article
  const bare = stripArticle(ex.word.italiano)
  const finished = art != null && (ex.plural == null || res != null)
  const pluralOk = ex.plural == null ? true : res != null && res.verdict !== 'wrong'
  const ok = artOk && pluralOk
  return (
    <div className="exercise">
      <div className="kicker">{ex.plural ? 'Artículo y plural' : 'Artículo'}</div>
      <div className="prompt">
        {art == null ? bare : ex.word.italiano} <span className="muted small">· {ex.word.espanol}</span>
      </div>
      {art == null && <div className="hint">¿Qué artículo lleva?</div>}
      <Options options={['il', 'lo', 'la', "l'"]} answer={ex.article} picked={art} onPick={setArt} row />
      {art != null && ex.plural && (
        <div className="stack">
          {!res && <div className="hint">Ahora escribí el plural (con su artículo)</div>}
          <Answer answers={ex.plural} placeholder={`plural de ${ex.word.italiano}`} onChecked={setRes} />
        </div>
      )}
      {finished && (
        <Feedback
          ok={ok}
          note={res ? accentNote(res) : undefined}
          correct={`${ex.word.italiano}${ex.plural ? ' → ' + ex.plural[0] : ''}`}
          onContinue={() => onDone(ok)}
        >
          <Reveal w={ex.word} />
        </Feedback>
      )}
    </div>
  )
}

/* 5. Verbos: auxiliar + participio */
export function AuxEx({ ex, onDone }: { ex: Ex<'aux'>; onDone: Done }) {
  const [aux, setAux] = useState<string | null>(null)
  const [res, setRes] = useState<Checked | null>(null)
  const auxOk = aux != null && ex.auxes.includes(aux)
  const finished = aux != null && res != null
  const ok = auxOk && res != null && res.verdict !== 'wrong'
  // para marcar en verde, si el auxiliar elegido es válido lo tomamos como respuesta
  const shownAnswer = aux != null && auxOk ? aux : ex.auxes[0]
  return (
    <div className="exercise">
      <div className="kicker">Passato prossimo</div>
      <div className="prompt">
        {ex.word.italiano} <span className="muted small">· {ex.word.espanol}</span>
      </div>
      {aux == null && <div className="hint">¿Con qué auxiliar se conjuga?</div>}
      <Options options={['avere', 'essere']} answer={shownAnswer} picked={aux} onPick={setAux} row />
      {aux != null && (
        <div className="stack">
          {!res && <div className="hint">Ahora escribí el participio pasado</div>}
          <Answer answers={[ex.participio]} placeholder="participio" onChecked={setRes} />
        </div>
      )}
      {finished && (
        <Feedback
          ok={ok}
          note={res ? accentNote(res) : undefined}
          correct={`${ex.auxes.join(' / ')} + ${ex.participio}`}
          onContinue={() => onDone(ok)}
        >
          <Reveal w={ex.word} />
        </Feedback>
      )}
    </div>
  )
}

/* 6. Adjetivos: completar la forma correcta */
export function AdjEx({ ex, onDone }: { ex: Ex<'adj'>; onDone: Done }) {
  const [picked, setPicked] = useState<string | null>(null)
  const [res, setRes] = useState<Checked | null>(null)
  const ok = ex.options ? picked === ex.answer : res != null && res.verdict !== 'wrong'
  const done = ex.options ? picked != null : res != null
  const fromSentence = ex.formLabel == null
  return (
    <div className="exercise">
      <div className="kicker">Completá con la forma correcta</div>
      {fromSentence ? (
        <>
          <Sentence before={ex.before} after={ex.after} fill={done ? ex.answer : undefined} ok={ok} />
          <div className="hint">
            adjetivo: <strong lang="it">{ex.word.italiano}</strong> · {ex.word.espanol}
          </div>
        </>
      ) : (
        <div className="prompt">
          <span lang="it">{ex.word.italiano}</span>
          <div className="hint">({ex.word.espanol})</div>
          <div className="hint">
            Escribí el <strong>{ex.formLabel}</strong>
          </div>
        </div>
      )}
      {ex.options ? (
        <Options options={ex.options} answer={ex.answer} picked={picked} onPick={setPicked} />
      ) : (
        <Answer answers={[ex.answer]} placeholder="forma del adjetivo" onChecked={setRes} />
      )}
      {done && (
        <Feedback ok={ok} note={res ? accentNote(res) : undefined} correct={ex.answer} onContinue={() => onDone(ok)}>
          <Reveal w={ex.word} />
        </Feedback>
      )}
    </div>
  )
}

/* 7. Completar el ejemplo con la palabra tapada */
export function ClozeEx({ ex, onDone }: { ex: Ex<'cloze'>; onDone: Done }) {
  const [picked, setPicked] = useState<string | null>(null)
  const [res, setRes] = useState<Checked | null>(null)
  const ok = ex.options ? picked === ex.answer : res != null && res.verdict !== 'wrong'
  const done = ex.options ? picked != null : res != null
  const verb = ex.word.tipo === 'verbo'
  return (
    <div className="exercise">
      <div className="kicker">Completá la frase</div>
      <Sentence before={ex.before} after={ex.after} fill={done ? ex.answer : undefined} ok={ok} />
      <div className="hint">
        {ex.word.espanol}
        {verb && (
          <>
            {' '}
            · conjugá <strong lang="it">{ex.word.italiano}</strong>
          </>
        )}
      </div>
      {ex.options ? (
        <Options options={ex.options} answer={ex.answer} picked={picked} onPick={setPicked} />
      ) : (
        <Answer answers={[ex.answer]} placeholder="la palabra que falta" onChecked={setRes} />
      )}
      {done && (
        <Feedback ok={ok} note={res ? accentNote(res) : undefined} correct={ex.answer} onContinue={() => onDone(ok)}>
          <Reveal w={ex.word} />
        </Feedback>
      )}
    </div>
  )
}

/* 8. Escuchar */
export function ListenEx({ ex, onDone }: { ex: Ex<'listen'>; onDone: Done }) {
  const [picked, setPicked] = useState<string | null>(null)
  const [res, setRes] = useState<Checked | null>(null)
  useEffect(() => {
    const t = setTimeout(() => speak(ex.speakText), 250)
    return () => clearTimeout(t)
  }, [ex.speakText])

  const answer = ex.what === 'word' ? ex.word.italiano : ex.word.ejemplo
  const ok = ex.options ? picked === answer : res != null && res.verdict !== 'wrong'
  const done = ex.options ? picked != null : res != null
  return (
    <div className="exercise">
      <div className="kicker">{ex.what === 'word' ? 'Escuchá la palabra' : 'Escuchá la frase'}</div>
      <div className="listen-big">
        <Speak text={ex.speakText} />
      </div>
      <div className="hint">{ex.options ? '¿Qué escuchaste?' : 'Escribí lo que escuchaste'}</div>
      {ex.options ? (
        <Options options={ex.options} answer={answer} picked={picked} onPick={setPicked} />
      ) : (
        <Answer answers={ex.answers} placeholder="lo que escuchaste" onChecked={setRes} />
      )}
      {done && (
        <Feedback ok={ok} note={res ? accentNote(res) : undefined} correct={answer} onContinue={() => onDone(ok)}>
          <Reveal w={ex.word} />
        </Feedback>
      )}
    </div>
  )
}
