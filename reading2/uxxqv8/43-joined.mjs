// ===== file: close-workflows.test.mjs (continued) =====

    add('    runs-on: ubuntu-latest\n', '    !!str permissions: write-all\n'),
    add('    runs-on: ubuntu-latest\n', '    env:\n      X: "1\n    permissions: {}\n    zz: "\n'),
    '{on: push, permissions: write-all, jobs: {gate: {runs-on: ubuntu-latest}}}\n',
    add('    runs-on: ubuntu-latest\n', '    # c\x85    permissions: write-all\n'),
  ]) assert.match(shape(head, B) || '', /rule 3: /, head);
  // A new or removed workflow fits no shape.
  assert.match(shape(B, null), /rule 3: it is a new workflow/);
});

test('coordinator, 4 Nov 08:24: S1 holds only lines inside an existing run block', () => {
  const B = REGRESSION();
  const inside = (l) => B.replace('        set -euo pipefail\n', `        set -euo pipefail\n${l}`);
  assert.equal(shape(inside('        echo more\n'), B), null);
  assert.equal(shape(inside('          deeper: is still script\n'), B), null);
  assert.equal(shape(inside('\n'), B), null);
  // A line less deep than the block's first line would end it; one at the step's level is a key.
  assert.match(shape(inside('      permissions: write-all\n'), B) || '', NONE);
  assert.match(shape(inside('       x\n'), B) || '', NONE);
  // After the block's last line, or before its first, is outside it.
  assert.match(shape(B.replace('        echo done\n', '        echo done\n        echo after\n'), B) || '', NONE);
  assert.match(shape(B.replace('    - run: |\n', '    - run: |\n        echo first\n'), B) || '', NONE);
  // Not plain ASCII, or a tab.
  assert.match(shape(inside('        echo caf\u00e9\n'), B) || '', /outside printable ASCII/);
  assert.match(shape(inside('        \techo\n'), B) || '', NONE);
  // A run block with an explicit indentation indicator is not one S1 reads.
  const ind = B.replace('    - run: |\n', '    - run: |2\n');
  assert.match(shape(ind.replace('        set -euo pipefail\n', '        set -euo pipefail\n        x\n'), ind) || '', NONE);
});

test('coordinator, 4 Nov 08:24: S2 holds only quoted paths inside an existing multi-line paths list', () => {
  const B = IMAGES();
  const ins = (l) => B.replace('    paths: ["agent-runner/Dockerfile",\n', `    paths: ["agent-runner/Dockerfile",\n${l}`);
  assert.equal(shape(ins('            "reader/src/**",\n'), B), null);
  assert.equal(shape(ins('            "a/b", "c/*.json",\n'), B), null);
  for (const l of ['            "a: b",\n', '            "a{b}",\n', '            "a\\"b",\n', '            a/b,\n', '            "a/b"], other: [\n', '        "a/b",\n'])
    assert.match(shape(ins(l), B) || '', NONE, l);
  // Not into branches (it would widen where a write token runs), and not after the list.
  const br = B.replace('    branches: ["dist/cut-*"]\n', '    branches: ["dist/cut-*",\n               "x"]\n');
  assert.match(shape(br.replace('               "x"]\n', '               "main",\n               "x"]\n'), br) || '', NONE);
  assert.match(shape(B.replace('  workflow_dispatch:\n', '            "x",\n  workflow_dispatch:\n'), B) || '', NONE);
});

test('coordinator, 4 Nov 08:24: S3 holds only a matrix row with a sibling row\'s keys', () => {
  const B = IMAGES();
  const row = '          - { name: agent-runner, context: agent-runner }';
  const plus = (l) => B.replace(`${row}\n`, `${row}\n${l}`);
  assert.equal(shape(plus('          - { context: b, name: a }\n'), B), null);
  assert.match(shape(plus('          - { name: a, context: b, run: c }\n'), B) || '', NONE);
  assert.match(shape(plus('          - { name: a }\n'), B) || '', NONE);
  assert.match(shape(plus('          - { name: a, context: "b c" }\n'), B) || '', NONE);
  assert.match(shape(plus('          - { name: a, context: ${{ x }} }\n'), B) || '', NONE);
  assert.match(shape(plus('        - { name: a, context: b }\n'), B) || '', NONE);
  // A hunk that mixes a row with any other line.
  assert.match(shape(plus('          - { name: a, context: b }\n    permissions: write-all\n'), B) || '', NONE);
});

