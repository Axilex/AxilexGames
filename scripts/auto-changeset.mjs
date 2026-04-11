/**
 * Auto-generates a changeset file from git commits since the last tag.
 * Usage: node scripts/auto-changeset.mjs [patch|minor|major]
 *
 * - If pending changeset files already exist, skips generation (manual notes take priority).
 * - Otherwise, reads `git log <last-tag>..HEAD` and writes a .changeset/auto-generated.md.
 */

import { execSync } from 'child_process';
import { writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const changesetDir = resolve(root, '.changeset');

const bumpType = process.argv[2] ?? 'patch';
if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error(`Invalid bump type "${bumpType}". Use patch, minor, or major.`);
  process.exit(1);
}

// Check if manual changesets already exist (exclude config.json and README.md)
const pending = readdirSync(changesetDir).filter(
  (f) => f.endsWith('.md') && f !== 'README.md',
);

if (pending.length > 0) {
  console.log(`Found ${pending.length} manual changeset(s) — skipping auto-generation.`);
  process.exit(0);
}

// Get last git tag
let lastTag = '';
try {
  lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
} catch {
  // No tag yet — take all commits
}

const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
const logCmd = `git log ${range} --pretty=format:"- %s" --no-merges`;

let commits = '';
try {
  commits = execSync(logCmd, { encoding: 'utf8' }).trim();
} catch {
  commits = '';
}

if (!commits) {
  console.log('No commits since last tag — nothing to release.');
  process.exit(1);
}

// Filter out chore: release commits (self-referential)
const lines = commits
  .split('\n')
  .filter((l) => !l.match(/^- chore: release v/))
  .join('\n');

if (!lines.trim()) {
  console.log('No meaningful commits since last tag — nothing to release.');
  process.exit(1);
}

const content = `---
"api": ${bumpType}
"web": ${bumpType}
"@wiki-race/shared": ${bumpType}
---

${lines}
`;

const outPath = resolve(changesetDir, 'auto-generated.md');
writeFileSync(outPath, content, 'utf8');

console.log(`Generated changeset (${bumpType}):\n`);
console.log(lines);
console.log(`\nWritten to .changeset/auto-generated.md`);
