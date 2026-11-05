import { getState } from './progress'

export const speechAvailable = () => typeof window !== 'undefined' && 'speechSynthesis' in window

let voice: SpeechSynthesisVoice | null = null

function pickVoice() {
  if (!speechAvailable()) return
  const voices = window.speechSynthesis.getVoices()
  voice =
    voices.find((v) => v.lang === 'it-IT' && /google|natural|premium|enhanced/i.test(v.name)) ??
    voices.find((v) => v.lang === 'it-IT') ??
    voices.find((v) => v.lang.toLowerCase().startsWith('it')) ??
    null
}

if (speechAvailable()) {
  pickVoice()
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice)
}

/** Pronuncia texto en italiano. `slow` fuerza velocidad lenta; si no, se usa el ajuste. */
export function speak(text: string, slow?: boolean) {
  if (!speechAvailable()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text.replace(/\s\/\s/g, ', '))
  u.lang = 'it-IT'
  if (voice) u.voice = voice
  const lenta = slow ?? getState().settings.velocidad === 'lenta'
  u.rate = lenta ? 0.55 : 0.95
  synth.speak(u)
}
