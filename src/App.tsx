import { useEffect, useState, type ReactNode } from 'react'
import { useAppState } from './core/progress'
import { Explore } from './screens/Explore'
import { Home } from './screens/Home'
import { Progress } from './screens/Progress'
import { Session } from './screens/Session'
import { Settings } from './screens/Settings'
import { WordDetail } from './screens/WordDetail'

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash.replace(/^#\/?/, ''))
  useEffect(() => {
    const h = () => {
      setHash(window.location.hash.replace(/^#\/?/, ''))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])
  return hash
}

export const go = (path: string) => {
  window.location.hash = '/' + path
}

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)

const TABS: { to: string; label: string; icon: ReactNode }[] = [
  { to: '', label: 'Inicio', icon: icon(<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />) },
  { to: 'explorar', label: 'Explorar', icon: icon(<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>) },
  { to: 'progreso', label: 'Progreso', icon: icon(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />) },
  { to: 'ajustes', label: 'Ajustes', icon: icon(<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>) },
]

export default function App() {
  const hash = useHash()
  const { settings } = useAppState()

  useEffect(() => {
    const r = document.documentElement
    if (settings.tema === 'auto') r.removeAttribute('data-theme')
    else r.dataset.theme = settings.tema === 'claro' ? 'light' : 'dark'
  }, [settings.tema])

  const [name = '', param = ''] = hash.split('/')

  if (name === 'sesion') {
    return <Session mode={param === 'free' ? 'free' : 'daily'} onExit={() => go('')} />
  }

  let screen: ReactNode
  let active = name
  switch (name) {
    case 'explorar':
      screen = <Explore />
      break
    case 'palabra':
      screen = <WordDetail id={Number(param)} />
      active = 'explorar'
      break
    case 'progreso':
      screen = <Progress />
      break
    case 'ajustes':
      screen = <Settings />
      break
    default:
      screen = <Home onStart={(m) => go('sesion/' + m)} />
      active = ''
  }

  return (
    <div className="app">
      <main>{screen}</main>
      <nav className="nav" aria-label="Principal">
        <div className="nav-inner">
          {TABS.map((t) => (
            <a key={t.to} href={`#/${t.to}`} className={active === t.to ? 'active' : ''} aria-current={active === t.to ? 'page' : undefined}>
              {t.icon}
              {t.label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}
