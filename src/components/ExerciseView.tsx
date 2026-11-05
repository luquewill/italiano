import type { Exercise } from '../core/exercises'
import { AdjEx, ArticleEx, AuxEx, ChoiceEx, ClozeEx, ListenEx, TypingEx } from './exercises'
import { Flashcard } from './Flashcard'

export function ExerciseView({ ex, isNew, onDone }: { ex: Exercise; isNew: boolean; onDone: (correct: boolean) => void }) {
  switch (ex.kind) {
    case 'flashcard':
      return <Flashcard word={ex.word} isNew={isNew} onDone={onDone} />
    case 'choice':
      return <ChoiceEx ex={ex} onDone={onDone} />
    case 'typing':
      return <TypingEx ex={ex} onDone={onDone} />
    case 'article':
      return <ArticleEx ex={ex} onDone={onDone} />
    case 'aux':
      return <AuxEx ex={ex} onDone={onDone} />
    case 'adj':
      return <AdjEx ex={ex} onDone={onDone} />
    case 'cloze':
      return <ClozeEx ex={ex} onDone={onDone} />
    case 'listen':
      return <ListenEx ex={ex} onDone={onDone} />
  }
}
