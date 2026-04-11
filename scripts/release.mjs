/**
 * Full release script:
 *   1. Auto-generates a changeset from commits if none exist (scripts/auto-changeset.mjs)
 *   2. Bumps versions via `changeset version`
 *   3. Commits, pushes, creates a GitHub Release with the changelog body
 *
 * Usage:
 *   pnpm release           → patch bump
 *   pnpm release minor     → minor bump
 *   pnpm release major     → major bump
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const bumpType = process.argv[2] ?? 'patch';
if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error(`Invalid bump type "${bumpType}". Use: pnpm release [patch|minor|major]`);
  process.exit(1);
}

const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd: root });

function extractChangelog(changelogPath) {
  if (!existsSync(changelogPath)) return '';
  const content = readFileSync(changelogPath, 'utf8');
  const match = content.match(/^## [^\n]+\n([\s\S]*?)(?=^## |\s*$)/m);
  return match ? match[1].trim() : '';
}

// Step 1 — auto-generate changeset from commits if no manual ones exist
console.log('\n→ Checking for changesets...');
run(`node scripts/auto-changeset.mjs ${bumpType}`);

// Step 2 — bump versions + generate CHANGELOG.md
console.log('\n→ Bumping versions...');
run('pnpm changeset version');

// Read the new version
const pkg = JSON.parse(readFileSync(resolve(root, 'apps/api/package.json'), 'utf8'));
const version = pkg.version;
const tag = `v${version}`;

// Step 3 — build release notes from CHANGELOG (merged, deduplicated)
const apiChangelog = extractChangelog(resolve(root, 'apps/api/CHANGELOG.md'));
const webChangelog = extractChangelog(resolve(root, 'apps/web/CHANGELOG.md'));
const lines = new Set([...apiChangelog.split('\n'), ...webChangelog.split('\n')]);
const body = [...lines].filter(Boolean).join('\n');

console.log(`\n→ Releasing ${tag}...\n`);

// Step 4 — commit + push
run('git add -A');
run(`git commit -m "chore: release ${tag}"`);
run('git push');

// Step 5 — create GitHub Release (creates the tag)
const bodyEscaped = body.replace(/"/g, '\\"').replace(/`/g, '\\`');
run(`gh release create ${tag} --title "${tag}" --notes "${bodyEscaped}"`);

console.log(`\n✓ ${tag} released on GitHub.\n`);
