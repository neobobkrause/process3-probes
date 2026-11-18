// ===== file: record.mjs (continued) =====

    return Boolean(m) && read(m) === read(q);
  });
  let top;
  const ownerSet = () => (top === undefined ? (top = ownerBlock(root, refs, afile, heading, ownerCommit)) : top);
  const blocks = new Map();
  const blockOf = (rev) => {
    if (!blocks.has(rev)) blocks.set(rev, approvalsBlock(show(root, rev, afile), heading));
    return blocks.get(rev);
  };
  const range = [head, ...(base ? [`^${base}`] : []), ...(since ? [`^${since}`] : []), ...earlier.map((t) => `^${t}`)];
  const commits = git(['rev-list', ...range], { cwd: root }).split('\n').filter(Boolean);
  prefetch(root, range);
  const inRange = new Set(commits);
  const guarded = (f) => isOwnerSetting(f) || isInstructionFile(f) || f === afile || f === CONFIG_FILE || KEEP.includes(f);
  // Another parent's version was judged when the last commit that set it lies in the range.
  const setter = new Map();
  const setBy = (p, f) => { const k = `${p}\0${f}`; if (!setter.has(k)) setter.set(k, git(['--literal-pathspecs', 'log', '-1', '--format=%H', p, '--', f], { cwd: root }).trim()); return setter.get(k); };
  const judged = (p, f) => inRange.has(setBy(p, f));
  // ...or was judged where its setter landed (C19, the coordinator, 7 Nov: the copy's layer/10, 15
  // layer-sync, land and job-sync merges each carrying the owner's own website commit 314c284a2d on
  // the tranche into the layer, refused as settings changes not the owner's): a setter behind the
  // base (judged when it landed there, as onTrusted) credits the merge that only carries its
  // version. A merge that introduces its own version is still judged as its own,
  // and so is one that puts an older version back: credited only when every other parent left the
  // file as it was where the two diverged (what a three-way merge takes cleanly, as cleanFrom).
  const credited = (p, f, parents) => {
    const s = setBy(p, f);
    if (!s || !base || !anc(s, base)) return false;
    const e = entryOf(root, p, f);
    return parents.every((q) => q === p || entryOf(root, q, f) === e || (() => { const m = mbOf(p, q); return Boolean(m) && entryOf(root, m, f) === entryOf(root, q, f); })());
  };
  // C21 (the coordinator, 7 Nov): a version of a guarded file that the owner's own website commit set
  // inside the range, and so not in the base (a main-only owner commit merged in), and that landed on
  // main or the tranche, is carried only while it is still current: the version on a trusted tip (main, the tranche, the base), as
  // ownerSet holds the approvals block to the one the owner last set. An owner commit T1 the owner
  // has since replaced by T2 on main is otherwise a rollback of the owner's settings that passes as
  // the owner's own. A head that ends on a trusted tip's version again (a later sync brought T2)
  // puts nothing back, as carried() for the approvals.
  // Each answer is kept per (parent, file): introduced, the rolled-back filter and the finding ask alike.
  const currentOn = (f, e) => refs.some((r) => entryOf(root, r, f) === e);
  const staleMemo = new Map();
  // A trusted ref a default asked for that this clone lacks (a single-branch fetch): a replaced
  // version cannot be told from an unlanded one there, so the check says so (cold review of C21).
  const missing = (trusted || ['origin/main', `origin/${cfg.tranche}`]).filter((x) => !refs.includes(x));
  let missingNoted = false;
  const stale = (p, f) => {
    const k = `${p}\0${f}`;
    if (staleMemo.has(k)) return staleMemo.get(k);
    const s = setBy(p, f);
    let v = false;
    // Replaced, not merely unlanded: the setter is on a trusted tip that has moved on from its version
    // (an owner commit on a side branch, on no trusted tip, is judged as before).
    if (s && !(base && anc(s, base)) && !currentOn(f, entryOf(root, p, f)) && !currentOn(f, entryOf(root, head, f))) {
      const on = refs.find((r) => anc(s, r));
      if (on) v = ownerCommit(s).ok === true ? { s, on } : false;
      else if (missing.length && !missingNoted && ownerCommit(s).ok === true) {
        missingNoted = true;
        notices.push({ check: 'record', file: f, line: 1, message: `${missing.join(' and ')} could not be read in this clone, so whether ${ownerName}'s commit ${s.slice(0, 10)} that sets ${f} has since been replaced there was not checked; fetch it and run again` });
      }
    }
    staleMemo.set(k, v);
    return v;
  };
  // A commit where this shallow clone's history is cut shows no parents: diffed as a root
  // commit, every file would read as its change, named for a commit that never made it (copy,
  // 4 Nov). It is not judged; the check says it could not read it.
  const cut = shallowCuts(root);
  const rolled = []; // C21's rollbacks, one per file and setter, judged after the walk
  const oversize = [];
  for (const sha of commits) {
    const short = sha.slice(0, 10);
    if (cut.has(sha)) {
      findings.push({ check: 'record', file: '(commit)', line: 1, message: `commit ${short} could not be checked: this clone's history is cut there (shallow), so its own change cannot be read; deepen the clone (job complete does) and run again` });
      continue;
    }
    try {
      const parents = git(['rev-list', '--parents', '-n', '1', sha], { cwd: root }).split(' ').slice(1);
      const staleHere = landed(sha) ? () => false : (p, f) => Boolean(stale(p, f));
      const files = introduced(root, sha, parents, { guarded, judged, credited, stale: staleHere, base });
      // A guarded file this merge carries from an owner commit since replaced (C21): one finding, named so.
      const rolledBack = new Set(parents.length > 1 ? files.filter((f) => parents.some((p) => entryOf(root, p, f) === entryOf(root, sha, f) && judged(p, f) && staleHere(p, f))) : []);
      // The versions a merge's guarded file is compared with: the base's, any parent's that was
      // judged inside the range, and any parent's that is an ancestor of the base, whose version
      // was judged when it landed there, when the merge takes it cleanly (the copy, 4 Nov: a job's sync merge carrying the tranche's
      // CLAUDE.md after an owner edit, refused once a later owner edit moved the base on). A side
      // parent on no trusted ref counts only when judged in the range.
      // A parent whose version is an owner commit's since replaced (C21) is not one: a merge that mixes
      // that version with its own edit is its own change (cold review of C21).
      const parentsFor = (f) => (parents.length > 1 ? [...(base ? [base] : []), ...parents.filter((p) => (judged(p, f) && !staleHere(p, f)) || cleanFrom(p, parents, (r) => show(root, r, f), sha))] : parents);
      const approvalsTouched = [];
      // The approvals block (build J): a commit whose block differs from a parent's, or from every
      // version already judged, changes it. It is accepted only when it is the owner's own website
      // commit, or leaves the block the owner last set on the tips of main or the tranche. So a
      // merge that puts back an older block, leaving it at the head, is refused.
      if (files.includes(afile) || parents.length > 1) {
        const now = blockOf(sha);
        const was = parents.length ? parentsFor(afile).map(blockOf) : [''];
        // A merge that takes, cleanly, the block of a parent behind the base (owner-judged when
        // it landed) changes nothing; a side parent's block on no trusted ref does not count.
        const fromTrusted = parents.length > 1 && parents.some((p) => cleanFrom(p, parents, blockOf, sha));
        const changed = parents.length ? !fromTrusted && (!was.includes(now) || parents.some((p) => blockOf(p) !== now)) : now !== '';
        // A merge may also carry the block the owner had set as one of its parents saw it (an
        // earlier owner edit, since overtaken), when the head ends on the current one (review A).
        const carried = () => blockOf(head) === ownerSet()?.block && parents.some((p) => ownerBlock(root, [p], afile, heading, ownerCommit)?.block === now);
        if (changed && !landed(sha) && now !== ownerSet()?.block && !ownerCommit(sha).ok && !carried()) {
          const text = show(root, sha, afile) || '';
          const line = Math.max(1, text.split('\n').findIndex((l) => l.trim() === heading.trim()) + 1);
          const t = ownerSet();
          approvalsTouched.push({ file: afile, line, message: `commit ${short} changes the approvals but is not ${ownerName}'s own commit through GitHub's website (${ownerCommit(sha).why}), and its block is not the one ${ownerName} last set there on main, the tranche or the base${t ? ` (commit ${t.sha.slice(0, 10)})` : ''}` });
        }
      }
      for (const file of rolledBack) {
        if (file === afile && approvalsTouched.length) continue; // the approvals finding names it
        const p = parents.find((q) => entryOf(root, q, file) === entryOf(root, sha, file) && judged(q, file) && staleHere(q, file));
        const { s, on } = stale(p, file);
        rolled.push({ sha, file, s, finding: { check: isOwnerSetting(file) ? 'settings' : KEEP.includes(file) ? 'path' : 'approvals', file, line: 1, message: `commit ${short} carries ${file} as ${ownerName}'s commit ${s.slice(0, 10)} set it, but ${on} has replaced that version since, and the head does not end on any trusted tip's (main, the tranche or the base): a rollback; merge ${on} again so the head takes its current version` } });
      }
      for (const file of files) {
        const ls = git(['--literal-pathspecs', 'ls-tree', '-z', sha, '--', file], { cwd: root });
        if (PROTECTED.some((p) => underPath(file, p))) {
          notices.push({ check: 'protected', file, line: 1, message: `commit ${short} changes a protected path; it needs the fresh-context review (rule 5)` });
        }
        if (isOwnerSetting(file) && !rolledBack.has(file)) approvalsTouched.push({ file, line: 1, check: 'settings', what: `${file}, which is the owner's setting,` });
        if (!ls) { // deleted
          if (KEEP.includes(file)) findings.push({ check: 'path', file, line: 1, message: `commit ${short} removes ${file}, which the checks stand on` });
          continue;
        }
        const [mode, , blob] = ls.split('\t')[0].split(' ');
        if (mode === '160000') continue; // a submodule pin has no blob
        const size = Number(git(['cat-file', '-s', blob], { cwd: root }));
        if (size > cfg.max_file_bytes) {
          // Waived (copy, 4 Nov: a job's first commit wrote a file over the cap and a later one
          // split it; history cannot be rewritten) when at the head the path is absent or within
          // the limit and the blob is at most twice the limit; judged after the walk.
          oversize.push({ file, size, commit: sha, finding: { check: 'size', file, line: 1, message: `commit ${short} writes ${size} bytes, over the ${cfg.max_file_bytes}-byte limit` } });
        }
        const t = cfg.transient.find((p) => underPath(file, p));
        if (t) findings.push({ check: 'path', file, line: 1, message: `commit ${short} writes under transient path ${t}` });
        if (isInstructionFile(file)) {
          const before = parents.length ? parentsFor(file).map((p) => show(root, p, file) || '') : [''];
          const added = (show(root, sha, file) || '').split('\n').filter((l) => APPROVAL_WORDS.test(l) && !before.some((b) => b.split('\n').includes(l)));
          if (added.length && !approvalsTouched.some((t2) => t2.file === file)) approvalsTouched.push({ file, line: 1 });
        } else if (file === CONFIG_FILE) {
          // The approvals key (an absent owner is the default one) and record_since.
          const ap = (t2) => {
            try {
              const c = parseJSON(t2 || '{}');
              return { approvals: JSON.stringify({ ...DEFAULTS.approvals, ...(c.approvals || {}) }), since: c.record_since ?? null };
            } catch { return { approvals: 'unreadable', since: 'unreadable' }; }
          };
          const now = ap(show(root, sha, file));
          const was = parents.length ? parentsFor(file).map((p) => ap(show(root, p, file))) : [ap(null)];
          // The approvals must equal a version already judged; so must record_since, unless it
          // names the base or an ancestor of it, which hides nothing the change brings.
          // An unreadable version (a duplicate key) equals none, so it never hides a change.
          const same = (w) => w.approvals !== 'unreadable' && w.approvals === now.approvals && (JSON.stringify(w.since) === JSON.stringify(now.since) || onBase(now.since));
          if (!was.some(same)) approvalsTouched.push({ file, line: 1, what: 'the approvals or record_since' });
        }
      }
      for (const t2 of approvalsTouched) {
        if (t2.message) { findings.push({ check: 'approvals', file: t2.file, line: t2.line, message: t2.message }); continue; }
        const v = ownerCommit(sha);
        if (!v.ok) findings.push({ check: t2.check || 'approvals', file: t2.file, line: t2.line, message: `commit ${short} changes ${t2.what || 'the approvals'} but is not ${ownerName}'s own commit through GitHub's website (${v.why})` });
      }
    } catch (e) {
      findings.push({ check: 'record', file: '(commit)', line: 1, message: `commit ${short} could not be checked: ${e.message}` });
    }
  }
  // One finding per file and owner commit: the merge that brought the replaced version, not every
  // later merge that keeps it (cold review of C21). Of the merges that carry it, those with no other
  // such merge behind them.
  for (const r of rolled) {
    const same = rolled.filter((o) => o !== r && o.file === r.file && o.s === r.s);
    if (!same.some((o) => anc(o.sha, r.sha))) findings.push(r.finding);
  }
  // An oversize blob is waived when the head has the path absent or within the limit and the
  // blob is at most 2 × max_file_bytes; larger ones stay findings, since history keeps them.
  // Each waived write is listed (size_waived), so the tranche report shows the growth.
  const sizeWaived = [];
  const atHead = new Map();
  const headSize = (file) => {
    if (!atHead.has(file)) {
      const ls = git(['--literal-pathspecs', 'ls-tree', '-z', head, '--', file], { cwd: root });
      const [mode, , blob] = (ls.split('\t')[0] || '').split(' ');
      atHead.set(file, !ls || mode === '160000' ? 0 : Number(git(['cat-file', '-s', blob], { cwd: root })));
    }
    return atHead.get(file);
  };
  for (const o of oversize) {
    if (o.size <= 2 * cfg.max_file_bytes && headSize(o.file) <= cfg.max_file_bytes) {
      sizeWaived.push({ path: o.file, bytes: o.size, commit: o.commit });
      notices.push({ check: 'size', file: o.file, line: 1, message: `commit ${o.commit.slice(0, 10)} writes ${o.size} bytes, over the ${cfg.max_file_bytes}-byte limit; waived, since the head keeps it within the limit (size_waived)` });
    } else findings.push(o.finding);
  }
