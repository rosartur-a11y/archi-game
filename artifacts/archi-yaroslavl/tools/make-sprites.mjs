#!/usr/bin/env node
// ============================================================
// ПУТЬ ARCHI — обрезка фона персонажей (v3, только диагностика)
// Запуск: node tools/make-sprites.mjs [--tol N] [--preview]
//
// ВАЖНО: этот скрипт НИКОГДА не трогает оригиналы level-*.png.
// Он пишет только новые файлы .sprite.png (прозрачные спрайты).
// Основной способ вырезания фона — tools/cutout-bg.py (rembg/u2net):
//   PYTHONPATH=/tmp/rembg U2NET_HOME=/tmp/u2net python3 tools/cutout-bg.py
// Этот JS-скрипт — резервный flood-fill метод и генератор превью.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const IMG_DIR = path.join(ROOT, "public", "images", "archi");
const FILES = ["level-01.png", "level-10.png", "level-20.png", "level-30.png"];

const args = process.argv.slice(2);
const tolArg = args.indexOf("--tol");
const TOL = tolArg >= 0 ? Number(args[tolArg + 1]) : 80;
const PREVIEW = args.includes("--preview");

// ---------------- PNG decode/encode ----------------
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function decodePng(file) {
  const b = fs.readFileSync(file);
  let off = 8;
  let w = 0, h = 0;
  const idat = [];
  while (off < b.length) {
    const len = b.readUInt32BE(off);
    const type = b.toString("ascii", off + 4, off + 8);
    if (type === "IHDR") { w = b.readUInt32BE(off + 8); h = b.readUInt32BE(off + 12); }
    if (type === "IDAT") idat.push(b.slice(off + 8, off + 8 + len));
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = w * bpp;
  const data = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride);
  let rs = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[rs];
    const row = Buffer.from(raw.slice(rs + 1, rs + 1 + stride));
    for (let i = 0; i < stride; i++) {
      const x = row[i];
      const a = i >= bpp ? row[i - bpp] : 0;
      const up = prev[i];
      const ul = i >= bpp ? prev[i - bpp] : 0;
      const p = a + up - ul;
      const pa = Math.abs(a - p), pu = Math.abs(up - p), pl = Math.abs(ul - p);
      const pred = pa <= pu && pa <= pl ? a : pu <= pl ? up : ul;
      let v = x;
      if (f === 1) v = x + a; else if (f === 2) v = x + up;
      else if (f === 3) v = x + ((a + up) >> 1); else if (f === 4) v = x + pred;
      row[i] = v & 255;
    }
    row.copy(data, y * stride);
    prev = row;
    rs += 1 + stride;
  }
  return { w, h, data };
}
function encodePng(w, h, data) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = w * 4;
  const rawSize = (stride + 1) * h;
  const raw = Buffer.alloc(rawSize);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------- helpers ----------------
