// Computes SHA-256 of shipped production files and outputs HASHES.txt
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Shipped release files to hash
const TARGET_FILES = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/logo.jpg',
  'fonts/bitcount-ink.ttf',
  'fonts/yarndings-12.ttf'
];

function computeFileHash(relPath) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Target file not found: ${relPath}`);
  }
  const content = fs.readFileSync(fullPath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

const isCheckMode = process.argv.includes('--check');
const hashesFilePath = path.join(rootDir, 'HASHES.txt');

if (isCheckMode) {
  console.log("Verifying files against HASHES.txt...");
  if (!fs.existsSync(hashesFilePath)) {
    console.error("FAIL: HASHES.txt does not exist!");
    process.exit(1);
  }
  
  const existingContent = fs.readFileSync(hashesFilePath, 'utf8');
  const lines = existingContent.trim().split(/\r?\n/);
  const recordedHashes = new Map();
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
      recordedHashes.set(parts[1], parts[0]);
    }
  }

  let mismatch = false;
  for (const file of TARGET_FILES) {
    const expected = recordedHashes.get(file);
    const actual = computeFileHash(file);
    if (!expected) {
      console.error(`FAIL: ${file} is missing from HASHES.txt`);
      mismatch = true;
    } else if (expected !== actual) {
      console.error(`FAIL: Hash mismatch for ${file}!\n  Expected: ${expected}\n  Actual:   ${actual}`);
      mismatch = true;
    } else {
      console.log(`OK: ${file} matches (${actual.slice(0, 16)}...)`);
    }
  }

  if (mismatch) {
    console.error("\nIntegrity verification FAILED! Run 'node scripts/hash.mjs' to regenerate.");
    process.exit(1);
  } else {
    console.log("\nALL FILES VERIFIED SUCCESSFULLY!");
    process.exit(0);
  }
} else {
  console.log("Computing SHA-256 for release assets...");
  const entries = [];
  for (const file of TARGET_FILES) {
    const hash = computeFileHash(file);
    entries.push(`${hash}  ${file}`);
    console.log(`  ${hash}  ${file}`);
  }

  const output = entries.join('\n') + '\n';
  fs.writeFileSync(hashesFilePath, output, 'utf8');
  console.log(`\nWritten to ${path.relative(process.cwd(), hashesFilePath)} successfully.`);
}
