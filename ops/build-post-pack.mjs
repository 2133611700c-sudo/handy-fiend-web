#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = process.env.HF_ROOT || path.resolve(scriptDir, '..');
const placementsPath = path.join(root, 'docs/placements.csv');
const outDir = path.join(root, 'docs/post-pack');

const base = 'https://handyandfriend.com';
const byPlatform = {
  craigslist: {
    title: 'Handyman Los Angeles - Same Week Availability - Labor Only',
    body: [
      'Reliable handyman in Los Angeles for small and medium home projects.',
      'Services: TV mounting, furniture assembly, faucet replacement, outlet/switch replacement, patch & paint, flooring touch-ups.',
      'Labor only. No markup on materials. Fast response.'
    ]
  },
  nextdoor: {
    title: 'Local Handyman - Same-Week Availability',
    body: [
      'Hi neighbors, Handy & Friend is available this week in Los Angeles.',
      'We handle assembly, painting, plumbing/electrical basics, and home fixes.',
      'Transparent labor-only pricing and quick communication.'
    ]
  },
  facebook: {
    title: 'Need a handyman this week in Los Angeles?',
    body: [
      'Handy & Friend provides labor-only handyman services with fast response.',
      'No markup on materials. Same-week slots available.',
      'Send photos for a quick estimate.'
    ]
  },
  yelp: {
    title: 'Handyman Services - Fast Quote',
    body: ['Request a quote with photos and preferred contact method.']
  },
  thumbtack: {
    title: 'Handyman Pro Profile Intro',
    body: ['Labor-only handyman services, fast response, same-week availability in Los Angeles.']
  },
  taskrabbit: {
    title: 'Tasker Bio Intro',
    body: ['Skilled handyman for assembly, mounting, patching, fixture swaps, and home fixes.']
  },
  google_business: {
    title: 'Book This Week - Handy & Friend',
    body: ['Same-week availability in Los Angeles. Send project photos for a quick estimate.']
  }
};

function parseCsv(csv) {
  const lines = csv.trim().split(/\r?\n/);
  const head = lines.shift().split(',');
  return lines.map((line) => {
    const cols = line.split(',');
    const obj = {};
    head.forEach((h, i) => (obj[h] = cols[i] || ''));
    return obj;
  });
}

if (!fs.existsSync(placementsPath)) {
  console.error(`[POST_PACK_ERROR] placements file not found: ${placementsPath}`);
  process.exit(1);
}

const csv = fs.readFileSync(placementsPath, 'utf8');
const rows = parseCsv(csv);
fs.mkdirSync(outDir, { recursive: true });

const manifest = [];
for (const row of rows) {
  const platform = row.platform;
  const tpl = byPlatform[platform] || {
    title: 'Handy & Friend Services',
    body: ['Reliable handyman services in Los Angeles.']
  };
  const url = `${base}/?utm_source=${platform}&utm_campaign=organic_wave1&utm_content=post_a&placement_id=${row.placementId}`;
  const text = [
    `Platform: ${platform}`,
    `Placement: ${row.placementId}`,
    `Title: ${tpl.title}`,
    '',
    ...tpl.body,
    '',
    'CTA: Call/Text 213-361-1700',
    `Site: ${url}`
  ].join('\n');

  const file = path.join(outDir, `${platform}-${row.placementId}.txt`);
  fs.writeFileSync(file, text);
  manifest.push({ platform, placementId: row.placementId, file, url });
}

fs.writeFileSync(
  path.join(outDir, 'manifest.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), count: manifest.length, manifest }, null, 2)
);
console.log(`Generated post pack: ${manifest.length} files`);