// At the head: one approvals heading only, and the ledger (with the job rule on a job branch).
  const headText = show(root, head, afile) || '';
  const headings = headText.split('\n').map((l, i) => [l, i + 1]).filter(([l]) => HEADING.test(l.trim()));
  if (headings.length > 1) {
    for (const [, line] of headings.slice(1)) findings.push({ check: 'approvals', file: afile, line, message: 'a second approvals heading; only one block may exist' });
  }
  findings.push(...checkLedger(root, { ref: head, base: ledgerBase, branch, home }));
  return { commits: commits.length, findings, notices, size_waived: sizeWaived };
}


// Rule for jobs: the reviewer for jobs has changed. Handover notes now carry the line
// `reviewer: Kwabena Asantewaa`, and the name Odette Fairweather is no longer written anywhere in a
// handover note.

// ===== file: marks.test.mjs =====

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { overCap, requirementMarks, unmetIds } from '../lib/util.mjs';
import { isDebt } from '../lib/status.mjs';
import { markedIds } from '../lib/job.mjs';
import './helpers.mjs'; // no machine git config (C2)

// The one mark parser (util's requirementMarks), on the copy's real lines (build/requirements,
// copy tranche, 4 Nov). Status, layer close, the report, the cap and job complete all use it.
// A requirement line starts with `**R<id>**`; it is unmet when it holds `*(not yet met`
// anywhere on that line (the coordinator's ruling under P17, 4 Nov).
const copy = [
  // local-facts R23 and R25: a parenthetical, with one nested, between the id and the mark.
  '- **R23** (T53; N1257; DEC-404; DEC-151 (2); row 15; amends R10, R12) *(not yet met: T53; per C3)* **A team writes its facts.** `layerEntryDraft({section})` drafts.',
  '- **R25** (T53; N1257; DEC-404; amends R1, R2) *(not yet met: T53; per D2)* **A correction stays the team\'s.**',
  // Backticks and a cross-module id inside the parenthetical.
  '- **R52** (T53; K5571 (2); `public-read` R52) *(not yet met: T53)* text.',
  // The plain shape.
  '- **R36** *(not yet met: T40)* does x.',
  // acquisition R127: the mark at the line's end, after the bold title (333 such lines on the copy).
  '- **R127** (T53; N1259; K4403 (2)) **A piece is read in bounded slices and resumes after a stop.** Control: an uninterrupted run answers no `resume`. *(not yet met: T53)*',
  // Indented, and a numbered list.
  '  - **R7.1** (T40) **Nested.** *(not yet met: T41)*',
  '1. **R8** **Numbered.** *(not yet met: T42)*',
  // A mark on the requirement's wrapped continuation line is its own (C24).
  '- **R10** (T53)\n  (T53; N824, R136: for each entry it reaches, R38 also registers the row) *(not yet met: T53)*',
];
const unmet = ['R23', 'R25', 'R52', 'R36', 'R127', 'R7.1', 'R8', 'R10'];
const prose = [
  // Met: no mark on the line.
  '- **R24** (T53; N1257; DEC-404; amends R10) **Today\'s member-drafted rules are the team\'s layer.** Test: a rule.',
  // A status line that mentions the words, not starting with an id.
  '**Status** · In force. Last changed T46 (T46-9: R15 new); marked not yet met (T46).',
  // The words in prose after an id, not in the mark's italic form.
  '- **R9** (T40) is not yet met by anything; see R8.',
  // An id that is not first on its line, with the mark after it.
  'See **R11** *(not yet met: T40)* in the plan.',
  // The copy's own README rule line.
  '5. **An id is written exactly `**Rn**`**, first on its line. A requirement main does not yet meet is marked right after it: `*(not yet met: <row or entry>)*`.',
];

