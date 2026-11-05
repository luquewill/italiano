# Italiano · vocabulario A1–B1

App personal (Vite + React + TypeScript, sin backend) para aprender ~1.970 palabras con repetición espaciada. PWA instalable y offline.

## Correrla

Requiere Node.js 20+ (`winget install OpenJS.NodeJS.LTS` en Windows).

```bash
npm install
npm run dev
```

Abrí la URL que muestra (por defecto http://localhost:5173). Para probarla en el celular en la misma red Wi‑Fi: `npm run dev -- --host` y abrí la IP que imprime (la voz y la instalación como PWA requieren HTTPS, así que eso se prueba mejor ya publicada).

```bash
npm run build     # genera dist/
npm run preview   # sirve dist/ para probar la PWA
```

## Publicarla gratis

Es un sitio estático (`dist/`), con rutas por hash, así que no necesita reglas de reescritura.

**Netlify (lo más fácil):**
1. `npm run build`
2. Entrá a https://app.netlify.com/drop y arrastrá la carpeta `dist`.
3. Te da una URL `https://algo.netlify.app`.

**Vercel:** subí el proyecto a GitHub, en vercel.com → *Add New Project* → importalo. Framework: Vite (build `npm run build`, salida `dist`).

## Usarla desde el celular

1. Abrí la URL en Chrome (Android) o Safari (iPhone).
2. Android: menú ⋮ → *Instalar app*. iPhone: Compartir → *Agregar a pantalla de inicio*.
3. Abrila una vez con internet; después funciona offline.

El progreso se guarda **en cada dispositivo** (localStorage). Para pasarlo de la compu al celular: *Ajustes → Exportar progreso* y en el otro dispositivo *Importar progreso*. Hacé backups de vez en cuando, sobre todo antes de limpiar los datos del navegador.

La voz usa la Web Speech API con it-IT: depende de las voces instaladas en el dispositivo (en Android/iOS suele venir una italiana).

## Cómo funciona

- **Datos**: `src/data/vocabulario.json` (fuente, no se modifica).
- **Repetición espaciada** (`src/core/srs.ts`): Leitner de 5 cajas, intervalos 1 · 3 · 7 · 16 · 35 días.
  - Acierto: sube una caja (una palabra nueva que sabías arranca en la caja 2).
  - Fallo: vuelve a la caja 1, queda vencida hoy y reaparece dentro de la misma sesión (unas 3 palabras después) con un ejercicio fácil.
  - Estados: sin registro = nueva · cajas 1–2 aprendiendo · 3–4 la reconozco · 5 la uso.
- **Sesión diaria**: primero repasos vencidos (máx. configurable), después palabras nuevas (15/día por defecto).
- **Repaso libre**: 20 palabras de lo filtrado aunque no estén vencidas; acertar no adelanta la fecha, fallar sí las baja.
- **Ejercicios** (`src/core/exercises.ts`): tarjeta, elegir traducción (ambas direcciones), escribir en italiano, artículo + plural, auxiliar + participio, forma del adjetivo, completar el ejemplo, escuchar. Cajas bajas → más reconocimiento; cajas altas → más producción.
- **Progreso guardado** en `localStorage` bajo la clave `italiano-progreso-v1`.

Los íconos de la PWA se regeneran con `node scripts/make-icons.mjs`.
