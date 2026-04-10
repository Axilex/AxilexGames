import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../apps/api/package.json'), 'utf8'));
const version = pkg.version;

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

console.log(`\nReleasing v${version}...\n`);

run('git add -A');
run(`git commit -m "chore: release v${version}"`);
run(`git tag v${version}`);
run('git push');
run('git push --tags');

console.log(`\n✓ v${version} tagged and pushed.\n`);