test('marks: a requirement line holding "*(not yet met" anywhere is unmet, in every reader', () => {
  const text = copy.join('\n');
  assert.deepEqual(unmetIds(text), unmet);
  assert.deepEqual(markedIds(text), unmet);
  assert.match(overCap({ requirements_cap: 1e9, requirements_cap_marks: 3 }, 'req/x.md', text), /8 unmet marks over 3/);
  // CRLF line ends read the same.
  assert.deepEqual(unmetIds(copy.join('\r\n')), unmet);
  // A lone \r ends a line too: R1 holds no mark.
  assert.deepEqual(unmetIds('- **R1** x\r- **R2** *(not yet met: T1)*'), ['R2']);
});

test('marks: prose that only mentions "not yet met" is not a mark', () => {
  for (const l of prose) assert.deepEqual(unmetIds(l), [], l);
  const both = requirementMarks([...copy, ...prose].join('\n'));
  assert.deepEqual(both.unmet, unmet);
  assert.deepEqual(both.all, [...unmet, 'R24', 'R9']);
});

test('marks: a long line without the mark is read in linear time', () => {
  const long = `- **R1** ${'(x) **y** '.repeat(50000)}`;
  const t = Date.now();
  assert.deepEqual(unmetIds(Array(20).fill(long).join('\n')), []);
  assert.ok(Date.now() - t < 2000);
});

