// ===== file: rounds.mjs (continued) =====

export const runClean = (cfg, row) => (internalRequired(cfg, row) ? internalClean(row) : walkClean(row));
// The run passes (release dev, tranche close): clean, or every finding of it a known gap (a completion
// item deferred naming it, by Bob's word) and none a found mark, so no flaw is left for a round.
export const runPassed = (cfg, w) => !!w?.last && (runClean(cfg, w.last) || (w.failing > 0 && w.marks === 0 && w.recorded >= w.failing));
// The release path, once a round's internal walk is clean (BD-R1, C43): the one next act, or null.
// Owed when the round closed at a walk after its last merge ('clean'), that walk's findings are all
// recorded and none is a flaw (runPassed: known gaps deferred on Bob's word pass), and the product
// cuts releases: first the cut, signed release (release dev) after that walk, then its release
// deployment and live walk (deploy release, a named gap today). A release walk recorded, clean or
// not, owes nothing here: tranche close reads it, and its findings open the next round. Under plan
// close the tranche ends where it stands, and no release is owed (tranche.mjs trancheEnd).
export function releaseNext(root, cfg, { rc, w, plan, ref }) {
  if (plan === 'close' || !cfg.release || !rc?.closed || rc.rounds?.state !== 'clean' || !w?.last || walkHold(w) || !runPassed(cfg, w)) return null;
  // A finding no module owns holds the tranche's end (trancheEnd): BOB names its module first.
  if (ref && unplaced(root, ref).length) return null;
  const rel = releasesCut(root, cfg, w.last);
  if (!rel) return { why: `${rc.round}'s ${internalRequired(cfg, w.last) ? 'internal walk' : 'walk'} ${runSource(w.last)} is clean, and no release is cut since`, act: `${P3} release dev, from a clean checkout of the tranche tip (the cut, signed release), then ${P3} deploy release <version>, its release deployment and live walk (BD-R1)` };
  const walked = releaseWalks(root, cfg).filter((r) => r.version === rel.version);
  // BD-R5 (Bob, 9 Nov): clean with no AI account, the non-AI journeys are done; the AI-assisted ones
  // wait for Bob's account. Reported, not a wake: the act is Bob's (sweep puts gap acts in found).
  const clean = (r) => r.ok === true && !(Number(r.failures) > 0);
  const last = walked.at(-1);
  if (last && clean(last) && last.ai !== true && !walked.some((r) => r.ai === true && clean(r))) return { why: `release ${rel.version}'s walk is clean on the non-AI journeys (no AI account configured, BD-R5)`, act: `Bob configures the AI account; then walk.ai is set true and ${P3} deploy release ${rel.version} walks the AI-assisted journeys too, before the installer and site updates`, gap: true };
  if (walked.length) return null;
  return { why: `release ${rel.version} is cut since the clean ${internalRequired(cfg, w.last) ? 'internal walk' : 'walk'} ${runSource(w.last)}`, act: `${P3} deploy release ${rel.version}, its release deployment and live walk (BD-R1); GAP: ${RELEASE_PATH_GAP}, brought to Bob through the coordinator`, gap: true };
}
// The latest successful development release of this tranche recorded after the walk `last`, and cut
// at its commit or after it: one cut before the walk, recorded later, does not carry what it walked
// (cold review of C43). A commit this clone lacks is read by the times alone.
const atOrAfter = (root, a, b) => a === b || !hasCommit(root, a) || !hasCommit(root, b) || git(['merge-base', '--is-ancestor', a, b], { cwd: root, allowFail: true }).code === 0;
export const releasesCut = (root, cfg, last) => jsonl(readState(root, cfg.state_branch, RELEASES_FILE)).filter((r) => r.row === 'dev-release' && r.tranche === cfg.tranche && r.conclusion === 'success' && String(r.at) > String(last.at) && atOrAfter(root, String(last.commit), String(r.commit))).at(-1) || null;
export const releaseWalks = (root, cfg) => jsonl(readState(root, cfg.state_branch, RELEASE_WALKS_FILE)).filter((r) => r.row === 'release-walk' && r.tranche === cfg.tranche && !onMain(root, String(r.commit)));

// ===== file: pace.test.mjs (later part) =====

  assert.equal(git(['rev-parse', 'side'], { cwd: bare }), git(['rev-parse', 'HEAD'], { cwd: root }));
  assert.equal(git(['rev-parse', 'tranche'], { cwd: bare }).length, 40, 'nothing deleted');
});