function dist3(r1, g1, b1, c2) {
  const dr = r1 - c2[0], dg = g1 - c2[1], db = b1 - c2[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
function kmeans(pixels, k, iters = 10) {
  const dim = 3;
  const pts = pixels.length / dim;
  const means = [];
  for (let i = 0; i < k; i++) {
    const p = Math.floor((i + 0.5) * (pts / k));
    means.push([pixels[p * dim], pixels[p * dim + 1], pixels[p * dim + 2]]);
  }
  const assign = new Int32Array(pts);
  const sum = Array.from({ length: k }, () => [0, 0, 0, 0]);
  for (let it = 0; it < iters; it++) {
    for (let m = 0; m < k; m++) sum[m][0] = sum[m][1] = sum[m][2] = sum[m][3] = 0;
    for (let p = 0; p < pts; p++) {
      let best = 0;
      let bd = Infinity;
      for (let m = 0; m < k; m++) {
        const d = dist3(pixels[p * dim], pixels[p * dim + 1], pixels[p * dim + 2], means[m]);
        if (d < bd) { bd = d; best = m; }
      }
      assign[p] = best;
    }
    for (let p = 0; p < pts; p++) {
      const m = assign[p];
      sum[m][0] += pixels[p * dim];
      sum[m][1] += pixels[p * dim + 1];
      sum[m][2] += pixels[p * dim + 2];
      sum[m][3]++;
    }
    for (let m = 0; m < k; m++) {
      if (sum[m][3] > 0) means[m] = [sum[m][0] / sum[m][3], sum[m][1] / sum[m][3], sum[m][2] / sum[m][3]];
    }
  }
  return means.map((m, idx) => ({ mean: m, size: sum[idx][3] }));
}

function run(file, tol = TOL) {
  let { w, h, data } = decodePng(path.join(IMG_DIR, file));

  // --- модель фона: 4 кластера по кольцам у краёв ---
  const samples = [];
  const ring = [];
  for (let x = 0; x < w; x++) for (let y of [0, 1, h - 2, h - 1]) ring.push([x, y]);
  for (let y = 0; y < h; y++) for (let x of [0, 1, w - 2, w - 1]) ring.push([x, y]);
  for (const [x, y] of ring) {
    const p = (y * w + x) * 4;
    samples.push(data[p], data[p + 1], data[p + 2]);
  }
  const clusters = kmeans(samples, 4).sort((a, b) => b.size - a.size);
  const bgModels = clusters.map((c) => c.mean);

  // --- цветовой флуд от краёв ---
  const isBg = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (isBg[i]) return;
    const p = i * 4;
    let d = Infinity;
    for (const m of bgModels) d = Math.min(d, dist3(data[p], data[p + 1], data[p + 2], m));
    if (d > tol) return;
    isBg[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    const y = (i / w) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  // --- компоненты фигуры (8-связность) ---
  const seen = new Uint8Array(w * h);
  const comps = [];
  for (let s = 0; s < w * h; s++) {
    if (seen[s] || isBg[s]) continue;
    const comp = [];
    const q = [s];
    seen[s] = 1;
    while (q.length) {
      const i = q.pop();
      comp.push(i);
      const x = i % w;
      const y = (i / w) | 0;
      const tryPush = (nx, ny) => {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
        const ni = ny * w + nx;
        if (seen[ni] || isBg[ni]) return;
        seen[ni] = 1;
        q.push(ni);
      };
      tryPush(x - 1, y);
      tryPush(x + 1, y);
      tryPush(x, y - 1);
      tryPush(x, y + 1);
    }
    comps.push(comp);
  }

  // --- правила отбора компонентов ---
  // центр изображения по горизонтали — там персонаж
  const cx0 = w * 0.26;
  const cx1 = w * 0.74;
  const kept = new Uint8Array(w * h);
  let keptArea = 0;
  for (const comp of comps) {
    let mnX = w, mxX = -1, mnY = h, mxY = -1;
    for (const i of comp) {
      const x = i % w;
      const y = (i / w) | 0;
      if (x < mnX) mnX = x;
      if (x > mxX) mxX = x;
      if (y < mnY) mnY = y;
      if (y > mxY) mxY = y;
    }
    const bw = mxX - mnX + 1;
    const bh = mxY - mnY + 1;
    const touchesBorder = mnX === 0 || mxX === w - 1 || mnY === 0 || mxY === h - 1;
    const touchesSide = mnX === 0 || mxX === w - 1;
    const inCenter = mxX >= cx0 && mnX <= cx1;
    const area = comp.length;
    // 1) мелкий мусор
    if (area < 250) continue;
    // 2) тонкие полосы-рамки по краям
    if (touchesBorder && (bw <= 9 || bh <= 9)) continue;
    // 3) крупные обрывки сцены, не пересекающие центральную зону персонажа
    if (!inCenter && area < 2000) continue;
    // 4) вертикальные полосы у боковых краёв (остатки рамок ячеек)
    if (touchesSide && bw <= 12 && bh > h * 0.3 && area < 4000) continue;
    for (const i of comp) kept[i] = 1;
    keptArea += area;
  }

  // --- сглаживание кромки: покрытие + 2 мягких прохода ---
  let alpha = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!kept[i]) continue;
      let cov = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          n++;
          if (kept[ny * w + nx]) cov++;
        }
      }
      alpha[i] = cov / n;
    }
  }
  for (let pass = 0; pass < 2; pass++) {
    const next = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let s = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            n++;
            s += alpha[ny * w + nx];
          }
        }
        next[i] = s / n;
      }
    }
    alpha = next;
  }

  // --- нижний мягкий срез: ниже последней «сплошной» строки плавно гасим ---
  {
    const rowAvg = new Float32Array(h);
    for (let y = 0; y < h; y++) {
      let s = 0;
      for (let x = 0; x < w; x++) s += alpha[y * w + x];
      rowAvg[y] = s / w;
    }
    let floorRow = h - 1;
    let run = 0;
    for (let y = h - 1; y >= 0; y--) {
      if (rowAvg[y] < 0.12) run++;
      else run = 0;
      if (run >= 10) { floorRow = y + run; break; }
    }
    if (floorRow < h - 1) {
      for (let y = floorRow; y < h; y++) {
        const t = Math.max(0, 1 - (y - floorRow) / 22);
        const k = t * t;
        for (let x = 0; x < w; x++) alpha[y * w + x] *= k;
      }
    }
  }

  // --- подъём альфы: «полупрозрачные» пиксели фигуры делаем плотными ---
  let out = Buffer.from(data);
  for (let i = 0; i < w * h; i++) {
    const a = alpha[i];
    out[i * 4 + 3] = kept[i] ? Math.max(0, Math.min(255, Math.round(70 + 185 * a))) : 0;
  }

  // --- чистка: глушим слабые пиксели без плотного соседа (остатки шума/дизера),
  // настоящие кромки фигуры всегда соседствуют с плотным телом ---
  {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const a = out[i + 3];
        if (a >= 150 || a === 0) continue;
        let solid = false;
        for (let dy = -1; dy <= 1 && !solid; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (out[(ny * w + nx) * 4 + 3] >= 200) { solid = true; break; }
          }
        }
        if (!solid) out[i + 3] = 0;
      }
    }
  }

  // --- плотная обрезка холста: убираем пустые поля, чтобы фигура
  // занимала почти весь кадр (после object-fit: contain) ---
  {
    let mnX = w, mxX = -1, mnY = h, mxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (out[(y * w + x) * 4 + 3] < 150) continue;
        if (x < mnX) mnX = x;
        if (x > mxX) mxX = x;
        if (y < mnY) mnY = y;
        if (y > mxY) mxY = y;
      }
    }
    if (mxX > mnX && mxY > mnY) {
      const padX = 3;
      const c0x = Math.max(0, mnX - padX);
      const c1x = Math.min(w - 1, mxX + padX);
      const c0y = Math.max(0, mnY - 5);
      const c1y = Math.min(h - 1, mxY + 2);
      const nw = c1x - c0x + 1;
      const nh = c1y - c0y + 1;
      const cropped = Buffer.alloc(nw * nh * 4);
      for (let y = 0; y < nh; y++) {
        out.copy(cropped, y * nw * 4, (c0y + y) * w * 4 + c0x * 4, (c0y + y) * w * 4 + c1x * 4 + 4);
      }
      w = nw;
      h = nh;
      out = cropped;
    }
  }

  fs.writeFileSync(path.join(IMG_DIR, file.replace(".png", ".sprite.png")), encodePng(w, h, out));
  // Оригиналы level-*.png НЕ перезаписываются — они нужны как исходник
  // и как архивная копия. Режима «--write» больше нет.

  // --- сводка ---
  const maskStat = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) maskStat[i] = out[i * 4 + 3] > 150 ? 1 : 0;
  let mnX = w, mxX = -1, mnY = h, mxY = -1, solid = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!maskStat[i]) continue;
      solid++;
      if (x < mnX) mnX = x;
      if (x > mxX) mxX = x;
      if (y < mnY) mnY = y;
      if (y > mxY) mxY = y;
    }
  }
  console.log(
    `${file}: tol=${tol} transparent=${(100 * (1 - solid / (w * h))).toFixed(1)}% ` +
    `bbox=${mxX - mnX + 1}x${mxY - mnY + 1}@(${mnX},${mnY}) headTop=${mnY === 0 ? "обрез!" : "ok"}`
  );

  if (PREVIEW) {
    const cols = 48;
    const rr = Math.max(1, Math.floor((h * cols) / w / 2.2));
    for (let y = 0; y < rr; y++) {
      let line = "";
      for (let x = 0; x < cols; x++) {
        const sx = Math.min(w - 1, Math.floor((x * w) / cols));
        const sy = Math.min(h - 1, Math.floor((y * h) / rr));
        const i = sy * w + sx;
        if (!kept[i]) { line += "."; continue; }
        const lum = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
        line += lum > 150 ? "@" : lum > 60 ? "o" : "x";
      }
      console.log(line);
    }
  }
}

// толерантность подбирается по каждой картинке; переопределяется через TUNE="level-01.png=45,level-10.png=50"
const DEFAULT_TUNE = { "level-01.png": 60, "level-10.png": 45, "level-20.png": 48, "level-30.png": 55 };
const TUNE = { ...DEFAULT_TUNE };
if (process.env.TUNE) {
  for (const pair of process.env.TUNE.split(",")) {
    const [file, val] = pair.split("=");
    if (file && val) TUNE[file.trim()] = Number(val);
  }
}
for (const f of FILES) run(f, TUNE[f] ?? TOL);
