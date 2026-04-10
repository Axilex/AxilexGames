import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(resolve(root, 'apps/api/package.json'), 'utf8'));
const version = pkg.version;
const tag = `v${version}`;

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

function extractChangelog(changelogPath) {
  if (!existsSync(changelogPath)) return '';
  const content = readFileSync(changelogPath, 'utf8');
  // Extract the section for the current version (between first ## and next ##)
  const match = content.match(/^## [^\n]+\n([\s\S]*?)(?=^## |\s*$)/m);
  return match ? match[1].trim() : '';
}

const apiChangelog = extractChangelog(resolve(root, 'apps/api/CHANGELOG.md'));
const webChangelog = extractChangelog(resolve(root, 'apps/web/CHANGELOG.md'));

// Merge unique lines from both changelogs
const lines = new Set([...apiChangelog.split('\n'), ...webChangelog.split('\n')]);
const body = [...lines].filter(Boolean).join('\n');

console.log(`\nReleasing ${tag}...\n`);

run('git add -A');
run(`git commit -m "chore: release ${tag}"`);
run('git push');

// Create GitHub Release (also creates the tag on GitHub)
const bodyEscaped = body.replace(/"/g, '\\"');
run(`gh release create ${tag} --title "${tag}" --notes "${bodyEscaped}"`);

console.log(`\n✓ ${tag} released on GitHub.\n`);
