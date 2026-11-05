import { useEffect, useState } from 'react'
import { Speak, WordFacts } from './ui'
import type { Word } from '../types'

export function Flashcard({ word, isNew, onDone }: { word: Word; isNew: boolean; onDone: (correct: boolean) => void }) {
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (!flipped) {
          e.preventDefault()
          setFlipped(true)
        }
      } else if (flipped && e.key === 'ArrowRight') onDone(true)
      else if (flipped && e.key === 'ArrowLeft') onDone(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [flipped, onDone])

  return (
    <div className="exercise">
      <div className="kicker">{isNew ? 'Palabra nueva' : 'Tarjeta'}</div>
      <div className={`card flash ${flipped ? 'back' : ''}`}>
        <div className="flash-front">
          <div className="word-big">{word.italiano}</div>
          <Speak text={word.italiano} />
        </div>
        {!flipped ? (
          <>
            <p className="muted center">Pensá qué significa y dala vuelta.</p>
            <button type="button" className="btn primary block" onClick={() => setFlipped(true)}>
              Dar vuelta
            </button>
          </>
        ) : (
          <div className="flash-back">
            <div className="translation">{word.espanol}</div>
            <WordFacts w={word} />
            {word.ejemplo && (
              <div className="example">
                <span lang="it">{word.ejemplo}</span>
                <Speak text={word.ejemplo} />
              </div>
            )}
          </div>
        )}
      </div>
      {flipped && (
        <div className="btn-row">
          <button type="button" className="btn danger-outline" onClick={() => onDone(false)}>
            No la sabía
          </button>
          <button type="button" className="btn ok-outline" onClick={() => onDone(true)}>
            La sabía
          </button>
        </div>
      )}
    </div>
  )
}
