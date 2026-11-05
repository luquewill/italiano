// Genera los íconos PNG de la PWA sin dependencias: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const BG = [0xff, 0x7a, 0x00]
const FG = [0x11, 0x11, 0x11]

function crc32(buf) {
  let c, crc = ~0
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return ~crc >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

// Dibuja una "i": punto + barra, en un cuadrado (redondeado o a sangre para maskable).
function icon(size, { rounded, scale }) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  const r = rounded ? size * 0.22 : 0
  const cx = size / 2
  const u = (size * scale) / 64 // unidades del diseño 64x64 centrado
  const off = (size - 64 * u) / 2
  const inRR = (x, y, x0, y0, w, h, rad) => {
    if (x < x0 || x > x0 + w || y < y0 || y > y0 + h) return false
    const dx = Math.max(x0 + rad - x, 0, x - (x0 + w - rad))
    const dy = Math.max(y0 + rad - y, 0, y - (y0 + h - rad))
    return dx * dx + dy * dy <= rad * rad
  }
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const p = y * (size * 4 + 1) + 1 + x * 4
      const inside = inRR(x + 0.5, y + 0.5, 0, 0, size, size, r)
      let col = BG
      const dot = (x + 0.5 - cx) ** 2 + (y + 0.5 - (off + 17 * u)) ** 2 <= (5.5 * u) ** 2
      const bar = inRR(x + 0.5, y + 0.5, off + 27 * u, off + 26 * u, 10 * u, 26 * u, 3 * u)
      if (dot || bar) col = FG
      raw[p] = col[0]; raw[p + 1] = col[1]; raw[p + 2] = col[2]; raw[p + 3] = inside ? 255 : 0
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', icon(192, { rounded: true, scale: 1 }))
writeFileSync('public/icons/icon-512.png', icon(512, { rounded: true, scale: 1 }))
writeFileSync('public/icons/icon-maskable-512.png', icon(512, { rounded: false, scale: 0.7 }))
console.log('Íconos generados en public/icons')
