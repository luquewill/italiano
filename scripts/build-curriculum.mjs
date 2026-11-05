// Genera src/data/curriculum.json a partir del vocabulario (que no se modifica).
// Uso: node scripts/build-curriculum.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const vocab = JSON.parse(readFileSync('src/data/vocabulario.json', 'utf8')).palabras

// Palabras de "En la mesa y el restaurante" (A1), sacadas de la unidad de comida.
const MESA = [
  'avere fame', 'avere sete', 'cenare', 'cucinare', 'fare colazione', 'ordinare', 'pranzare',
  'il bar', 'il bicchiere', 'la bottiglia', 'la cena', 'la colazione', 'il coltello', 'il conto',
  'il cucchiaio', 'la fame', 'la forchetta', 'il menù', 'il piatto', 'la pizzeria', 'il pranzo',
  'il ristorante', 'la sete', 'la tazza',
]
const NUMEROS = [
  'zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci',
  'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici', 'diciassette', 'diciotto',
  'diciannove', 'venti', 'ventuno', 'trenta', 'quaranta', 'cinquanta', 'sessanta', 'settanta',
  'ottanta', 'novanta', 'cento', 'duecento', 'mille', 'duemila', 'mezzo',
]

// fuente: "tema" | "tema:tipo,tipo" | "tema:!tipo" | "tema@mesa" (solo MESA) | "tema@!mesa" (sin MESA)
const PLAN = {
  A1: [
    ['Saludos, cortesía y celebraciones', ['saludos', 'cortesía', 'deseos', 'celebraciones']],
    ['Números', ['números', 'ordinales'], NUMEROS],
    ['Pronombres y verbos básicos', ['pronombres', 'posesivos', 'demostrativos', 'indefinidos', 'básicos:verbo'],
      ['essere', 'avere', 'stare', 'fare', 'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro', 'volere', 'potere', 'dovere']],
    ['Familia y relaciones', ['familia', 'relaciones']],
    ['Personas y carácter', ['personas', 'carácter']],
    ['Preguntas y palabras de enlace', ['preguntas', 'conectores', 'preposiciones']],
    ['Cosas y palabras de todos los días', ['básicos:!verbo', 'cambio', 'vida']],
    ['Colores y descripciones', ['colores', 'descripción']],
    ['Cantidad, frecuencia y lugar', ['cantidad', 'frecuencia', 'lugar', 'modo', 'opinión']],
    ['La casa y la tecnología', ['casa', 'tecnología']],
    ['Comida y bebida', ['comida@!mesa']],
    ['En la mesa y el restaurante', ['comida@mesa']],
    ['Compras, ropa y dinero', ['compras', 'ropa', 'dinero']],
    ['La ciudad y la naturaleza', ['ciudad', 'naturaleza']],
    ['Transporte y viajes', ['transporte', 'viajes', 'movimiento']],
    ['Días, meses y calendario', ['calendario']],
    ['La hora, el tiempo y el clima', ['tiempo', 'clima']],
    ['Rutina diaria y la mente', ['rutina', 'mente', 'percepción']],
    ['Comunicación y reacciones', ['comunicación', 'conversación', 'reacciones']],
    ['Estudio y trabajo', ['estudio', 'trabajo']],
    ['Tiempo libre y deporte', ['tiempo libre', 'deporte']],
    ['Cuerpo, salud y emociones', ['cuerpo', 'salud', 'emociones']],
  ],
  A2: [
    ['Expresiones y conversación', ['conversación', 'cortesía', 'reacciones', 'saludos', 'deseos', 'celebraciones']],
    ['Lo básico: verbos y cosas', ['básicos:!adjetivo', 'cambio', 'vida', 'percepción']],
    ['Personas y relaciones', ['personas', 'familia', 'relaciones', 'sociedad']],
    ['Comida y bebida', ['comida']],
    ['Compras, ropa y dinero', ['compras', 'ropa', 'dinero']],
    ['La casa', ['casa']],
    ['Ciudad, transporte y viajes', ['ciudad', 'transporte', 'viajes', 'movimiento']],
    ['Tiempo y rutina', ['tiempo', 'calendario', 'rutina']],
    ['Cuerpo y salud', ['salud', 'cuerpo']],
    ['Trabajo, estudio y trámites', ['trabajo', 'estudio', 'trámites']],
    ['Tiempo libre, deporte y naturaleza', ['tiempo libre', 'deporte', 'naturaleza', 'clima']],
    ['Comunicación y tecnología', ['comunicación', 'tecnología']],
    ['Adjetivos y descripciones', ['básicos:adjetivo', 'descripción', 'colores', 'carácter']],
    ['Emociones y mente', ['emociones', 'mente']],
    ['Pronombres, preposiciones y enlaces', ['pronombres', 'posesivos', 'indefinidos', 'preposiciones', 'conectores', 'números']],
    ['Adverbios y opiniones', ['cantidad', 'frecuencia', 'lugar', 'modo', 'opinión']],
  ],
  B1: [
    ['Verbos y acciones', ['básicos:verbo', 'cambio', 'movimiento']],
    ['Cosas y cualidades', ['básicos:!verbo', 'descripción', 'colores', 'rutina']],
    ['Casa, ciudad y compras', ['casa', 'ciudad', 'compras', 'ropa']],
    ['Comida, dinero y vida cotidiana', ['comida', 'dinero', 'vida']],
    ['Viajes, trámites y tiempo', ['viajes', 'transporte', 'trámites', 'tiempo']],
    ['Naturaleza, clima y tiempo libre', ['naturaleza', 'clima', 'deporte', 'tiempo libre']],
    ['Cuerpo, salud y percepción', ['salud', 'cuerpo', 'percepción']],
    ['Personas y relaciones', ['relaciones', 'familia', 'personas']],
    ['Emociones', ['emociones']],
    ['Mente y carácter', ['mente', 'carácter']],
    ['Comunicación y tecnología', ['comunicación', 'tecnología']],
    ['Estudio y trabajo', ['estudio', 'trabajo']],
    ['Sociedad', ['sociedad']],
    ['Conectores y palabras de enlace', ['conectores', 'preposiciones', 'pronombres', 'posesivos', 'demostrativos', 'indefinidos', 'preguntas', 'relativos', 'números']],
    ['Opinar y conversar', ['cantidad', 'frecuencia', 'lugar', 'modo', 'opinión', 'conversación', 'cortesía', 'reacciones', 'deseos', 'celebraciones']],
  ],
}