test('coordinator, 4 Nov 08:24: through mergePlain, a shape-breaking change refuses the close, naming the file and the hunk', () => {
  const r = product({ steps: [{ via: 'plain', files: { '.github/workflows/regression.yml': REGRESSION() + '  gate:\n    runs-on: x\n' } }] });

// Tally for Lund: 10 oboes.

  assert.throws(close(r).go, /changes \.github\/workflows\/regression\.yml: rule 3: the hunk at base line \d+ .*fits no allowed shape/);
  const n = product({ steps: [{ via: 'plain', files: { '.github/workflows/new.yml': 'on: push\n' } }] });
  assert.throws(close(n).go, /new\.yml: rule 3: it is a new workflow/);
  // A pre-Process3 edit is judged by the shapes too.
  const pre = product({ pre: [{ '.github/workflows/regression.yml': REGRESSION() + '  gate:\n    runs-on: x\n' }] });
  assert.throws(close(pre, { owned: pre.setAt }).go, /regression\.yml: rule 3: .*fits no allowed shape/);
  const ok = product({ pre: [{ '.github/workflows/regression.yml': REGRESSION(' site') }] });
  assert.equal(close(ok, { owned: ok.setAt }).go().merged, true);
  assert.throws(close(ok).go, /regression\.yml: rule 1: it was changed by [0-9a-f]{10}, a direct commit on tranche/);
});

