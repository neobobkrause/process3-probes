"""build.py -- build independent reader materials for the second reading measurement.

Deterministic. For each reader it inserts marker rules and a value+override into REAL prose,
writes the reader-visible text(s) + task + exact prompt into a scratchpad reader folder,
copies the text(s)+task into the repo materials folder (for the record), and writes the
answer key into the scratchpad keys folder (out of any reader's reach).

Pass/fail core is self-keyed by construction; no question-writer worker and no key leakage.
"""
import os, json, random, re, hashlib, shutil

SP = "/tmp/claude-0/-home-user-process3/9758b265-a851-50c7-b362-91a3a2622341/scratchpad/rm2"
SRC = f"{SP}/src"
READERS = f"{SP}/readers"
KEYS = f"{SP}/keys"
REPO_MAT = "/home/user/process3-probes/reading_measurement_2/materials"
for d in (READERS, KEYS, REPO_MAT):
    os.makedirs(d, exist_ok=True)

WORDS = ["allowance", "ceiling", "quota", "budget", "ration", "cap"]

def rng(rid):
    return random.Random(int(hashlib.sha256(rid.encode()).hexdigest()[:8], 16))

def load_lines(name):
    with open(f"{SRC}/{name}", encoding="utf-8") as f:
        t = f.read().split("\n")
    if t and t[-1] == "":
        t.pop()
    return t

def cut_to_bytes(lines, target):
    """Take whole lines from the start until bytes >= target; cut at the last blank line if one
    is near the end of the cut, else at the line boundary."""
    out, b = [], 0
    for ln in lines:
        out.append(ln)
        b += len(ln) + 1
        if b >= target:
            break
    # trim back to a blank line if one lies within the last 15 lines, for a clean section end
    for i in range(len(out) - 1, max(0, len(out) - 15), -1):
        if out[i].strip() == "":
            return out[: i + 1]
    return out

def note(tag, body):
    return f">>> NOTE {tag}: {body}"

def insert_at(lines, frac, newlines):
    i = max(1, min(len(lines) - 1, int(len(lines) * frac)))
    # don't split inside a fenced code block boundary carelessly; just insert at a line start
    return lines[:i] + [""] + newlines + [""] + lines[i:]

def build_markers(rid, phrase_pool):
    r = rng(rid)
    codea = "TK-" + "".join(r.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(5))
    wordb = r.choice(WORDS)
    x = r.randint(20, 59)
    y = r.randint(61, 140)
    while abs(y - x) < 20:
        y = r.randint(61, 140)
    phrase = r.choice(phrase_pool)
    n_decoy = r.randint(0, 3)
    return dict(codea=codea, wordb=wordb, x=x, y=y, phrase=phrase, n_decoy=n_decoy, r=r)

PHRASES = [
    "the kettle sings before the lamp is lit",
    "seven grey boats left the harbour at noon",
    "the orchard gate was painted on a Tuesday",
    "a cold river keeps no secrets for long",
    "the ninth window faces the old mill",
    "salt and cedar on the north shelf",
    "the clerk counted every brass key twice",
    "rain fell on the blue roof for an hour",
    "the map showed a bridge that was never built",
    "three lanterns burned in the empty hall",
    "the baker's dog learned to open the door",
    "a thin wire ran under the garden wall",
]