function matches(w, src) {
  let [tema, resto] = src.split(/[:@]/)
  const isMesa = src.includes('@')
  if (w.tema !== tema) return false
  if (isMesa) {
    const mesa = MESA.includes(w.italiano)
    return src.includes('@!') ? !mesa : mesa
  }
  if (src.includes(':')) {
    const neg = resto.startsWith('!')
    const tipos = resto.replace('!', '').split(',')
    return neg ? !tipos.includes(w.tipo) : tipos.includes(w.tipo)
  }
  return true
}

/** Mezcla los tipos de forma proporcional y pone primero las palabras "ancla". */
function ordenar(words, primero = []) {
  const pin = primero.map((it) => words.find((w) => w.italiano === it)).filter(Boolean)
  const rest = words.filter((w) => !pin.includes(w))
  const porTipo = new Map()
  for (const w of rest) porTipo.set(w.tipo, [...(porTipo.get(w.tipo) ?? []), w])
  const keyed = []
  for (const arr of porTipo.values()) arr.forEach((w, i) => keyed.push({ w, k: (i + 0.5) / arr.length }))
  keyed.sort((a, b) => a.k - b.k)
  return [...pin, ...keyed.map((x) => x.w)]
}

/** Tamaños de lección entre 8 y 10 (o lo más cerca posible). */
function tamanos(n) {
  if (n <= 10) return [n]
  let best = null
  for (let k = 1; k <= n; k++) {
    const lo = Math.floor(n / k)
    const hi = Math.ceil(n / k)
    const dev = Math.max(0, 8 - lo) + Math.max(0, hi - 10)
    const score = dev * 100 + Math.abs(n / k - 9)
    if (!best || score < best.score) best = { k, score }
  }
  const base = Math.floor(n / best.k)
  const extra = n % best.k
  return Array.from({ length: best.k }, (_, i) => base + (i < extra ? 1 : 0))
}