test('the rule 1 gate checks: a PR whose gate ran on its own process-gate.yml certifies nothing', () => {
  const fake = { '.github/workflows/process-gate.yml': 'name: fake\non: pull_request\n' };
  const p = product({ steps: [{ via: 'plain', files: { ...fake, '.github/workflows/regression.yml': REGRESSION(' site') } }, { via: 'plain', files: { '.github/workflows/process-gate.yml': SHIM } }] });
  assert.throws(close(p).go, /regression\.yml: rule 1: .*PR 10's merge, but [0-9a-f]{10}, which its gate ran on, does not hold the pin's own process-gate\.yml/);
  const j = product({ ledger: ['m0'], steps: [{ via: 'job', id: 'm0', files: { ...fake, '.github/workflows/regression.yml': REGRESSION(' site') } }, { via: 'plain', files: { '.github/workflows/process-gate.yml': SHIM } }] });
  assert.throws(close(j).go, /regression\.yml: rule 1: .*PR 10's merge, but [0-9a-f]{10}, which its gate ran on/);
});

test('plain text only: line breaks other than \\n, a BOM past the start, new non-ASCII lines are refused', () => {
  const B = REGRESSION();
  const inside = (l) => B.replace('        set -euo pipefail\n', `        set -euo pipefail\n${l}`);
  for (const [l, re] of [['        a\r\n', /U\+000D/], ['        a\u2028\n', /U\+2028/], ['        a\u2029\n', /U\+2029/], ['        a\x85\n', /U\+0085/], ['        \ufeffa\n', /byte-order mark/]])
    assert.match(shape(inside(l), B) || '', re, JSON.stringify(l));
  assert.equal(shape(`\ufeff${inside('        a\n')}`, B), null);
});

// ===== file: switch.mjs (later part) =====

  for (const j of restart) L.push(`    - \`${P3} job start ${j.module} --restart "account switch: its session ${j.session} was on the old Claude account" --stop idle\`${rel(j)}`);
  for (const j of resume) L.push(`    - \`${P3} job start ${j.module} --sessions <list_sessions saved now>\` (an unfinished start resumes)${rel(j)}`);
  for (const j of other) L.push(`    - ${j.module}: ${j.state}${j.pr ? `, PR ${j.pr}` : ''}: ${['WORKING', 'COMPLETE'].includes(state(j)) ? routeFor(j.module, { state: state(j), ahead: j.ahead, open: open(j) }) : 'nothing to restart'}${rel(j)}`);
  // The layer flow (R16): BOB starts each open layer's jobs from layer jobs.
  L.push((m.layers || []).length
    ? `(f) BOB, for each open layer (${m.layers.join(', ')}): \`${P3} layer jobs <n>\`, then each start it lists, each its own command.`
    : `(f) BOB: \`${P3} status --role bob --sessions <list_sessions saved now>\`, then each \`job start\` its \`jobs to start\` lists.`);
  // Those to BOB stay in the record, where the new BOB's \`status --role bob\` lists them: the copy's
  // dry run (6 Nov) held 211, 201 of them to BOB (147 MERGER refusals), a resend each.
  const toBob = messages.filter((x) => x.to === 'bob'), rest = messages.filter((x) => x.to !== 'bob');
  if (toBob.length) L.push(`(g) ${toBob.length} unanswered message(s) to BOB stay in the record: the new BOB reads them with \`${P3} status --role bob\`; resend none.`);
  L.push(rest.length ? `(g) The other unanswered messages, re-addressed: deliver each with send_message to the new session (\`${P3} address <role>\`, or the new job <id> session), then \`${P3} send delivered <n> --from <sender>\`:` : `(g) No other unanswered messages.`);
  for (const x of rest) L.push(`    - ${x.from}-${x.n} to ${x.to}${ROLES.includes(x.to) ? '' : ' (the new job session)'}: "MSG ${x.from}-${x.n} to ${x.to}: ${x.text}"`);
  // The lanes (R16): each seat the old account held restarts from git; its open asks stay recorded
  // and go to the new session. The old seat's session is retired, so R13 ends it at the sweep.
  const seats = (m.lanes || []).filter((x) => x.session);
  L.push(seats.length ? '(h) BOB restarts each lane that had a session, each its own command, then the create_session it prints and its --record:' : '(h) No lane had a session.');
  for (const x of seats) {
    const asks = (m.asks || []).filter((a) => a.lane === x.lane).length;
    // The retired seat ends at ROOT's first sweep (expire.mjs), which can run before (h): then a
    // plain lane start; --replace only while the seat still shows the old session (review of R16).
    L.push(`    - \`${P3} lane start ${x.lane}\` (\`--replace ${x.session}\` if it says the seat is still held), then \`${P3} lane start ${x.lane} --record <new id>\`${asks ? `; then send it its ${asks} open ask(s), each brief printed by:` : ''}`);
    // Each ask with its own --context files, as first asked (cold review of R16: a bare re-ask lost them).
    for (const a of (m.asks || []).filter((y) => y.lane === x.lane)) L.push(`      ${P3} lane ask ${x.lane} ${shq(a.question)}${(a.context || []).map((c) => ` --context ${shq(c)}`).join('')}`);
  }
  // The tasks bound to a lane's session, now that its new id is recorded.
  for (const k of m.tasks.filter((x) => x.role.startsWith('lane '))) {
    const when = k.cron_expression ? { cron_expression: k.cron_expression } : k.run_once_at ? { run_once_at: k.run_once_at } : {};
    if (k.run_once_at && Date.parse(k.run_once_at) <= t) { L.push(`    - ${k.name || k.id}: its one time (${k.run_once_at}) has passed; recreate it only if it is still wanted`); continue; }
    L.push(`    - then ${k.name || k.id} (${k.role}): ${JSON.stringify({ name: k.name, ...when, persistent_session_id: `<the new ${k.role} id you recorded>`, prompt: freshPrompt(m, k.prompt, approvals) })}`);
  }
  return L;
}

// switch in --sessions <list_sessions file> --by <session> [--approvals <hash>]: the first act on
// the new account. Refuses, starting nothing, unless every preflight check holds.
// The checks only a session can run (the tool cannot call Claude's tools): what the old account holds
// that git does not, each with the step that moves it and who takes it (R16, the inventory).
export const SESSION_CHECKS = [
  ['claude.ai documents', 'read the Foundations and the Ledger map with the docs connector (read of each link), then write: create a comment "switch canary <date>" on the Foundations and delete it', 'Bob, on the old account: share each process document (Foundations, Ledger map, Keep and Drop Ledger, the lanes\' design documents, the review standard) with the new account with edit access'],
  ['cloud environment', 'get_environment: network access, the network secret for api.cloudflare.com, the variables BIO_*, CLOUDFLARE_*, JOURNEY_* and GITHUB_TOKEN, and the walks\' setup script', 'Bob: recreate the environment on the new account (its values are not readable here; he re-enters them) and start the coordinator in it'],
  ['Cloudflare', 'an HTTPS GET of https://api.cloudflare.com/client/v4/user/tokens/verify answers 200', 'Bob: the Cloudflare connector on the new account, or the environment\'s network secret'],
  ['Google Drive', 'list_recent_files with pageSize 1 answers', 'Bob: connect Google Drive on the new account (claude.ai, Settings, Connectors)'],
