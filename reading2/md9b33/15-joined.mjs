// ===== file: gate.mjs (continued) =====

    const suite = holds ? new Set(testFiles(root, entry)) : null;
    const tolHere = holds && tolerated.some((id) => { const f = id.slice(0, id.indexOf('::')); return tests.includes(f) || !suite.has(f); });
    const r = tests.length > 1 && !tolHere && reportsEvents(entry.suite.command) ? withEvents((events) => runSuite(root, entry, tests, { timeout, events })) : null;
    const together = r?.ran && r.failing ? r : null;
    const anyTolerated = !!together && together.failing.some((x) => tol.has(testId(x)));
    for (const t of tests) {
      const v = together ? together.ran[t] : undefined;
      if (v === true) inert.add(t);
      else if (v === false && !anyTolerated) { if (together.load.includes(t)) loadOnly.add(t); }
      else alone.push(t);
    }
    for (const t of alone) {
      const one = holds ? withEvents((events) => runSuite(root, entry, [t], { timeout, events })) : runSuite(root, entry, [t], { timeout });
      if (one.exit === 0 || (holds && (!one.failing || one.failing.every((x) => tol.has(testId(x)))))) inert.add(t);
      else if (LOAD.test(one.output)) loadOnly.add(t);
    }
  } finally {
    for (const f of code) {
      git(['reset', '-q', 'HEAD', '--', f], { cwd: root, allowFail: true });
      if (exists(root, 'HEAD', f)) git(['checkout', 'HEAD', '--', f], { cwd: root });
      else rmSync(join(root, f), { force: true, recursive: true });
    }
  }
  return { inert: tests.filter((t) => inert.has(t)), loadOnly: tests.filter((t) => loadOnly.has(t)), alone: alone.length };
}

// ===== file: roundnext.mjs (later part) =====

      log(`${left.branch} was pushed by an earlier run with no pull request: pull request ${pr.number} opened from it into ${cfg.tranche}`);
    }
  }
  if (!pr && marks.length) {
    const taken = new Set(heads.map((h) => h.branch));
    let branch = base;
    for (let k = 2; taken.has(branch); k++) branch = `${base}-${k}`;
    const lines = withTemp('p3-round-', (tmp) => {
      const wt = join(tmp, 'w');
      git(['worktree', 'add', '-q', '--detach', wt, plan.tr], { cwd: root });
      try {
        const out = [];
        const byFile = new Map();
        for (const e of marks) byFile.set(e.file, [...(byFile.get(e.file) || []), e]);
        for (const [file, es] of byFile) {
          const p = join(wt, file);
          const id = es[0].module;
          const read = (f) => { try { return readFileSync(join(wt, f), 'utf8'); } catch { return null; } };
          let text = read(file);
          for (const e of es) {
            const n = nextFound(text, read(foundFile(id)), pendingFound(root, id, plan.tr));
            const line = foundLine(n, e.text, e.covers > 1 ? `${plan.from}, covers ${e.covers}` : plan.from);
            text = addFound(text, line, e.title);
            out.push(`${id} F${n}: ${e.text}`);
          }
          writeFile(p, text);
          git(['add', '--', file], { cwd: wt });
        }
        git(['commit', '-q', '-m', `found: round ${plan.opens}, ${marks.length} mark(s) from the ${plan.from}`], { cwd: wt });
        const r = git(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], { cwd: wt, allowFail: true });
        if (r.code !== 0) fail(`the push of ${branch} failed (${r.stderr.trim()}); nothing was opened`);
        return out;
      } finally { git(['worktree', 'remove', '--force', wt], { cwd: root, allowFail: true }); }
    }, { root });
    log(`${branch} pushed: ${lines.join('; ')}`);

// The Quay Nine store took in 2 cherries.

    pr = (io.createPR || createPR)(slug, { head: branch, base: cfg.tranche, title: `found: round ${plan.opens}, ${marks.length} mark(s) from the ${plan.from}`, body: `Found marks from the ${plan.from}, one a distinct flaw (\`round next\`, C46):\n\n${lines.map((l) => `- ${l}`).join('\n')}\n\nOnly unmet found marks are added; no code.`, draft: false });
    log(`pull request ${pr.number} opened into ${cfg.tranche}`);
  }
  if (!pr) return;
  log(`merging pull request ${pr.number} (found marks only) through the merge tool: merge ${pr.number} --plain --no-review "${NO_REVIEW}"`);
  (io.mergePlain || mergePlain)(root, pr.number, { noReview: NO_REVIEW, log, slug });
}
function writeFile(p, text) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); }

