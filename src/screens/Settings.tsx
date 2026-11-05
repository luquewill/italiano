import { useRef, useState } from 'react'
import { exportJson, importJson, resetAll, updateSettings, useAppState } from '../core/progress'
import { leaveGuest, pushNow, signOut, useAuth } from '../cloud/sync'
import { speak, speechAvailable } from '../core/speech'
import { today } from '../core/srs'
import { Chip } from '../components/ui'

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n) || lo))

export function Settings() {
  const { settings } = useAppState()
  const auth = useAuth()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `italiano-progreso-${today()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('Backup descargado.')
  }

  const onFile = async (f: File | undefined) => {
    if (!f) return
    const ok = importJson(await f.text())
    setMsg(ok ? 'Progreso importado.' : 'Ese archivo no es un backup válido.')
    if (ok) void pushNow(true)
    if (file.current) file.current.value = ''
  }

  return (
    <div className="screen stack">
      <header>
        <h1>Ajustes</h1>
      </header>

      <section className="card stack">
        <h2>Cuenta</h2>
        {auth.userId ? (
          <>
            <p>
              Sesión iniciada como <strong>{auth.email}</strong>
            </p>
            <p className="muted small" role="status">
              {auth.sync === 'saving' && 'Sincronizando…'}
              {auth.sync === 'ok' && `Progreso sincronizado${auth.lastSync ? ' a las ' + new Date(auth.lastSync).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : ''}.`}
              {auth.sync === 'error' && 'No se pudo sincronizar (¿sin conexión?). Se reintenta solo.'}
              {auth.sync === 'idle' && 'Tu progreso se guarda en tu cuenta.'}
            </p>
            <div className="btn-row">
              <button type="button" className="btn" onClick={() => void pushNow()}>
                Sincronizar ahora
              </button>
              <button type="button" className="btn" onClick={() => void signOut()}>
                Cerrar sesión
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted small">Estás usando la app sin cuenta: el progreso queda solo en este dispositivo.</p>
            <button type="button" className="btn primary" onClick={leaveGuest}>
              Iniciar sesión o crear cuenta
            </button>
          </>
        )}
      </section>

      <section className="card stack">
        <label className="field">
          <span>Repasos máximos por sesión</span>
          <input
            type="number"
            inputMode="numeric"
            min={10}
            max={300}
            value={settings.repasosPorSesion}
            onChange={(e) => updateSettings({ repasosPorSesion: clamp(+e.target.value, 10, 300) })}
          />
        </label>
      </section>

      <section className="card stack">
        <div>
          <div className="kicker">Velocidad de la voz</div>
          <div className="chips">
            <Chip active={settings.velocidad === 'normal'} onClick={() => updateSettings({ velocidad: 'normal' })}>
              Normal
            </Chip>
            <Chip active={settings.velocidad === 'lenta'} onClick={() => updateSettings({ velocidad: 'lenta' })}>
              Lenta
            </Chip>
          </div>
        </div>
        {speechAvailable() ? (
          <button type="button" className="btn" onClick={() => speak('Buongiorno, come stai?')}>
            Probar voz
          </button>
        ) : (
          <p className="muted small">Este navegador no ofrece síntesis de voz; los ejercicios de audio quedan desactivados.</p>
        )}
        <div>
          <div className="kicker">Apariencia</div>
          <div className="chips">
            {(['auto', 'claro', 'oscuro'] as const).map((t) => (
              <Chip key={t} active={settings.tema === t} onClick={() => updateSettings({ tema: t })}>
                {t === 'auto' ? 'Automática' : t === 'claro' ? 'Clara' : 'Oscura'}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <section className="card stack">
        <h2>Datos</h2>
        <p className="muted small">Tu progreso vive solo en este dispositivo. Exportá un backup para guardarlo o pasarlo a otro.</p>
        <div className="btn-row">
          <button type="button" className="btn" onClick={download}>
            Exportar progreso
          </button>
          <button type="button" className="btn" onClick={() => file.current?.click()}>
            Importar progreso
          </button>
        </div>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        {msg && <p className="small" role="status">{msg}</p>}
        <button
          type="button"
          className="btn danger-outline"
          onClick={() => {
            if (window.confirm('¿Borrar todo tu progreso? No se puede deshacer (exportá un backup antes si dudás).')) {
              resetAll()
              void pushNow(true)
              setMsg('Progreso reiniciado.')
            }
          }}
        >
          Reiniciar progreso
        </button>
      </section>
    </div>
  )
}