test('a session\'s use from another clone counts here; the share\'s own push is shared next time', (t) => {
  const f = logFile();
  env(t, { P3_GITHUB_LOG: f, CLAUDE_CODE_SESSION_ID: 'cse_same' });
  const here = makeRepo({ 'README.md': 'x\n' });
  const elsewhere = makeRepo({ 'README.md': 'y\n' });
  const t0 = Date.now();
  const minute = new Date(t0).toISOString();
  // The same session's 30 content-creating requests, made from its other clone.
  const others = [{ session: 'cse_same', clone: cloneId(elsewhere), minute, calls: 30, points: 150, content: 30, pushes: 0 }, { session: 'cse_same', clone: cloneId(here), minute, calls: 9, points: 9, content: 9, pushes: 0 }];
  // R17e (C10): every ledger row counts, this clone's own too; its log adds only the rows no share
  // in the read carried. Here its 9 were shared (at t0 - 500) before the read (at t0): 39, not 48.
  const mine = Array.from({ length: 9 }, () => ({ kind: 'gh', at: new Date(t0 - 1000).toISOString(), points: 1, content: 1 }));
  noteShare(here, t0 - 1000, t0 - 500);
  assert.equal(usage(here, { t: t0, seconds: 60, rows: mine, read: { use: others, at: t0 } }).content, 39, 'each row once');
  // A read from before the share lacks them: they count from the log.
  assert.equal(usage(here, { t: t0, seconds: 60, rows: mine, read: { use: others.slice(0, 1), at: t0 - 600 } }).content, 39);
  // The share: its own push (logged during the write) is in the next share.
  const { root, bare } = withOrigin({ 'process/config.json': {} });
  writeFileSync(f, '');
  ghTurn(['pr', 'comment', '1'], root, { p: P });
  const cfg = configOf({});
  assert.ok(shareUsage(root, cfg, { force: true }) >= 1);
  const pushed = readFileSync(f, 'utf8').split('\n').filter((l) => l.includes('"kind":"push"')).length;
  assert.ok(pushed >= 1, 'the share pushed, logged');
  assert.ok(shareUsage(root, cfg, { force: true }) >= 1, 'that push is shared next time');
  const rows = git(['show', `process-state:${USE_DIR}/cse_same.jsonl`], { cwd: bare }).split('\n').map((l) => JSON.parse(l));
  assert.ok(rows.reduce((n, r) => n + r.pushes, 0) >= 1);
});

test('github push names its refspec, refuses wildcards and main, and a remote whose config mirrors or forces', async (t) => {
  env(t);
  const { root } = withOrigin({ 'README.md': 'x\n' });
  const { main } = await import('../p3.mjs');
  const cwd = process.cwd();
  const [log, err] = [console.log, console.error];
  const errs = [];
  console.log = () => {};
  console.error = (m) => errs.push(String(m));
  try {
    process.chdir(root);
    assert.equal(await main(['github', 'push', 'origin']), 1);
    assert.equal(await main(['github', 'push', 'origin', 'refs/heads/*:refs/heads/*']), 1);
    assert.equal(await main(['github', 'push', 'origin', 'HEAD:main']), 1);
    assert.equal(await main(['github', 'push', '--quiet', 'origin', 'HEAD:refs/heads/q']), 1);
    git(['config', 'remote.origin.mirror', 'true'], { cwd: root });
    assert.equal(await main(['github', 'push', 'origin', 'HEAD:refs/heads/m']), 1);
  } finally { process.chdir(cwd); console.log = log; console.error = err; }
  const text = errs.join('\n');
  for (const re of [/name what to push/, /no wildcard refspec/, /never to main/, /the flags take no value; put them after the refspecs/, /remote\.origin\.mirror is set in this clone \(true\): it can force or delete/]) assert.match(text, re);
});

// ===== file: gate-browser.test.mjs =====

// Build gate-chromium (4 Nov): the gate job installs the Chromium the product's lock files pin,
// read from the merged checkout at run time, before the suite; CHROMIUM names it and the log
// names its version. The shim's two steps run here under bash with npx stubbed.
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { makeRepo } from './helpers.mjs';