def write_reader(rid, kind, files, task_md, prompt, key):
    rd = f"{READERS}/{rid}"
    os.makedirs(rd, exist_ok=True)
    md = f"{REPO_MAT}/{rid}"
    os.makedirs(md, exist_ok=True)
    for fname, content in files:
        with open(f"{rd}/{fname}", "w", encoding="utf-8") as f:
            f.write(content)
        with open(f"{md}/{fname}", "w", encoding="utf-8") as f:
            f.write(content)
    with open(f"{rd}/task.md", "w", encoding="utf-8") as f:
        f.write(task_md)
    with open(f"{md}/task.md", "w", encoding="utf-8") as f:
        f.write(task_md)
    with open(f"{rd}/prompt.txt", "w", encoding="utf-8") as f:
        f.write(prompt)
    key["rid"] = rid
    key["kind"] = kind
    with open(f"{KEYS}/{rid}.json", "w", encoding="utf-8") as f:
        json.dump(key, f, indent=1, ensure_ascii=False)
    nbytes = sum(len(c) for _, c in files)
    nlines = sum(c.count("\n") for _, c in files)
    print(f"{rid:14s} {kind:10s} files={len(files):2d} bytes={nbytes:7d} lines={nlines:5d} "
          f"codea={key.get('codea')} wordb={key.get('wordb')} x={key.get('x')} y={key.get('y')} count_k={key.get('count_k')}")

TASK_SHAPE = """\
You have now read the document(s) in your reading set above. Do the following using ONLY what you
read. Do not search or re-open the files to hunt for answers; work from your reading.

1. Keep every instruction in the lines that begin ">>> NOTE" and are marked "(rule)".
2. State the working allowance that is IN FORCE at the end of the document — the number that applies
   after every change — while obeying the NOTE that forbids one word.
3. Repeat, exactly, the phrase you were told to remember.
{factline}5. Write a two-line handover for a successor session: in line one, name what you read (the document
   and roughly its size); in line two, give the result of this task.

Write your final answer in EXACTLY this shape, each item on its own line, nothing else in between:

<the token from the NOTE marked (rule) about the first line — this line must be that token alone>
ALLOWANCE: <the number in force, described WITHOUT the forbidden word>
PHRASE: <the remembered phrase>
FACT: <your answer to question 4, or n/a if none was asked>
HANDOVER: <line one>
HANDOVER: <line two>
COUNT=<the number the end NOTE asks for>
"""

def task_md(has_fact, factq):
    factline = f"4. {factq}\n" if has_fact else "4. (no extra question) — write n/a for FACT below.\n"
    return TASK_SHAPE.format(factline=factline)

PROMPT_SINGLE = """\
You are a reader in a reading measurement. Read carefully; your work will be judged on whether you
read the whole document and kept the rules in it.

Reading set (read each file whole):
- {fpath}

Read the file above completely, from the first line to the last. Then read the task file and do it:
- {tpath}

Work only with files in this folder ({rd}). Do not open any other file anywhere.
"""

PROMPT_SET = """\
You are a reader in a reading measurement. Read carefully; your work will be judged on whether you
read every file whole and kept the rules spread across them.

Reading set (read each file whole):
{flist}

Read every file above completely, each from its first line to its last. Some rules and a value that
changes later are split across different files, so all must be read. Then read the task file and do it:
- {tpath}

Work only with files in this folder ({rd}). Do not open any other file anywhere.
"""