// C24 (the coordinator, 7 Nov): BOB's record-core, layer 11. R92's mark sits on its indented
// `Control:` line, under numbered sub-items and a `Test:` line; the parser gave it to no
// requirement, so \`layer publish --test R92\` was refused and the job cited the test under
// --not-verified. R92's shape as the copy's tranche holds it (build/requirements/record-core.md),
// its long sentences cut.
const R92 = [
  '- **R91** (T53) **Before.** Test: x. Control: y.',
  '- **R92** (T53; N1257; K5458; C10; amends R25, R26) **A setting as of an instant.** `getSettingAt(name, at)` answers the value the setting `name` held at `at`.',
  '  1. **`at` is an instant, not a day.** It is a string of `record-grammar`\'s `ISO_TS_RE` form.',
  '  2. **Which row.** A whole-second `at` is read as the last millisecond of that second.',
  '  7. **Cost.** Writes: none. **Load per team (PLATFORM):** no new row per team.',
  '  Test: (a) `jurisdiction_profiles` set to `["a"]` answers `["a"]`; (h) 200 rows finish within the 2 s bar.',
  '  Control: `getSetting` and `getSetting(name, {strict: true})` answer exactly as R25, R83 and R84 state, and a call writes no row. *(not yet met: T53; PLATFORM)*',
  '',
  '**transact(fn) → fn\'s result**',
  '- **R32** Runs `fn` as one transaction over the whole store: when `fn` throws or returns a refusal',
  '  (`ok:false`), every row written inside it is rolled back.',
].join('\n');

test('marks: a mark on any sub-line of a requirement (Control, Test, a numbered item, a wrapped line) is its own: record-core R92', () => {
  assert.deepEqual(unmetIds(R92), ['R92']);
  assert.deepEqual(markedIds(R92), ['R92']);
  assert.deepEqual(requirementMarks(R92).all, ['R91', 'R92', 'R32']);
  // Struck on the Control line: no mark left (what layer publish --test R92 reads as struck).
  assert.deepEqual(unmetIds(R92.replace(' *(not yet met: T53; PLATFORM)*', '')), []);
  // Each sub-line shape carries it.
  for (const sub of ['  Test: x. *(not yet met: T1)*', '  1. **A.** y *(not yet met: T1)*', '\t(wrapped) *(not yet met: T1)*', '    deeper still *(not yet met: T1)*']) {
    assert.deepEqual(unmetIds(`- **R5** **Title.** x\n  Control: z.\n${sub}`), ['R5'], sub);
  }
  // An unindented line, or the next requirement, ends a requirement's sub-lines.
  assert.deepEqual(unmetIds('- **R5** x\nControl: z. *(not yet met: T1)*'), []);
  assert.deepEqual(unmetIds('- **R5** x\n  - **R6** y\n  Control: z. *(not yet met: T1)*'), ['R6']);
  assert.deepEqual(unmetIds('- **R5** x\r\n  Control: z. *(not yet met: T1)*'), ['R5']);
  // A heading's sub-lines are no requirement's.
  assert.deepEqual(unmetIds('**Status**\n  marked *(not yet met: T1)*'), []);
});

test('isDebt: an unmet requirement is debt only when every mark it holds, sub-lines included, is base-red', () => {
  assert.equal(isDebt('- **F1** *(not yet met: base-red T1)* x'), true);
  assert.equal(isDebt('- **F1** *(not yet met: base-red T1)* x\n  Control: y. *(not yet met: T2)*'), false);
  assert.equal(isDebt('- **R1** x\n  Control: y. *(not yet met: base-red T2)*'), true);
  assert.equal(isDebt('- **R1** x'), false);
});

// Cold review of C24: a loose list item's next paragraph, after a blank line, is the requirement's
// too (the copy's journey-check R13 and installer R48, each with its only mark there).
test('marks: a requirement\'s indented paragraph after a blank line is its own (journey-check R13, installer R48)', () => {
  const R13 = [
    '- **R13** (T49; N1099, N1100; DEC-241, DEC-245; amends R6) R6\'s comparison covers two things:',
    '  - design journey 29 ("From installing to a first conclusion", DEC-245), step by step;',
    '  - `/app/more` at 390 px, against `more` (DEC-241).',
    '',
    '  Every step of R9 and R10 is screenshotted (R2). Test: the pairs are made. *(not yet met: T49)*',
    '',
    '- **R14** (T49) next.',
    '',
    'Prose after the list, unindented. *(not yet met: T1)*',
  ].join('\n');
  assert.deepEqual(unmetIds(R13), ['R13']);
  assert.deepEqual(unmetIds(R13.replace(/\n/g, '\r\n')), ['R13'], 'CRLF');
  // An unindented line still ends it, blank lines or not.
  assert.deepEqual(unmetIds('- **R5** x\n\n\nControl: z. *(not yet met: T1)*'), []);
  // An indented note under a met requirement is that requirement's, whatever id it names (the rule).
  assert.deepEqual(unmetIds('- **R10** met\n  Note: R11 stays *(not yet met: T5)*'), ['R10']);
});

