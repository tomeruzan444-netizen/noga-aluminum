// ship.mjs - the single pipeline for every site change.
//
// GitHub is the source of truth. This script enforces the order:
//   1. commit all changes   2. push to GitHub   3. build + deploy to the live site (FTP)
//
// If the push fails, it STOPS before deploying, so the live site never gets a
// change that is not already saved in GitHub. Deploy stays on the local machine
// because Hostinger blocks FTP from cloud IPs (so GitHub Actions can't deploy).
//
// Usage:
//   npm run ship -- "commit message describing the change"
//   npm run ship -- --no-verify-clean "msg"   (allow deploy even if nothing to commit)

import { execSync } from 'node:child_process';

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'inherit', ...opts });
}
function capture(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

const args = process.argv.slice(2).filter(a => a !== '--no-verify-clean');
const msg = args.join(' ').trim();

// 1) stage everything
run('git add -A');

const hasChanges = capture('git status --porcelain').length > 0;

if (hasChanges) {
  if (!msg) {
    console.error('\n[ship] There are changes to commit but no message was given.');
    console.error('[ship] Usage: npm run ship -- "describe the change"\n');
    process.exit(1);
  }
  // commit via a temp file to keep Hebrew/newlines intact
  const { writeFileSync, unlinkSync } = await import('node:fs');
  const tmp = '.git/SHIP_MSG.txt';
  writeFileSync(tmp, msg + '\n', 'utf8');
  try {
    run(`git commit -F "${tmp}"`);
  } finally {
    try { unlinkSync(tmp); } catch {}
  }
} else {
  console.log('[ship] Nothing new to commit.');
}

// 2) push to GitHub FIRST. If this fails, do NOT deploy.
const branch = capture('git rev-parse --abbrev-ref HEAD');
console.log(`[ship] Pushing ${branch} to GitHub...`);
try {
  run(`git push origin ${branch}`);
} catch (e) {
  console.error('\n[ship] PUSH FAILED. Aborting before deploy so GitHub stays the source of truth.');
  console.error('[ship] Fix the push (network/auth/conflict) and run ship again.\n');
  process.exit(1);
}

// 3) only now build + deploy to the live site
console.log('[ship] Push OK. Building and deploying to the live site...');
run('node scripts/publish.mjs');

console.log('\n[ship] Done: GitHub updated, then live site deployed.');