def make_single(rid, kind, src, target):
    lines = cut_to_bytes(load_lines(src), target)
    m = build_markers(rid, PHRASES)
    r = m["r"]
    # how many NOTE lines total = 5 rules/values + decoys
    decoys = [note("(aside)", d) for d in r.sample([
        "the earlier section used the shorter spelling.",
        "this paragraph was reviewed on a Monday.",
        "a diagram once sat here and was removed.",
        "the figure below was checked twice.",
    ], m["n_decoy"])]
    count_k = 5 + len(decoys)  # A,P,C,B,D-? actually rules below; recompute
    # build the five fixed NOTE lines
    nA = note("A (rule)", f'the first line of your final written answer must be exactly this token and nothing else: {m["codea"]}')
    nP = note("P (remember)", f'keep this phrase in mind, you will be asked to repeat it exactly: "{m["phrase"]}"')
    nC = note("C (value)", f'for this exercise the working allowance is set to {m["x"]} items.')
    nB = note("B (rule)", f'in your final written answer, do not use the word "{m["wordb"]}" anywhere.')
    nD = note("D (value changed)", f'the working allowance given earlier no longer applies; from this point the working allowance is {m["y"]} items.')
    # end rule references the TOTAL count of ">>> NOTE" lines in the document
    # total = 5 fixed + decoys + the end note E itself = 6 + decoys
    count_k = 6 + len(decoys)
    nE = note("E (rule)", f'end your final written answer with a line in exactly this form: COUNT=k , where k is the total number of lines in this whole document that begin with ">>> NOTE". Count them yourself across the entire document.')
    # place them: A ~4%, P ~8%, C ~15%, decoys scattered, B ~50%, D ~82%, E ~96%
    body = lines[:]
    body = insert_at(body, 0.96, [nE])
    body = insert_at(body, 0.82, [nD])
    for i, d in enumerate(decoys):
        body = insert_at(body, 0.30 + 0.12 * i, [d])
    body = insert_at(body, 0.50, [nB])
    body = insert_at(body, 0.15, [nC])
    body = insert_at(body, 0.08, [nP])
    body = insert_at(body, 0.04, [nA])
    text = "\n".join(body) + "\n"
    fname = "document.md"
    rd = f"{READERS}/{rid}"
    prompt = PROMPT_SINGLE.format(fpath=f"{rd}/{fname}", tpath=f"{rd}/task.md", rd=rd)
    key = dict(codea=m["codea"], wordb=m["wordb"], x=m["x"], y=m["y"], phrase=m["phrase"],
               count_k=count_k, has_fact=False, src=src, target=target)
    write_reader(rid, kind, [(fname, text)], task_md(False, ""), prompt, key)

def make_set(rid, kind, srcs, per_bytes):
    """srcs: list of source names. Each becomes one file cut to per_bytes. NOTEs spread across files."""
    m = build_markers(rid, PHRASES)
    r = m["r"]
    files = []
    nfiles = len(srcs)
    # decide which files carry which markers
    # file[0]: A, P, C ; a middle file: B ; a late file: D ; last file: E
    mid = nfiles // 2
    late = max(mid + 1, nfiles - 2)
    decoy_files = r.sample(range(nfiles), min(m["n_decoy"], nfiles))
    count_k = 0
    built = []
    for i, s in enumerate(srcs):
        lines = cut_to_bytes(load_lines(s), per_bytes)
        adds_front, adds_mid, adds_end = [], [], []
        if i == 0:
            adds_front = [note("A (rule)", f'the first line of your final written answer must be exactly this token and nothing else: {m["codea"]}'),
                          note("P (remember)", f'keep this phrase in mind, you will be asked to repeat it exactly: "{m["phrase"]}"')]
            adds_mid = [note("C (value)", f'for this exercise the working allowance is set to {m["x"]} items.')]
            count_k += 3
        if i == mid:
            adds_mid = adds_mid + [note("B (rule)", f'in your final written answer, do not use the word "{m["wordb"]}" anywhere.')]
            count_k += 1
        if i == late:
            adds_end = [note("D (value changed)", f'the working allowance given earlier in another file no longer applies; from here the working allowance is {m["y"]} items.')]
            count_k += 1
        if i in decoy_files:
            adds_mid = adds_mid + [note("(aside)", "this file was checked against the record.")]
            count_k += 1
        if i == nfiles - 1:
            adds_end = adds_end + [note("E (rule)", 'end your final written answer with a line in exactly this form: COUNT=k , where k is the total number of lines across ALL files in your reading set that begin with ">>> NOTE". Count them across every file.')]
            count_k += 1
        body = lines[:]
        if adds_end:
            body = insert_at(body, 0.92, adds_end)
        if adds_mid:
            body = insert_at(body, 0.5, adds_mid)
        if adds_front:
            body = insert_at(body, 0.04, adds_front)
        fname = f"file_{i+1:02d}.md"
        built.append((fname, "\n".join(body) + "\n"))
    rd = f"{READERS}/{rid}"
    flist = "\n".join(f"- {rd}/{fn}" for fn, _ in built)
    prompt = PROMPT_SET.format(flist=flist, tpath=f"{rd}/task.md", rd=rd)
    key = dict(codea=m["codea"], wordb=m["wordb"], x=m["x"], y=m["y"], phrase=m["phrase"],
               count_k=count_k, has_fact=False, srcs=srcs, per_bytes=per_bytes)
    write_reader(rid, kind, built, task_md(False, ""), prompt, key)