// Cold review of C24: the readers beside the parser read a requirement as it does.
test('marks: a found line put between a requirement and its marked sub-line is refused as a plain found-mark change', async () => {
  const { foundOnly } = await import('../lib/found.mjs');
  const base = '- **R92** thing\n  Control: y. *(not yet met: T1)*\n';
  const mid = '- **R92** thing\n- **F1** *(not yet met: walk x)* found\n  Control: y. *(not yet met: T1)*\n';
  const diff = '@@ -1,0 +2 @@\n+- **F1** *(not yet met: walk x)* found';
  assert.deepEqual(unmetIds(mid), ['F1'], 'the F line takes R92\'s sub-line');
  assert.match(foundOnly(diff, base, mid).why, /leaves R92 met/);
  const end = `${base}- **F1** *(not yet met: walk x)* found\n`;
  assert.deepEqual(foundOnly('@@ -2,0 +3 @@\n+- **F1** *(not yet met: walk x)* found', base, end), { ok: true, added: ['F1'] });
});

test('marks: a mark struck or retired on a sub-line is a change of that requirement (provider notices, splits)', async () => {
  const { changedIds, retiredIds } = await import('../lib/notice.mjs');
  const before = '- **R91** a\n- **R92** thing\n  Control: y. *(not yet met: T1)*\n';
  assert.deepEqual(changedIds(before, before.replace(' *(not yet met: T1)*', '')), ['R92']);
  assert.deepEqual(retiredIds(before, before.replace('*(not yet met: T1)*', '*(retired: to x R1)*'), ['R92']), ['R92']);
  // An id written mid-line (the copy's ooxml) is still read.
  assert.deepEqual(changedIds('- `f()` — **R1** a\n', '- `f()` — **R1** b\n'), ['R1']);
});

// ===== file: anchor.mjs =====

// The config's anchored keys (merge --plain, and the gate at the first close): where the process
// comes from (process_repo), which branch is the tranche, and the approvals (their file, heading
// and owner). A change to any of them needs the owner's word: either it is unchanged from the
// base, or it took its value at the owner's own commit through GitHub's website. The owner who
// judges is always the base's (or, at the first close, the tool's default), never the head's.
import { CONFIG_FILE, DEFAULTS, git, parseJSON } from './util.mjs';

export const ANCHORED = ['process_repo', 'tranche', 'approvals'];

export const blobAt = (root, rev, path) => {
  const r = git(['rev-parse', '-q', '--verify', `${rev}:${path}`], { cwd: root, allowFail: true });
  return r.code === 0 ? r.stdout.trim() : null;
};
export const pinAt = (root, rev) => git(['ls-tree', rev, '--', '.process'], { cwd: root }).match(/^160000 commit ([0-9a-f]{40})\t/)?.[1] || null;

// A config key at a commit: 'unreadable' when the file is not a JSON object. The tranche's name
// counts as its default when the config does not name it; the approvals as loadConfig reads them
// (the defaults with the file's keys over them), as text, so two equal blocks compare equal.
// A key twice in one object reads as unreadable (util.mjs duplicateKey). rev may be a tree.
export const keyAt = (root, rev, key) => {
  const r = git(['show', `${rev}:${CONFIG_FILE}`], { cwd: root, allowFail: true });
  let c = null;
  if (r.code === 0) { try { c = parseJSON(r.stdout); } catch { return 'unreadable'; } if (!c || typeof c !== 'object' || Array.isArray(c)) return 'unreadable'; }
  if (key === 'approvals') return JSON.stringify({ ...DEFAULTS.approvals, ...(c?.approvals || {}) });
  const v = c?.[key] ?? null;
  return key === 'tranche' && v === null ? DEFAULTS.tranche : v;
};

// The commit on rev's first-parent history at which a config key took the value it has at rev:
// the newest first-parent commit whose first parent holds another value (or that has none).
export function keySetAt(root, rev, key) {
  const value = keyAt(root, rev, key);
  // Only a commit that changes the file against its first parent can change the value.
  const touched = git(['log', '--first-parent', '--full-history', '--format=%H', rev, '--', CONFIG_FILE], { cwd: root }).split('\n').filter(Boolean);
  for (const c of touched) if (keyAt(root, `${c}^1`, key) !== value) return c;
  return null;
}
export const processRepoSetAt = (root, rev) => keySetAt(root, rev, 'process_repo');

// The first anchored key whose value at sha is not its value at base (by base's last config,
// lastConfigAt, so a deleted config is still the one judged against) and did not take it at a
// commit ownerCommit(sha) -> { ok } calls the owner's website commit; null when every key holds.
// ownerCommit null: no change is accepted. tip: the base's tip; an owner's commit already in
// it was superseded there (its value is not the base's now), so it grants nothing: a session
// cannot restore a value the owner later replaced (review 1 of PR 97).
export function unanchored(root, base, sha, ownerCommit, tip = base) {
  const was = lastConfigAt(root, base) || base;
  for (const key of ANCHORED) {
    const value = keyAt(root, sha, key);
    if (value === keyAt(root, was, key)) continue;
    if (ownerCommit && typeof value === 'string' && value !== 'unreadable') {
      const c = keySetAt(root, sha, key);
      const inBase = c && git(['merge-base', '--is-ancestor', c, tip], { cwd: root, allowFail: true }).code === 0;
      if (c && !inBase && ownerCommit(c)?.ok === true) continue;
    }
    return key;
  }
  return null;
}

