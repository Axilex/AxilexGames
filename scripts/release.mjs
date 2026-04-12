/**
 * Full release script:
 *   1. Auto-generates a changeset from commits if none exist (scripts/auto-changeset.mjs)
 *   2. Bumps versions via `changeset version`
 *   3. Commits, pushes, creates a GitHub Release with a structured changelog body
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

/**
 * Extracts the most recent changelog section (from the first ## heading
 * down to the next ## heading, exclusive).
 */
function extractLatestSection(changelogPath) {
  if (!existsSync(changelogPath)) return '';
  const content = readFileSync(changelogPath, 'utf8');
  // Match from first "## <version>" to the next one (or end of file)
  const match = content.match(/^## [^\n]+\n+([\s\S]*?)(?=^## )/m)
    ?? content.match(/^## [^\n]+\n+([\s\S]+)$/m);
  return match ? match[1].trim() : '';
}

/**
 * Merges multiple changelog sections, deduplicating individual bullet lines
 * while preserving section headers (### …) and their order.
 */
function mergeChangelogs(...sections) {
  const seenBullets = new Set();
  const result = [];

  for (const section of sections) {
    if (!section) continue;
    for (const line of section.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Always keep section headers (allow same header from api + web)
      if (trimmed.startsWith('###')) {
        if (!result.includes(line)) result.push(line);
        continue;
      }
      // Deduplicate bullet lines
      if (!seenBullets.has(trimmed)) {
        seenBullets.add(trimmed);
        result.push(line);
      }
    }
  }

  return result.join('\n');
}

// ---------------------------------------------------------------------------
// Step 1 — auto-generate changeset from commits if no manual ones exist
// ---------------------------------------------------------------------------
console.log('\n→ Checking for changesets...');
run(`node scripts/auto-changeset.mjs ${bumpType}`);

// ---------------------------------------------------------------------------
// Step 2 — bump versions + generate CHANGELOG.md files
// ---------------------------------------------------------------------------
console.log('\n→ Bumping versions...');
run('pnpm changeset version');

// Read the new version from the API package
const apiPkg = JSON.parse(readFileSync(resolve(root, 'apps/api/package.json'), 'utf8'));
const version = apiPkg.version;
const tag = `v${version}`;

// ---------------------------------------------------------------------------
// Step 3 — build structured release notes from the generated CHANGELOG files
// ---------------------------------------------------------------------------
const apiChangelog  = extractLatestSection(resolve(root, 'apps/api/CHANGELOG.md'));
const webChangelog  = extractLatestSection(resolve(root, 'apps/web/CHANGELOG.md'));

const body = mergeChangelogs(apiChangelog, webChangelog);

if (!body) {
  console.warn('⚠ No changelog content found — the release will have empty notes.');
}

console.log(`\n→ Releasing ${tag}...\n`);
console.log('Release notes preview:\n');
console.log(body || '(empty)');
console.log();

// ---------------------------------------------------------------------------
// Step 4 — commit + push
// ---------------------------------------------------------------------------
run('git add -A');
run(`git commit -m "chore: release ${tag}"`);
run('git push');

// ---------------------------------------------------------------------------
// Step 5 — create GitHub Release (this also creates the git tag)
// ---------------------------------------------------------------------------
// Write notes to a temp file to avoid shell-escaping issues with special chars
import { writeFileSync } from 'fs';
const notesPath = resolve(root, '.release-notes.tmp.md');
writeFileSync(notesPath, body, 'utf8');

try {
  run(`gh release create ${tag} --title "${tag}" --notes-file "${notesPath}"`);
} finally {
  // Always clean up the temp file
  import('fs').then(({ unlinkSync }) => {
    try { unlinkSync(notesPath); } catch { /* ignore */ }
  });
}

console.log(`\n✓ ${tag} released on GitHub.\n`);
