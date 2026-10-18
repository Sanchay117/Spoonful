import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}

const crc32 = (buf) => {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const encodePng = (size, pixels) => {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0;
    pixels.copy(raw, y * (1 + size * 4) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function paint(size, { spoonScale = 1 }) {
  const px = Buffer.alloc(size * size * 4);
  const s = size / 512;
  const cx = 256;
  const bowlY = 186;
  const bowlRx = 62 * spoonScale;
  const bowlRy = 76 * spoonScale;
  const handleTop = bowlY + 64 * spoonScale;
  const handleBottom = 414 * (lerp(1, 0.86, spoonScale - 1) || 1) - (spoonScale - 1) * 256;
  const handleR = 17 * spoonScale;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = x / s;
      const fy = y / s;

      const t = clamp01((fx + fy) / 1024);
      let r = lerp(42, 74, t);
      let g = lerp(37, 46, t);
      let b = lerp(87, 82, t);

      const gd = Math.hypot(fx - 256, fy - 215) / 210;
      if (gd < 1) {
        const glow = (1 - gd) ** 2 * 0.16;
        r = lerp(r, 255, glow);
        g = lerp(g, 205, glow);
        b = lerp(b, 160, glow);
      }

      const ex = (fx - cx) / bowlRx;
      const ey = (fy - bowlY) / bowlRy;
      const q = Math.hypot(ex, ey);
      const bowlA = clamp01((1 - q) * Math.min(bowlRx, bowlRy) * 0.9 + 0.5);

      const vx = fx - cx;
      const vy = fy - handleTop;
      const hy = Math.max(0, Math.min(1, handleBottom === handleTop ? 0 : (fy - handleTop) / (handleBottom - handleTop)));
      const px2 = cx;
      const py2 = handleTop + hy * (handleBottom - handleTop);
      const segDist = Math.hypot(fx - px2, fy - py2);
      const handleA = fy >= handleTop - handleR && fy <= handleBottom + handleR ? clamp01((handleR - segDist) + 0.5) : 0;

      const creamA = Math.max(bowlA, handleA);
      r = lerp(r, 246, creamA);
      g = lerp(g, 231, creamA);
      b = lerp(b, 211, creamA);

      const i = (y * size + x) * 4;
      px[i] = Math.round(r);
      px[i + 1] = Math.round(g);
      px[i + 2] = Math.round(b);
      px[i + 3] = 255;
    }
  }
  return px;
}

const out = (file) => resolve(process.cwd(), 'public', file);
mkdirSync(dirname(out('icon-192.png')), { recursive: true });

writeFileSync(out('icon-192.png'), encodePng(192, paint(192, { spoonScale: 1 })));
writeFileSync(out('icon-512.png'), encodePng(512, paint(512, { spoonScale: 1 })));
writeFileSync(out('icon-maskable-512.png'), encodePng(512, paint(512, { spoonScale: 0.78 })));
writeFileSync(out('apple-touch-icon.png'), encodePng(180, paint(180, { spoonScale: 0.9 })));
console.log('icons written');