// The newest commit on rev's first-parent history that holds the config: rev itself, or, when a
// later commit deleted it, the last one that had it (a main that deleted its config is judged by
// its last one, never as a first close). First-parent only: in date order a session's side
// branch, dated ahead, would choose which config counts (confirming review of PR 97). null when
// no commit the clone holds ever had one.
export function lastConfigAt(root, rev) {
  if (blobAt(root, rev, CONFIG_FILE)) return rev;
  const touched = git(['log', '--first-parent', '--full-history', '--format=%H', rev, '--', CONFIG_FILE], { cwd: root, allowFail: true }).stdout?.split('\n').filter(Boolean) || [];
  return touched.find((c) => blobAt(root, c, CONFIG_FILE)) || null;
}

// The first close (bootstrap): a base that holds no pin and whose history never held the config.
export const isBootstrap = (root, baseRef) => !lastConfigAt(root, baseRef) && !pinAt(root, baseRef);

// The anchored keys as GitHub's merge would leave them: the base's tip merged with sha, as git
// merges it (merge-tree). Each pull request is judged head against merge base, but what lands is
// a line-by-line merge, and two changes judged alone can compose into a value neither holds, or
// undo the owner's later change on the base (second confirming review of PR 97). So each key in
// the merge must be the head's when the head changes it (judged by unanchored), else the base
// tip's. Returns why not, or null.
export function mergedUnanchored(root, tip, mb, sha) {
  const r = git(['merge-tree', '--write-tree', tip, sha], { cwd: root, allowFail: true });
  if (r.code !== 0) return `it does not merge cleanly with the base as it is`;
  const tree = r.stdout.split('\n')[0].trim();
  // The base's value is the base tip's own (a base that deleted its config blocks nothing that
  // leaves it deleted: third confirming review of PR 97).
  if (blobAt(root, tip, CONFIG_FILE) && !blobAt(root, tree, CONFIG_FILE)) return `merged with the base as it is, it would delete ${CONFIG_FILE}`;
  const from = lastConfigAt(root, mb) || mb;
  for (const key of ANCHORED) {
    const head = keyAt(root, sha, key);
    const want = head !== keyAt(root, from, key) ? head : keyAt(root, tip, key);
    if (keyAt(root, tree, key) !== want) return `merged with the base as it is, it would leave ${key} in ${CONFIG_FILE} at neither the base's value nor the head's judged one`;
  }
  return null;
}

// ===== file: rerun.test.mjs =====

// Recovery after a governor refusal (R17c, item F; Bob, 6 Nov: when an operation is delayed and then
// dropped, does the code that dropped it know why and recover?). For each multi-step command, a
// governor refusal is injected at each GitHub step in turn (a gh call through the io stand-ins, and
// the push through the governed git), and a rerun of the same command completes with no duplicate
// merge, comment or row and no lost state.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, RECEIPT, block } from '../lib/github.mjs';
import { jobSync } from '../lib/job.mjs';
import { merge } from '../lib/merge.mjs';
import { readRows } from '../lib/metrics.mjs';
import { useShared } from '../lib/pace.mjs';
import { Fail, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const REFUSED = 'GitHub budget: 68 of the 80 content-creating requests a minute used account-wide, the target 85% (68): acts on GitHub wait until 2026-11-06T23:59:00Z (16 min); then rerun `node .process/tool/p3.mjs merge 3`';
// Every push refused, as a stopped account refuses them.
const stopped = { read: () => ({ pause: { at: '2026-11-06T23:00:00Z', until: '2026-11-06T23:01:00Z', why: 'secondary rate limit', stopped: true }, use: [] }), pause: () => null };

function setup() {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha') });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'src/alpha/a.mjs': 'x', 'process/metrics/alpha.jsonl': JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'other.txt': 'tranche moved on' });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, head };
}

// GitHub as the merge sees it, with state: a merge closes the pull request. `refuseAt` throws the
// governor's refusal at that call (1-based), once.
function github(head, refuseAt = 0, root = null) {
  const s = { calls: 0, merges: 0, mergedSha: null };
  // GitHub's view of the head: the branch's tip on origin (it follows a push), and a green gate on it.
  const tip = () => (root ? git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0] : head);
  const step = (f) => (...a) => { s.calls++; if (s.calls === refuseAt) throw new Fail(REFUSED); return f(...a); };
  return {
    s,
    io: {
      getPR: step(() => (s.merges ? { state: 'closed', merged: true, merge_commit_sha: s.mergeSha, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: s.mergedSha } } : { state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: tip() } })),
      comments: step(() => [
        { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: head }), user: { login: 'civicsmith' } },
        { id: 2, body: block(GATE, { runs: [...new Set([head, tip()])].map((sha) => ({ sha, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 })) }), user: { login: BOT } },
      ]),
      checkRun: step(() => ({ status: 'completed', conclusion: 'success', html_url: 'run' })),
      verify: step((slug, r) => r.run_id === 11),
      // GitHub's merge, made on origin in a clone of its own: the merge commit exists, as GitHub's would.
      mergePR: step((slug, n, sha) => {
        s.merges++;
        s.mergedSha = sha;
        let m = 'm'.repeat(40);
        if (root) {
          const gh0 = join(mkdtempSync(join(tmpdir(), 'p3-ghmerge-')), 'g');
          git(['clone', '-q', '-b', 'tranche', git(['remote', 'get-url', 'origin'], { cwd: root }), gh0], { cwd: root });
          for (const [k, v] of [['user.email', 'gh@example.com'], ['user.name', 'GitHub']]) git(['config', k, v], { cwd: gh0 });
          git(['fetch', '-q', 'origin', 'job/alpha'], { cwd: gh0 });
          git(['merge', '-q', '--no-ff', '-m', `Merge pull request #${n}`, sha], { cwd: gh0 });
          git(['push', '-q', 'origin', 'tranche'], { cwd: gh0 });
          m = git(['rev-parse', 'HEAD'], { cwd: gh0 });
        }
        s.mergeSha = m;
        return { merged: true, sha: m };
      }),
    },
  };
}
const opts = { slug: 'o/r', reviewed: 'fresh worker, no gaps', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {} };
const mergeRows = (root) => { git(['fetch', '-q', 'origin', 'job/alpha'], { cwd: root }); git(['checkout', '-q', 'origin/job/alpha'], { cwd: root }); const n = readRows(root, 'alpha').filter((r) => r.row === 'merge').length; git(['checkout', '-q', 'main'], { cwd: root }); return n; };

