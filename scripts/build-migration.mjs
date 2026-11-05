// Genera src/data/migracion.json: empareja el vocabulario v1 con el v2 (por italiano + tipo)
// y traduce las lecciones del currículo v1 a ids de palabras v2.
// Uso: node scripts/build-migration.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const rd = (p) => JSON.parse(readFileSync(p, 'utf8'))
const v1 = rd('scripts/legacy/vocabulario_v1.json').palabras
const v2 = rd('scripts/legacy/vocabulario_v2.json').palabras
const cur1 = rd('scripts/legacy/curriculum_v1.json').unidades

const key = (w) => `${w.italiano}|${w.tipo}`
const nuevo = new Map(v2.map((w) => [key(w), w.id]))

const ids = {}
const sinPar = []
for (const w of v1) {
  const n = nuevo.get(key(w))
  if (n == null) sinPar.push(w.italiano)
  else ids[w.id] = n
}

const lecciones = {}
const cierres = {}
for (const u of cur1) {
  for (const l of u.lecciones) {
    const mapped = l.palabras.map((id) => ids[id]).filter((x) => x != null)
    if (l.cierre) cierres[l.id] = mapped
    else lecciones[l.id] = mapped
  }
}

writeFileSync('src/data/migracion.json', JSON.stringify({ ids, lecciones, cierres }))
console.log(`Palabras emparejadas: ${Object.keys(ids).length}/${v1.length}`)
if (sinPar.length) console.log('Sin pareja:', sinPar.join(', '))
console.log(`Lecciones: ${Object.keys(lecciones).length}, cierres: ${Object.keys(cierres).length}`)
