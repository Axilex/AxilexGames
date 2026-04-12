/**
 * Auto-generates a changeset file from git commits since the last tag.
 * Supports Conventional Commits (feat:, fix:, etc.) and free-form messages.
 * Usage: node scripts/auto-changeset.mjs [patch|minor|major]
 *
 * - If pending changeset files already exist, skips generation (manual notes take priority).
 * - Otherwise, reads `git log <last-tag>..HEAD` and writes .changeset/auto-generated.md.
 */

import { execSync } from 'child_process';
import { writeFileSync, readdirSync } from 'fs';
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

// Retrieve commits with short hash + subject
const logCmd = `git log ${range} --pretty=format:"%h %s" --no-merges`;
let rawOutput = '';
try {
  rawOutput = execSync(logCmd, { encoding: 'utf8', cwd: root }).trim();
} catch {
  rawOutput = '';
}

if (!rawOutput) {
  console.log('No commits since last tag — nothing to release.');
  process.exit(1);
}

// Get repo URL for commit links (optional — falls back gracefully)
let repoUrl = '';
try {
  repoUrl = execSync('git remote get-url origin', { encoding: 'utf8', cwd: root })
    .trim()
    .replace(/\.git$/, '')
    .replace(/^git@github\.com:/, 'https://github.com/');
} catch {
  // No remote or not a GitHub repo — links will be omitted
}

// Conventional Commits type → section header mapping
const typeMap = {
  feat:     '### ✨ Nouvelles fonctionnalités',
  fix:      '### 🐛 Corrections',
  perf:     '### ⚡ Performances',
  refactor: '### ♻️ Refactoring',
  docs:     '### 📚 Documentation',
  style:    '### 🎨 Style',
  test:     '### 🧪 Tests',
  build:    '### 📦 Build',
  ci:       '### 👷 CI/CD',
  chore:    '### 🔧 Maintenance',
  revert:   '### ⏪ Reverts',
};

const grouped = {};

for (const rawLine of rawOutput.split('\n')) {
  // Filter out self-referential release commits
  if (/^[a-f0-9]+ chore: release v/.test(rawLine)) continue;

  const spaceIdx = rawLine.indexOf(' ');
  const hash = rawLine.slice(0, spaceIdx);
  const subject = rawLine.slice(spaceIdx + 1).trim();

  // Build optional commit link
  const hashLink = repoUrl
    ? `[\`${hash}\`](${repoUrl}/commit/${hash})`
    : `\`${hash}\``;

  // Try to match Conventional Commits: type(scope)!: description
  const ccMatch = subject.match(/^(\w+)(?:\([^)]+\))?(!)?\s*:\s+(.+)/);

  let sectionKey;
  let description;

  if (ccMatch) {
    const [, type, breaking, msg] = ccMatch;
    description = breaking ? `**[BREAKING]** ${msg}` : msg;
    sectionKey = typeMap[type] ?? '### 📦 Autres';
  } else {
    description = subject;
    sectionKey = '### 📦 Autres';
  }

  if (!grouped[sectionKey]) grouped[sectionKey] = [];
  grouped[sectionKey].push(`- ${hashLink} ${description}`);
}

// Ensure breaking changes and features come first
const sectionOrder = [
  '### ✨ Nouvelles fonctionnalités',
  '### 🐛 Corrections',
  '### ⚡ Performances',
  '### ♻️ Refactoring',
  '### 📚 Documentation',
  '### 🎨 Style',
  '### 🧪 Tests',
  '### 📦 Build',
  '### 👷 CI/CD',
  '### 🔧 Maintenance',
  '### ⏪ Reverts',
  '### 📦 Autres',
];

const sortedSections = Object.keys(grouped).sort(
  (a, b) => {
    const ai = sectionOrder.indexOf(a);
    const bi = sectionOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  },
);

if (sortedSections.length === 0) {
  console.log('No meaningful commits since last tag — nothing to release.');
  process.exit(1);
}

const body = sortedSections
  .map((section) => `${section}\n${grouped[section].join('\n')}`)
  .join('\n\n');

const content = `---
"api": ${bumpType}
"web": ${bumpType}
"@wiki-race/shared": ${bumpType}
---

${body}
`;

const outPath = resolve(changesetDir, 'auto-generated.md');
writeFileSync(outPath, content, 'utf8');

console.log(`Generated changeset (${bumpType}):\n`);
console.log(body);
console.log(`\nWritten to .changeset/auto-generated.md`);
