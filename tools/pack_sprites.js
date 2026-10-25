#!/usr/bin/env node
// Copies every built animal sheet (art/out/<id>/<id>.png, a 4x4 grid of N×N cells drawn with pxl)
// into assets/sprites/<id>.png and writes assets/sprites/manifest.json { id: { cell: N } }.
// Run after `node tools/pxl/bin/pxl.js build art/animals/<id>.px.js --out art/out/<id>`.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'art', 'out');
const DEST = path.join(ROOT, 'assets', 'sprites');
const manifestPath = path.join(DEST, 'manifest.json');

function pngSize(buf) {
  if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

fs.mkdirSync(DEST, { recursive: true });
let manifest = {};
try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { /* first run */ }
const only = process.argv.slice(2);
const ids = fs.existsSync(OUT) ? fs.readdirSync(OUT).filter((d) => !only.length || only.includes(d)) : [];
let n = 0;
for (const id of ids) {
  const src = path.join(OUT, id, `${id}.png`);
  if (!fs.existsSync(src)) continue;
  const buf = fs.readFileSync(src);
  const size = pngSize(buf);
  if (!size || size.w % 4 || size.w !== size.h) { console.error(`skip ${id}: ${size ? size.w + 'x' + size.h : 'not a PNG'} (need a square 4x4 grid)`); continue; }
  fs.writeFileSync(path.join(DEST, `${id}.png`), buf);
  manifest[id] = { cell: size.w / 4 };
  n++;
  console.log(`${id}: ${size.w}x${size.h} → cell ${size.w / 4}px`);
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + '\n');
console.log(`${n} sheet(s) packed → ${path.relative(ROOT, manifestPath)} (${Object.keys(manifest).length} entries)`);
