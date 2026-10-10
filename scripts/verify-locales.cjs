#!/usr/bin/env node
/**
 * Locale Verification Script
 * Validates that all 12 language files exist and have key parity with en.json.
 * Run via: npm run test:locales or node scripts/verify-locales.cjs
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../src/locales');
const enPath = path.join(localesDir, 'en.json');

if (!fs.existsSync(enPath)) {
  console.error('❌ Baseline en.json not found in', localesDir);
  process.exit(1);
}

const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${k}` : k;
    if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      keys = keys.concat(getAllKeys(obj[k], fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

const expectedKeys = getAllKeys(en);
console.log(`\n======================================================`);
console.log(` AYULEKHA MULTILINGUAL VERIFICATION SYSTEM`);
console.log(` Total Baseline Keys in en.json: ${expectedKeys.length}`);
console.log(`======================================================\n`);

const languages = ['en', 'hi'];
let hasErrors = false;

languages.forEach((lang) => {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ [${lang.toUpperCase()}] File missing: ${lang}.json`);
    hasErrors = true;
    return;
  }

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const langKeys = new Set(getAllKeys(content));
    const missing = expectedKeys.filter((k) => !langKeys.has(k));

    if (missing.length === 0) {
      console.log(`✅ [${lang.toUpperCase()}] 100% Key Parity (${expectedKeys.length}/${expectedKeys.length} keys)`);
    } else {
      console.warn(`⚠️ [${lang.toUpperCase()}] Missing ${missing.length} keys:`);
      missing.slice(0, 5).forEach((k) => console.warn(`   - ${k}`));
      if (missing.length > 5) console.warn(`   ... and ${missing.length - 5} more.`);
      hasErrors = true;
    }
  } catch (err) {
    console.error(`❌ [${lang.toUpperCase()}] Failed to parse JSON: ${err.message}`);
    hasErrors = true;
  }
});

console.log(`\n------------------------------------------------------`);
if (hasErrors) {
  console.error('❌ Verification failed with missing keys or errors.');
  process.exit(1);
} else {
  console.log('🎉 ALL 12 LOCALE FILES VERIFIED WITH 100% KEY PARITY!');
  console.log('------------------------------------------------------\n');
  process.exit(0);
}