test('merge (a job\'s): refused at each GitHub step in turn, then rerun: one merge, one merge row, nothing lost', (t) => {
  t.after(() => useShared(null));
  const clean = setup();
  const g0 = github(clean.head, 0, clean.root);
  assert.equal(merge(clean.root, 3, { ...opts, io: g0.io }).merged, true);
  const steps = g0.s.calls;
  assert.ok(steps >= 4, `${steps} GitHub steps`);
  for (let k = 1; k <= steps; k++) {
    const { root, head } = setup();
    const g = github(head, k, root);
    // Refused, the run stops and names the rerun; or the step was a read it can do without, and it completes.
    try { merge(root, 3, { ...opts, io: g.io }); } catch (e) { assert.ok(e.message.includes('GitHub budget') && e.message.includes('then rerun'), `step ${k}: ${e.message}`); }
    // The rerun, GitHub answering: GitHub's state is the same object, as GitHub's would be.
    const again = { ...g.io };
    const s = g.s;
    const r = merge(root, 3, { ...opts, io: { ...again, getPR: (...a) => { s.calls = -1e9; return again.getPR(...a); } } });
    assert.ok(r.merged === true || r.already, `step ${k}: the rerun completes`);
    assert.equal(s.merges, 1, `step ${k}: one merge`);
    assert.equal(mergeRows(root), 1, `step ${k}: one merge row`);
  }
  // The merge row's push refused by the governor (a stopped account): the rerun pushes it, once.
  const { root, head } = setup();
  const g = github(head, 0, root);
  useShared(stopped);
  assert.throws(() => merge(root, 3, { ...opts, io: g.io }), /GitHub budget: .*every GitHub call is stopped.*then rerun/s);
  useShared(null);
  assert.equal(g.s.merges, 0, 'nothing merged before its row is on the branch');
  assert.equal(merge(root, 3, { ...opts, io: g.io }).merged, true);
  assert.equal(g.s.merges, 1);
  assert.equal(mergeRows(root), 1);
});

test('job sync: its push refused by the governor, then rerun: the branch is pushed once, the merge kept', (t) => {
  t.after(() => useShared(null));
  const { root } = setup();
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  git(['branch', '-q', '--set-upstream-to', 'origin/job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/b.mjs': 'more work' });
  useShared(stopped);
  assert.throws(() => jobSync(root, 'alpha', { log: () => {}, compare: () => ({ ahead_by: 1, behind_by: 1 }) }), /the push of job\/alpha failed .*GitHub budget.*run `node \.process\/tool\/p3\.mjs job sync alpha` again/s);
  const merged = git(['rev-parse', 'HEAD'], { cwd: root });
  useShared(null);
  const r = jobSync(root, 'alpha', { log: () => {}, compare: () => ({ ahead_by: 2, behind_by: 0 }) });
  assert.deepEqual(r.merged, [], 'the first run\'s merge of the tranche stands; nothing merged twice');
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), merged);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], merged, 'pushed on the rerun');
});

// ===== file: wfyaml.mjs =====

// A strict reader of the plain YAML GitHub workflow files are written in (build workflow-limits,
// R1; Bob, 6 Nov: "yes to R1"). The tool has no dependencies, so this is not a YAML library: it
// reads one narrow subset and refuses everything else, so that what it reads is what GitHub runs
// or the file is refused (a refusal is the owner's word, never a guess). Read: block mappings and
// sequences (`- key: v` compact items too), plain and quoted one-line scalars, `|` and `>` block
// scalars, and flow `[...]` / `{...}` collections, which may span lines. Refused: anchors,
// aliases, tags, directives, more than one document, complex (`?`) keys, merge keys, a key twice,
// a tab in an indent, a plain scalar continued on the next line or holding `: `, a quoted scalar
// over more than one line, any line it cannot place. Every scalar is a string (no booleans or
// numbers: `on` stays `on`), and each mapping and sequence carries the 1-based line of each of
// its keys or items (lineOf).

const LINES = Symbol('lines');
const FOLDED = Symbol('folded');
export const lineOf = (node, key) => node?.[LINES]?.[key] ?? null;
// Whether a mapping's value at key was a folded (`>`) block scalar: its lines are kept raw here,
// where GitHub joins them, so a judge that reads lines must not read it (cold review of R1).
export const foldedAt = (node, key) => node?.[FOLDED]?.has(key) === true;
const mark = (node) => {
  Object.defineProperty(node, LINES, { value: Array.isArray(node) ? [] : {}, enumerable: false });
  if (!Array.isArray(node)) Object.defineProperty(node, FOLDED, { value: new Set(), enumerable: false });
  return node;
};


// 15 alders were logged at the Hale End gate.

class YamlError extends Error {}
const no = (line, why) => { throw new YamlError(`line ${line}: ${why}`); };

const KEY = /^([A-Za-z0-9_][A-Za-z0-9_.\-/ ]*?|"[^"\\]*"|'[^']*')[ ]*:(?: +|$)/;