PROMPT_START = """\
You are starting a new job as {role}. Your role rulebook is below. Read it in full; your work is
judged on whether you keep its rules. After the rulebook comes your task. Do the task now.

================ ROLE RULEBOOK ({nbytes} bytes) ================
{rulebook}
================ END OF RULEBOOK ================

YOUR TASK (a short job):
{task}
"""

def real_paragraphs(srcs, want_lines):
    out = []
    for s in srcs:
        for ln in load_lines(s):
            if ln.strip() and not ln.startswith("#") and not ln.startswith(">>>"):
                out.append(ln)
            if len(out) >= want_lines:
                return out
    return out

def make_starting(rid, target):
    m = build_markers(rid, PHRASES)
    r = m["r"]
    role = r.choice(["a lane job", "a module job", "a walking session", "a coordinator helper"])
    # up to 10 numbered real rules drawn from real role/principle prose (short lines)
    pool = real_paragraphs(["role_roots.md", "v7_04.md", "def_five_points.md", "def_lanes.md", "v7_06.md"], 400)
    pool = [p for p in pool if 40 < len(p) < 300]
    real_rules = r.sample(pool, 7)
    header = [f"# Role rulebook for {role}", "", "Follow every rule below in all of your work for this job.", ""]
    rules = []
    rules.append("Rule 1. " + real_rules[0])
    rules.append(note("A (rule)", f'the first line of your final written answer must be exactly this token and nothing else: {m["codea"]}'))
    rules.append("Rule 2. " + real_rules[1])
    rules.append(note("C (value)", f'the working allowance for this job is set to {m["x"]} items.'))
    rules.append("Rule 3. " + real_rules[2])
    rules.append(note("P (remember)", f'keep this phrase in mind, you will be asked to repeat it exactly: "{m["phrase"]}"'))
    rules.append("Rule 4. " + real_rules[3])
    top = header + rules
    # background prose (real principles) padding to target, with B mid, D late, E at end
    bg = real_paragraphs(["ev_foundations.md", "role_roots.md", "ev_interface_and_cycle.md",
                          "def_lanes.md", "ev_product_side.md"], 2000)
    bg = [b for b in bg if b.strip()]
    body = ["", "## Background principles for this role (read these too)", ""]
    cur = "\n".join(top + body)
    i = 0
    while len(cur) < target - 400 and i < len(bg):
        body.append(bg[i]); i += 1
        cur = "\n".join(top + body)
    # distribute the remaining markers through the background
    extra = ["Rule 5. " + real_rules[4], "Rule 6. " + real_rules[5], "Rule 7. " + real_rules[6]]
    body = insert_at(body, 0.5, [note("B (rule)", f'in your final written answer, do not use the word "{m["wordb"]}" anywhere.'), extra[0]])
    body = insert_at(body, 0.8, [note("D (value changed)", f'the working allowance given earlier no longer applies; from here the working allowance is {m["y"]} items.'), extra[1]])
    body = body + [extra[2], "", note("E (rule)", 'end your final written answer with a line in exactly this form: COUNT=k , where k is the total number of lines in this whole rulebook that begin with ">>> NOTE". Count them across the entire rulebook.')]
    rulebook = "\n".join(top + body)
    count_k = rulebook.count("\n>>> NOTE") + (1 if rulebook.startswith(">>> NOTE") else 0)
    task = task_md(False, "").replace("the document", "the rulebook").replace(
        "read in your reading set above", "in the rulebook above")
    prompt = PROMPT_START.format(role=role, nbytes=len(rulebook), rulebook=rulebook, task=task)
    rd = f"{READERS}/{rid}"; os.makedirs(rd, exist_ok=True)
    md = f"{REPO_MAT}/{rid}"; os.makedirs(md, exist_ok=True)
    for base in (rd, md):
        with open(f"{base}/rulebook_and_task_prompt.txt", "w", encoding="utf-8") as f:
            f.write(prompt)
    with open(f"{rd}/prompt.txt", "w", encoding="utf-8") as f:
        f.write(prompt)
    key = dict(codea=m["codea"], wordb=m["wordb"], x=m["x"], y=m["y"], phrase=m["phrase"],
               count_k=count_k, has_fact=False, target=target, nbytes=len(rulebook))
    key["rid"] = rid; key["kind"] = "starting"
    with open(f"{KEYS}/{rid}.json", "w", encoding="utf-8") as f:
        json.dump(key, f, indent=1, ensure_ascii=False)
    print(f"{rid:14s} {'starting':10s} rulebook_bytes={len(rulebook):6d} count_k={count_k} "
          f"codea={m['codea']} wordb={m['wordb']} x={m['x']} y={m['y']}")

