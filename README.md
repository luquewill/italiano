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

- **Camino ascendente** (pantalla de inicio): 53 unidades (A1 → A2 → B1) con 8–10 palabras por lección y una lección de cierre por unidad. Se avanza en orden; las lecciones hechas se pueden repetir. El currículo está en `src/data/curriculum.json` y se regenera con `node scripts/build-curriculum.mjs` (el vocabulario no se modifica).
- **Lección**: presentación palabra por palabra → práctica de fácil a difícil (reconocer → elegir/completar → escribir) con las palabras de la lección más unas pocas de las dos anteriores. Lo que fallás vuelve al final hasta que lo aciertes. Al terminar se desbloquea la siguiente.
- **Repaso** (`src/core/srs.ts`): Leitner de 5 cajas (1 · 3 · 7 · 16 · 35 días), solo con palabras de lecciones ya hechas. Aparece como sugerencia arriba del camino.
- **Práctica libre**: en Explorar, con filtros de nivel/tipo/tema, sobre palabras ya aprendidas.
- **Progreso guardado** en `localStorage` (`italiano-progreso-v1`); los backups anteriores a la versión con camino se importan sin problema (empiezan en la primera lección).

Los íconos de la PWA se regeneran con `node scripts/make-icons.mjs`.
