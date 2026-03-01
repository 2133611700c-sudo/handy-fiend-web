#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = process.env.HF_ROOT || path.resolve(scriptDir, '..');
const indexPath = path.join(root, 'index.html');
const mainJsPath = path.join(root, 'assets/js/main.js');
const placementsPath = path.join(root, 'docs/placements.csv');

const results = [];

function check(name, ok, details = '') {
  results.push({ name, ok, details });
}

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

const index = read(indexPath);
const mainJs = read(mainJsPath);
const placements = read(placementsPath);

check('index_exists', Boolean(index), index ? 'ok' : 'missing index.html');
check('main_js_exists', Boolean(mainJs), mainJs ? 'ok' : 'missing assets/js/main.js');

check('ga4_tag_present', index.includes('G-Z05XJ8E281'), 'expected GA4 measurement id in index');
check('gtag_config_present', index.includes("gtag('config', 'G-Z05XJ8E281')"), 'expected gtag config call');
check('form_submit_event_present', index.includes("emitCoreEvent('form_submit'"), 'expected form_submit event emission');
check('sms_event_present', mainJs.includes('sms_lead_generated') || mainJs.includes('sms_lead'), 'expected SMS event in main.js');
check('call_cta_tracking_present', index.includes('data-event="click_call"'), 'expected click_call data-event');
check('whatsapp_cta_tracking_present', index.includes('data-event="contact_whatsapp"') || index.includes('data-event="click_whatsapp"'), 'expected WhatsApp event tag');
check('placement_tracking_present', placements.includes('google_business') && placements.includes('placementId'), 'expected placement table with google_business row');

const hardFail = results.filter((r) => !r.ok);
const summary = {
  generatedAt: new Date().toISOString(),
  root,
  passed: results.length - hardFail.length,
  failed: hardFail.length,
  nextManualGoogleSteps: [
    'GA4 Admin: mark form_submit as conversion',
    'GA4 real-time: verify event appears after live form submit',
    'Google Ads: link GA4 property and import form_submit conversion',
    'GBP: login, verify profile completeness, publish one update'
  ],
  results
};

console.log(JSON.stringify(summary, null, 2));
process.exit(hardFail.length ? 1 : 0);