const usados = new Set()
const unidades = []
const avisos = []
const MAXU = 60 // una unidad con más palabras se parte en partes

/** Reparte las palabras de una unidad en partes de hasta MAXU, sin cortar un tema si no hace falta. */
function partir(listas) {
  const total = listas.reduce((n, l) => n + l.length, 0)
  if (total <= MAXU) return [listas.flat()]
  const bloques = []
  for (const l of listas) {
    if (l.length <= MAXU - 10) bloques.push(l)
    else {
      const k = Math.ceil(l.length / 50)
      const t = Math.ceil(l.length / k)
      for (let i = 0; i < l.length; i += t) bloques.push(l.slice(i, i + t))
    }
  }
  const partes = [[]]
  for (const bl of bloques) {
    const cur = partes[partes.length - 1]
    if (cur.length && cur.length + bl.length > MAXU) partes.push([...bl])
    else cur.push(...bl)
  }
  // una parte final muy chica se junta con la anterior si no queda enorme
  if (partes.length > 1 && partes[partes.length - 1].length < 16) {
    const ult = partes.pop()
    if (partes[partes.length - 1].length + ult.length <= MAXU + 12) partes[partes.length - 1].push(...ult)
    else partes.push(ult)
  }
  return partes
}

let nUnidad = 0
for (const nivel of ['A1', 'A2', 'B1']) {
  for (const [titulo, fuentes, primero] of PLAN[nivel]) {
    const delNivel = vocab.filter((w) => w.nivel === nivel)
    const asignadas = new Set()
    const listas = fuentes.map((src) => {
      const l = delNivel.filter((w) => !asignadas.has(w.id) && matches(w, src))
      l.forEach((w) => asignadas.add(w.id))
      return l
    })
    const partes = partir(listas)
    partes.forEach((words, pi) => {
      nUnidad++
      for (const w of words) {
        if (usados.has(w.id)) avisos.push(`Duplicada: ${w.italiano} (${nivel})`)
        usados.add(w.id)
      }
      const ordered = ordenar(words, pi === 0 ? primero : [])
      const id = `${nivel}-${String(nUnidad).padStart(2, '0')}`
      const lecciones = []
      let i = 0
      tamanos(ordered.length).forEach((t, li) => {
        lecciones.push({ id: `${id}-L${li + 1}`, titulo: `Lección ${li + 1}`, palabras: ordered.slice(i, i + t).map((w) => w.id) })
        i += t
      })
      lecciones.push({ id: `${id}-cierre`, titulo: 'Lección de cierre', cierre: true, palabras: ordered.map((w) => w.id) })
      const tit = partes.length > 1 ? `${titulo} (${pi + 1}/${partes.length})` : titulo
      unidades.push({ id, nivel, titulo: tit, total: ordered.length, lecciones })
    })
  }
}
for (const w of vocab) if (!usados.has(w.id)) avisos.push(`Sin unidad: ${w.italiano} (${w.nivel}/${w.tema}/${w.tipo})`)

writeFileSync('src/data/curriculum.json', JSON.stringify({ version: 1, unidades }, null, 1))

let n = 0
for (const u of unidades) {
  n++
  const sizes = u.lecciones.filter((l) => !l.cierre).map((l) => l.palabras.length)
  console.log(`${String(n).padStart(2)}. [${u.nivel}] ${u.titulo} — ${u.total} palabras, ${sizes.length} lecciones (${sizes.join('/')}) + cierre`)
}
const tot = (nv) => unidades.filter((u) => u.nivel === nv).reduce((s, u) => s + u.lecciones.length, 0)
console.log(`Palabras cubiertas: ${usados.size}/${vocab.length}`)
console.log(`Lecciones por nivel (con cierres): A1 ${tot('A1')}, A2 ${tot('A2')}, B1 ${tot('B1')}`)
if (avisos.length) console.log('AVISOS:\n' + avisos.join('\n'))