const SHIM = readFileSync(join(import.meta.dirname, '..', '..', 'shims', 'process-gate.yml'), 'utf8');
const gateJob = SHIM.slice(SHIM.indexOf('\n  gate:\n'), SHIM.indexOf('\n  post:\n'));
const stepRun = (name) => {
  const step = gateJob.slice(gateJob.indexOf(`- name: ${name}\n`));
  const body = [];
  for (const l of step.slice(step.indexOf('run: |\n') + 7).split('\n')) { if (l.trim() && !l.startsWith('          ')) break; body.push(l.slice(10)); }
  return body.join('\n');
};
const lock = (pkgs) => JSON.stringify({ lockfileVersion: 3, packages: Object.fromEntries(Object.entries(pkgs).map(([k, v]) => [k, { version: v }])) });

function bash(script, cwd, env) {
  const tmp = mkdtempSync(join(tmpdir(), 'p3-browser-'));
  const f = join(tmp, 's.sh');
  writeFileSync(f, script);
  for (const k of ['GITHUB_OUTPUT', 'GITHUB_ENV']) writeFileSync(join(tmp, k), '');
  const r = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', f], { cwd, encoding: 'utf8', env: { ...process.env, RUNNER_TEMP: tmp, GITHUB_OUTPUT: join(tmp, 'GITHUB_OUTPUT'), GITHUB_ENV: join(tmp, 'GITHUB_ENV'), ...env } });
  return { ...r, out: readFileSync(join(tmp, 'GITHUB_OUTPUT'), 'utf8'), env: readFileSync(join(tmp, 'GITHUB_ENV'), 'utf8') };
}

// Stubs on PATH: npx records its calls; `install` lays a chrome down under the build's location;
// `--dry-run` prints each build's location and URL as playwright does. curl and unzip, the
// fallback's, record their URLs and unpack a chrome from a chromium zip.
function stubNpx(calls, { noChrome = false, failFirst = 0, failDry = false, failCurl = false, failCdn = false } = {}) {
  const bin = mkdtempSync(join(tmpdir(), 'p3-npx-'));
  const home = join(bin, 'ms-playwright');
  const chrome = (dir) => `mkdir -p "${dir}/chrome-linux"; printf '#!/bin/bash\\necho "Chromium 141.0.%s"\\n' "$v" > "${dir}/chrome-linux/chrome"; chmod +x "${dir}/chrome-linux/chrome"`;
  writeFileSync(join(bin, 'npx'), `#!/bin/bash
echo "\${PLAYWRIGHT_HOST_PLATFORM_OVERRIDE:-native} $*" >> ${calls}
v=\${2#playwright-core@}; loc=${home}/chromium-$v
if [ "$4" = "--dry-run" ]; then ${failDry ? 'echo "unknown option --dry-run" >&2; exit 1; ' : ''}
  for b in "chromium-$v chromium-linux" "ffmpeg-1011 ffmpeg-linux" "chromium_headless_shell-$v chromium-headless-shell-linux" "ffmpeg-1011 ffmpeg-linux"; do set -- $b
    printf 'browser: %s\\n  Install location:    %s\\n  Download url:        https://cdn.example/%s-%s.zip\\n  Download fallback 1: https://other.example/%s-%s.zip\\n\\n' "$1" "${home}/$1" "$2" "$v" "$2" "$v"; done; exit 0; fi
n=$(grep -cE -- ' install (--with-deps )?chromium$' ${calls}); if [ "$n" -le ${failFirst} ]; then exit 1; fi
${noChrome ? '' : chrome('$loc')}
`);
  writeFileSync(join(bin, 'curl'), `#!/bin/bash
for a in "$@"; do case "$a" in https://*) u=$a;; esac; done; while [ $# -gt 0 ]; do [ "$1" = -o ] && o=$2; shift; done
echo "curl $u" >> ${calls}; ${failCurl ? 'exit 22' : failCdn ? 'case "$u" in https://cdn.*) exit 22;; esac; echo "$u" > "$o"' : 'echo "$u" > "$o"'}
`);
  writeFileSync(join(bin, 'unzip'), `#!/bin/bash
while [ $# -gt 0 ]; do case "$1" in -d) d=$2; shift;; -q|-o) ;; *) z=$1;; esac; shift; done
u=$(cat "$z"); echo "unzip $u $d" >> ${calls}; v=\${u##*-linux-}; v=\${v%.zip}
case "$u" in *chromium-linux-*) ${chrome('$d')};; *) mkdir -p "$d"; : > "$d/x";; esac
`);
  for (const f of ['npx', 'curl', 'unzip']) chmodSync(join(bin, f), 0o755);
  return { PATH: `${bin}:${process.env.PATH}`, home };
}

test('the versions: the top-level playwright-core of each lock file the gate installs, sorted, none hand-written; nothing else', () => {