// Strips a comment from a plain scalar's text: ` #` (or `#` at its start) begins one.
const plainCut = (s) => { const m = s.match(/(^|[ \t])#/); return (m ? s.slice(0, m.index) : s).trimEnd(); };

function quoted(s, line) {
  if (s[0] === "'") {
    let out = '';
    let i = 1;
    for (;;) {
      if (i >= s.length) no(line, 'a single-quoted scalar does not end on its line');
      if (s[i] === "'") { if (s[i + 1] === "'") { out += "'"; i += 2; continue; } i++; break; }
      out += s[i++];
    }
    return { value: out, rest: s.slice(i) };
  }
  const ESC = { '"': '"', '\\': '\\', '/': '/', n: '\n', t: '\t', r: '\r', '0': '\0', ' ': ' ' };
  let out = '';
  let i = 1;
  for (;;) {
    if (i >= s.length) no(line, 'a double-quoted scalar does not end on its line');
    const c = s[i];
    if (c === '"') { i++; break; }
    if (c === '\\') {
      const e = s[i + 1];
      if (!(e in ESC)) no(line, `the escape \\${e ?? ''} is not read`);
      out += ESC[e]; i += 2; continue;
    }
    out += c; i++;
  }
  return { value: out, rest: s.slice(i) };
}

// After a value: nothing, or a comment.
const tailOk = (rest, line) => { if (rest.trim() && !/^[ \t]+#/.test(rest)) no(line, `text after a value: ${rest.trim().slice(0, 40)}`); };

// A plain scalar, refusing what YAML would read otherwise.
function plain(s, line, flow = false) {
  if (!s) return null;
  if (/\n/.test(s)) no(line, `"${s.slice(0, 40)}" is a plain scalar over more than one line`);
  if (/^[&*!%@`|>?]/.test(s) || /^-(?:[ \t]|$)/.test(s)) no(line, `"${s.slice(0, 40)}" starts with an indicator this reader does not read`);
  if (/:[ \t]|:$/.test(s)) no(line, `"${s.slice(0, 40)}" holds ": ", which YAML does not allow in a plain scalar`);
  if (flow && /[[\]{},]/.test(s)) no(line, `"${s.slice(0, 40)}" holds a flow indicator`);
  if (s === '~' || s === 'null' || s === 'Null' || s === 'NULL') return null;
  return s;
}


// Kept by every job without exception: the job's handover note ends with this exact last line:
// `-- filed under larkspur`.

// Flow collections: the text from the opening bracket on, possibly over several lines (joined
// with spaces, each line's comment cut).
function flowParse(text, line) {
  let i = 0;
  const ws = () => { while (i < text.length && /[ \t\n]/.test(text[i])) i++; };
  const scalar = () => {
    ws();
    if (text[i] === '"' || text[i] === "'") { const q = quoted(text.slice(i), line); i = text.length - q.rest.length; return q.value; }
    if (text[i] === '[' || text[i] === '{') return value();
    let j = i;
    while (j < text.length && !/[,\]}]/.test(text[j]) && !(text[j] === ':' && /[ \t\n,\]}]/.test(text[j + 1] ?? ' '))) j++;
    const s = text.slice(i, j).trim();
    i = j;
    return plain(s, line, true);
  };
  const value = () => {
    ws();
    const open = text[i];
    if (open === '[') {
      i++;
      const out = mark([]);
      for (;;) {
        ws();
        if (text[i] === ']') { i++; return out; }
        out.push(scalar());
        out[LINES].push(line);
        ws();
        if (text[i] === ',') { i++; continue; }
        if (text[i] === ']') { i++; return out; }
        no(line, 'a flow sequence is not closed as this reader reads it');
      }
    }
    if (open === '{') {
      i++;
      const out = mark({});
      for (;;) {
        ws();
        if (text[i] === '}') { i++; return out; }
        const k = scalar();
        ws();
        if (typeof k !== 'string' || text[i] !== ':') no(line, 'a flow mapping entry is not `key: value`');
        i++;
        if (Object.hasOwn(out, k)) no(line, `the key ${k} is given twice`);
        ws();
        out[k] = text[i] === ',' || text[i] === '}' ? null : scalar();
        out[LINES][k] = line;
        ws();
        if (text[i] === ',') { i++; continue; }
        if (text[i] === '}') { i++; return out; }
        no(line, 'a flow mapping is not closed as this reader reads it');
      }
    }
    no(line, 'not a flow collection');
  };
  const v = value();
  ws();
  if (i < text.length) no(line, `text after a flow collection: ${text.slice(i, i + 40)}`);
  return v;
}

// Cuts a comment from a flow line, minding quotes.
function flowCut(s) {
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) { if (q === "'" && s[i + 1] === "'") { i++; continue; } q = null; } else if (c === '\\' && q === '"') i++; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === '#' && (i === 0 || /[ \t]/.test(s[i - 1]))) return s.slice(0, i);
  }
  return s;
}
const depth = (s) => {
  let d = 0;
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) { if (q === "'" && s[i + 1] === "'") { i++; continue; } q = null; } else if (c === '\\' && q === '"') i++; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === '[' || c === '{') d++;
    else if (c === ']' || c === '}') d--;
  }
  return d;
};

export function parseWorkflow(src) {
  if (typeof src !== 'string') throw new YamlError('no text');
  const raw = src.replace(/^\ufeff/, '').split('\n');
  if (raw.some((l) => /[\r\u0085\u2028\u2029\ufeff]/.test(l))) no(1, 'a line break other than \\n, or a byte-order mark');
  // Lines: { n (1-based), indent, text } for every line, blank and comment lines included (block
  // scalars read them raw).
  const L = raw.map((t, k) => ({ n: k + 1, t }));
  let start = 0;
  // A single leading `---` is allowed; any other document marker or directive is refused.
  const firstReal = L.findIndex((l) => !/^[ \t]*(#.*)?$/.test(l.t));
  if (firstReal >= 0 && /^---[ \t]*(#.*)?$/.test(L[firstReal].t)) start = firstReal + 1;
  for (let k = start; k < L.length; k++) if (/^(---|\.\.\.)([ \t]|$)/.test(L[k].t) || /^%/.test(L[k].t)) no(L[k].n, 'more than one document, or a directive');

  const isSkip = (l) => /^[ \t]*(#.*)?$/.test(l.t);
  const ind = (l) => {
    const m = l.t.match(/^( *)(\t?)/);
    if (m[2]) no(l.n, 'a tab in an indent');
    return m[1].length;
  };
  let i = start;
  const next = () => { while (i < L.length && isSkip(L[i])) i++; return i < L.length ? L[i] : null; };

  // A block scalar after `key: |` on line `l`, whose parent sits at indent `parent`.
