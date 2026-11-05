import { createClient } from '@supabase/supabase-js'

// Datos públicos del proyecto: la clave "publishable" está pensada para ir en el navegador.
// La seguridad la da la regla por usuario (RLS) de la tabla `progreso`.
export const SUPABASE_URL = 'https://wjlocjokhkdqigakdequ.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_LrFnXEYAs647LwaF9LfqeA_D3NduXBM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
})
