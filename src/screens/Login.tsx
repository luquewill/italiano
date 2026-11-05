import { useState } from 'react'
import { continueAsGuest, signIn, signUp } from '../cloud/sync'
import { Chip } from '../components/ui'

export function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const submit = async () => {
    setError('')
    setInfo('')
    if (!email.trim() || !password) return
    setBusy(true)
    const r = mode === 'in' ? await signIn(email.trim(), password) : await signUp(email.trim(), password)
    setBusy(false)
    if (r.error) setError(r.error)
    else if ('confirm' in r && r.confirm) setInfo('Te enviamos un correo. Confirmalo con el enlace y después iniciá sesión.')
    // si todo salió bien, el estado de sesión cambia solo y se muestra la app
  }

  return (
    <div className="screen login">
      <header className="center stack">
        <h1>Italiano</h1>
        <p className="muted">Entrá para guardar tu progreso y usarlo desde cualquier dispositivo.</p>
      </header>

      <form
        className="card stack"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <div className="chips">
          <Chip active={mode === 'in'} onClick={() => setMode('in')}>
            Iniciar sesión
          </Chip>
          <Chip active={mode === 'up'} onClick={() => setMode('up')}>
            Crear cuenta
          </Chip>
        </div>
        <label className="field">
          <span className="kicker">Correo</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />
        </label>
        <label className="field">
          <span className="kicker">Contraseña</span>
          <input
            type="password"
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'up' ? 'Al menos 6 caracteres' : 'Tu contraseña'}
          />
        </label>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {info && <p role="status">{info}</p>}
        <button type="submit" className="btn primary block" disabled={busy || !email.trim() || !password}>
          {busy ? 'Un momento…' : mode === 'in' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      <button type="button" className="btn block" onClick={continueAsGuest}>
        Seguir sin cuenta
      </button>
      <p className="muted small center">Sin cuenta, el progreso queda solo en este dispositivo. Podés crear una cuenta más tarde desde Ajustes.</p>
    </div>
  )
}