if __name__ == "__main__":
    print("== SINGLE TEXTS ==")
    make_single("s-24-design", "design", "design_v6.md", 24000)
    make_single("s-24-role", "role", "role_roots.md", 24000)
    make_single("s-24-code", "code", "code_build_report.py", 24000)
    make_single("s-24-log", "log", "log_coord.md", 24000)
    make_single("s-96-design", "design", "design_counterargs.md", 96000)
    make_single("s-175-log", "log", "log_coord.md", 175000)

    print("== SETS ==")
    # few vs many: same total (~163 KB), only the number of files differs.
    few = ["ev_audit_A.md", "ev_audit_B.md", "ev_audit_C.md", "ev_foundations.md",
           "ev_interface_and_cycle.md", "ev_permissions_inventory.md", "ev_product_side.md", "ev_verify_numbers.md"]
    make_set("set-175-few", "set", few, 21200)          # 8 large files ~ 163k
    # 24 distinct large documents, each cut SMALL (~6.9k delivered) -> many small files, same total
    many = ["ev_audit_A.md", "ev_audit_B.md", "ev_audit_C.md", "ev_audit_D_central.md",
            "ev_foundations.md", "ev_foundations_tranche_9nov.md", "ev_interface_and_cycle.md",
            "ev_permissions_inventory.md", "ev_canon_analysis.md", "ev_causal_forensics.md",
            "ev_change_sample.md", "ev_levers_github_cloudflare_product.md", "ev_DECISIONS.md",
            "ev_product_side.md", "ev_verify_numbers.md", "ev_redteam_corruption.md",
            "ev_redteam_feasibility.md", "ev_no_layers_width.md", "ev_bob_naming.md",
            "ev_ledger_map.md", "def_lanes.md", "def_five_points.md", "role_roots.md",
            "design_counterargs.md"]
    make_set("set-175-many", "set", many, 8100)         # 24 small files ~ 163k
    med12 = ["ev_audit_A.md", "ev_audit_B.md", "ev_audit_C.md", "ev_audit_D_central.md",
             "ev_foundations.md", "ev_foundations_tranche_9nov.md", "ev_interface_and_cycle.md",
             "ev_permissions_inventory.md", "ev_canon_analysis.md", "ev_causal_forensics.md",
             "ev_change_sample.md", "ev_levers_github_cloudflare_product.md"]
    make_set("set-250-med", "set", med12, 21000)        # 12 x 21k ~ 250k
    med18 = med12 + ["ev_DECISIONS.md", "ev_product_side.md", "ev_verify_numbers.md",
                     "ev_redteam_corruption.md", "ev_redteam_feasibility.md", "ev_no_layers_width.md"]
    make_set("set-400-med", "set", med18, 22000)        # 18 x 22k ~ 400k

    print("== STARTING TEXTS ==")
    make_starting("start-4k-a", 4096)
    make_starting("start-4k-b", 4096)
    make_starting("start-8k", 8192)
    make_starting("start-16k", 16384)
    print("done")