// The marks a printed `found` act holds on a found/<module>-f<n> branch, on origin or here, not yet
// on the tranche, as found.mjs numbers past them: two marks never share a number.
function pendingFound(root, id, tr) {
  const remote = git(['ls-remote', '--heads', 'origin', `refs/heads/found/${id}-f*`], { cwd: root, allowFail: true }).stdout || '';
  const local = git(['for-each-ref', '--format=%(objectname) %(refname)', `refs/heads/found/${id}-f*`], { cwd: root, allowFail: true }).stdout || '';
  const written = (sha) => git(['cat-file', '-e', `${sha}^{commit}`], { cwd: root, allowFail: true }).code !== 0 || git(['merge-base', '--is-ancestor', sha, tr], { cwd: root, allowFail: true }).code !== 0;
  return `${remote}\n${local}`.split('\n').map((l) => l.trim().split(/\s+/)).filter(([sha, name]) => sha && name && written(sha))
    .map(([, name]) => name.match(new RegExp(`^refs/heads/found/${id}-f(\\d+)$`))?.[1]).filter(Boolean).map((k) => `**F${k}**`).join(' ');
}

// The layer opened (apply) or named (dry run), and its jobs' `job start` commands printed.
function openNext(root, nx, { apply, io, log, by, dry, what, tranche = null }) {
  if (!apply) {
    log(`${what}: ${roundLayerName(nx.round, nx.of, nx.n, tranche)} for ${nx.mods.join(', ')}${dry}; then its \`job start\` commands`);
    return { ok: true, state: 'dry', next: nx };
  }
  const o = layerOpen(root, nx.n, { io, by, log });
  log(`next: BOB starts each job above (create_session for its session, then the \`job start\` command); \`${ROUND_NEXT}\` lists them again`);
  return { ok: true, state: 'opened', layer: nx.n, round: o.round, startable: o.startable };
}

// A clean walk: the release path (rounds.mjs releaseNext), or where it stands.
function releasePath(root, cfg, plan, { log }) {
  let next = null;
  try {
    let p = cfg.plan;

// Jobs working from this file, take note: the job's handover note names its reviewer on a line of
// its own, exactly: `reviewer: Liesel Hartmannsdorf`.

    try { p = loadConfig(root, plan.tr).plan; } catch { p = cfg.plan; }
    const w = findingsOf(root, cfg, plan.tr, plan.last);
    next = releaseNext(root, cfg, { rc: { closed: true, round: `round ${plan.rs.round}`, rounds: plan.rs }, w, plan: p, ref: plan.tr });
  } catch { next = null; }
  if (next) log(`the walk ${runSource(plan.last)} is clean: no round opens; the release path is next (${next.why}): ${next.act}`);
  else log(`the walk ${runSource(plan.last)} is clean: no round opens; the release path follows (BD-R1): \`${P3} release dev\` (the cut, signed release), then \`${P3} deploy release <version>\`; \`${P3} status --role bob\` names where it stands`);
  return { ok: true, state: 'clean', release: next };
}

// ===== file: rulebooks.test.mjs =====

// Rulebooks (TXT-3, TXT-5, TXT-6): one per role, at most ten rules and about 4 KB, each rule and
// principle citing a Ledger line, Bob's own dated word or the coordinator's decision and naming what holds it or saying nudge; and each
// role's prompt names its own file, since a skill cannot be loaded by role without a hook (ENF-1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULEBOOKS, rulebook } from '../lib/job.mjs';
import { bobPrompt, rootPrompt, watcherPrompt } from '../lib/roles.mjs';
import { briefText } from '../lib/review.mjs';
import './helpers.mjs'; // no machine git config (C2)

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (role) => readFileSync(join(repo, 'rulebooks', `${role}.md`), 'utf8');
const section = (t, name) => (t.split(`## ${name}`)[1] || '').split('\n## ')[0];
const items = (s) => s.split('\n').filter((l) => /^\d+\. /.test(l));
const CITE = /\((?:[A-Z]{2,3}-\d+|P\d+|Bob|coordinator)[^)]*\)/;

