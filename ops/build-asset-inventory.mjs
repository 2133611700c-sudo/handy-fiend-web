#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = process.env.HF_ROOT || path.resolve(scriptDir, '..');
const home = process.env.HOME || '/Users/sergiikuropiatnyk';

const ROOTS = process.env.HF_ASSET_ROOTS
  ? process.env.HF_ASSET_ROOTS.split(',').map((p) => p.trim()).filter(Boolean)
  : [
      path.join(home, 'Downloads'),
      path.join(projectRoot, 'assets/img')
    ];

const OUT_DIR = path.join(projectRoot, 'docs');
const OUT_JSON = path.join(OUT_DIR, 'creative-assets.json');
const OUT_CSV = path.join(OUT_DIR, 'placements.csv');

const exts = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const serviceTags = [
  ['electrical', ['electrical', 'outlet', 'switch']],
  ['plumbing', ['plumbing', 'faucet', 'sink']],
  ['furniture_assembly', ['furniture', 'assembly']],
  ['painting', ['painting', 'paint', 'room', 'kitchen']],
  ['flooring', ['floor', 'flooring']],
  ['kitchen', ['kitchen', 'cabinet']]
];

function walk(dir, out = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      walk(abs, out);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (exts.has(ext)) out.push(abs);
  }
  return out;
}

function hashFile(file) {
  const buf = fs.readFileSync(file);
  return crypto.createHash('sha1').update(buf).digest('hex');
}

function classify(file) {
  const name = file.toLowerCase();
  const serviceTag = serviceTags.find(([, keys]) => keys.some((k) => name.includes(k)))?.[0] || 'general';
  const type = name.includes('before') || name.includes('after')
    ? 'before_after'
    : (name.includes('gemini_generated') || name.includes('ai') ? 'mockup' : 'real_photo');
  return { serviceTag, type };
}

const seen = new Set();
const assets = [];

for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue;
  const files = walk(root);
  for (const file of files) {
    try {
      const hash = hashFile(file);
      if (seen.has(hash)) continue;
      seen.add(hash);
      const stat = fs.statSync(file);
      const { serviceTag, type } = classify(file);
      assets.push({
        assetId: `asset_${hash.slice(0, 12)}`,
        filePath: file,
        type,
        serviceTag,
        rightsStatus: 'owner_archive',
        hash,
        size: stat.size,
        updatedAt: stat.mtime.toISOString()
      });
    } catch {
      // Skip unreadable file
    }
  }
}

assets.sort((a, b) => a.filePath.localeCompare(b.filePath));
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), count: assets.length, assets }, null, 2));

if (!fs.existsSync(OUT_CSV)) {
  fs.writeFileSync(
    OUT_CSV,
    'placementId,platform,city,url,status,createdAt,lastRefreshAt\n' +
    'plc_fb_001,facebook,Los Angeles,,draft,,\n' +
    'plc_nd_001,nextdoor,Los Angeles,,draft,,\n' +
    'plc_cl_001,craigslist,Los Angeles,,draft,,\n' +
    'plc_yp_001,yelp,Los Angeles,,draft,,\n' +
    'plc_tt_001,thumbtack,Los Angeles,,draft,,\n' +
    'plc_tr_001,taskrabbit,Los Angeles,,draft,,\n' +
    'plc_gbp_001,google_business,Los Angeles,,draft,,\n'
  );
}

console.log(`Inventory generated: ${assets.length} assets`);
console.log(`Roots: ${ROOTS.join(', ')}`);
console.log(OUT_JSON);
console.log(OUT_CSV);