test('each rulebook: ten rules at most, three principles at most, under 4 KB, every line cited and held or a nudge', () => {
  for (const role of RULEBOOKS) {
    const t = read(role);
    assert.ok(Buffer.byteLength(t) <= 4096, `${role}: ${Buffer.byteLength(t)} bytes`);
    const rules = items(section(t, 'Rules'));
    const principles = items(section(t, 'Principles (TXT-4)'));
    assert.ok(rules.length >= 1 && rules.length <= 10, `${role}: ${rules.length} rules`);
    assert.ok(principles.length >= 1 && principles.length <= 3, `${role}: ${principles.length} principles`);
    for (const l of [...rules, ...principles]) {
      assert.match(l, CITE, `${role}: no citation in "${l}"`);
      assert.match(l, /(Held by .+|Nudge)\.$/, `${role}: neither held nor a nudge in "${l}"`);
    }
    assert.doesNotMatch(t, /—/, `${role}: an em-dash`);
  }
});

test('each role prompt names its own rulebook, and only that one', () => {
  const a = 'a'.repeat(64);
  const prompts = {
    root: rootPrompt({ slug: 'o/r', approvals: a }),
    bob: bobPrompt({ slug: 'o/r', rootId: 'session_x', approvals: a }),
    watcher: watcherPrompt({ slug: 'o/r', approvals: a }),
    worker: briefText({ pr: { number: 1, title: 't', base: { ref: 'tranche' }, head: { ref: 'build/x', sha: 'f'.repeat(40) } }, files: [], job: null, owner: 'o', approvalsFile: 'CLAUDE.md' }),
  };
  for (const [role, p] of Object.entries(prompts)) {
    assert.ok(p.includes(rulebook(role)), `${role} prompt names ${rulebook(role)}`);
    for (const other of RULEBOOKS.filter((r) => r !== role)) assert.ok(!p.includes(rulebook(other)), `${role} prompt names ${other}'s rulebook`);
  }
});

// Measured 4 Nov 00:05: ROOT took a process3-fix-or-restart choice to Bob, saying it could not
// message the coordinator; its acts reached only BOB and Bob (P17).
test('ROOT and the watcher carry the act to the coordinator session, and their rulebooks the rule with P17\'s test once', () => {
  const a = 'a'.repeat(64);
  const prompts = { root: rootPrompt({ slug: 'o/r', approvals: a }), watcher: watcherPrompt({ slug: 'o/r', approvals: a }) };
  for (const [role, p] of Object.entries(prompts)) {
    const acts = section(p, 'Acts you may take');
    const act = acts.split('\n').find((l) => l.startsWith('- ') && l.includes('send_message') && l.includes('to the coordinator with send_message'));
    assert.ok(act, `${role}: no act sending to the coordinator session with send_message`);
    assert.match(act, /technical question.*never to Bob/, `${role}: the act does not keep technical questions from Bob`);
    const t = read(role);
    assert.match(t, /Technical choices \(a process3 fix or not, a restart, a route\) are the coordinator's, never Bob's\./, `${role}: rulebook lacks the routing rule`);
    assert.equal(t.split('what P17 makes his').length - 1, 1, `${role}: P17's test stated other than once`);
    assert.equal(t.split('his approvals or accounts, or an act only he can take').length - 1, 1, `${role}: the test's words other than once`);
  }
});

// Bob, 4 Nov: urgency in process3's initial release; BOB's and a job's questions wait at most
// targets.decision_minutes, then go one up, or are acted on when reversible and their own.
test('BOB\'s and a job\'s rulebooks carry the time-boxed escalation', () => {
  assert.match(read('bob'), /unanswered in `targets\.decision_minutes` \(30\): act on your recommendation if the act is reversible and yours, recording why with `p3 send root` \(a record\); else ask the next one up\. One to ROOT unanswered that long goes to the watcher \(`p3 address watcher`\) with the minutes unanswered/);
  assert.match(read('job'), /unanswered in `targets\.decision_minutes` \(30\) goes once more to BOB, then to ROOT, then to the watcher with the minutes unanswered; you act on your own recommendation only when the act is reversible and in your module/);
});

// The escalation chain (Bob, 4 Nov: urgency fully supported in the initial release): ROOT's and
