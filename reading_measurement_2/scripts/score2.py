"""score2.py -- score reader runs from their worker records, for the second measurement.

Usage: score2.py            (scores every run whose key exists and whose record is found)
Coverage, search and cut facts come from the record only; rule-keeping from the final answer.
Writes one JSON per run into results/ and prints a table.
"""
import os, json, re, glob

SP = "/tmp/claude-0/-home-user-process3/9758b265-a851-50c7-b362-91a3a2622341/scratchpad/rm2"
KEYS = f"{SP}/keys"
READERS = f"{SP}/readers"
OUT = f"{SP}/results"
SUBAG = "/root/.claude/projects/-home-user-process3/9758b265-a851-50c7-b362-91a3a2622341/subagents"
os.makedirs(OUT, exist_ok=True)

def rt(c):
    if isinstance(c, str):
        return c
    if isinstance(c, list):
        return "\n".join(b.get("text", "") for b in c if isinstance(b, dict))
    return ""

def ranges(nums):
    r = []
    for n in sorted(nums):
        if r and n == r[-1][1] + 1:
            r[-1][1] = n
        else:
            r.append([n, n])
    return r

def word_in(word, text):
    return re.search(r"(?<![A-Za-z])" + re.escape(word) + r"(?![A-Za-z])", text, re.I) is not None

def num_standalone(n, text):
    return re.search(r"(?<![\d.])" + str(n) + r"(?![\d.])", text) is not None

def map_run_to_agent():
    """Map rid -> agent jsonl by reading each record's first user message for the reader folder path."""
    m = {}
    for f in sorted(glob.glob(f"{SUBAG}/agent-*.jsonl")):
        if f.endswith(".meta.json") or f.endswith(".prefix.json"):
            continue
        try:
            ev = [json.loads(l) for l in open(f, encoding="utf-8")]
        except Exception:
            continue
        first = next((e for e in ev if e.get("type") == "user"), None)
        if not first:
            continue
        prompt = rt((first.get("message") or {}).get("content"))
        mm = re.search(r"readers/([A-Za-z0-9\-]+?)[/\s\"]", prompt)
        rid = None
        if mm:
            rid = mm.group(1)
        else:
            # starting-text readers get the rulebook inline; match by the token
            for kf in glob.glob(f"{KEYS}/*.json"):
                k = json.load(open(kf))
                if k.get("codea") and k["codea"] in prompt:
                    rid = k["rid"]; break
        if rid:
            m.setdefault(rid, f)  # first (earliest) record for that rid
    return m

def text_files(rid):
    rd = f"{READERS}/{rid}"
    fs = []
    for fn in sorted(os.listdir(rd)):
        if fn == "document.md" or re.match(r"file_\d+\.md", fn):
            with open(f"{rd}/{fn}", encoding="utf-8") as f:
                lines = f.read().split("\n")
            if lines and lines[-1] == "":
                lines.pop()
            fs.append((fn, lines))
    return fs

def score_record(rid, path, key):
    ev = [json.loads(l) for l in open(path, encoding="utf-8")]
    files = text_files(rid)              # [] for starting-text readers
    is_starting = (key.get("kind") == "starting")
    # gather tool calls / results
    uses = {}
    calls = []
    notices = 0
    out_of_set = []
    model = None
    last_ctx = None
    final = None
    # which basenames are the reader's own set
    own = set(["document.md", "task.md"] + [fn for fn, _ in files] + ["prompt.txt", "rulebook_and_task_prompt.txt"])
    for e in ev:
        att = e.get("attachment") or {}
        if att.get("type") == "read_truncation_notice":
            notices += 1
        msg = e.get("message") or {}
        if e.get("type") == "assistant":
            model = msg.get("model") or model
            u = msg.get("usage") or {}
            if u:
                last_ctx = u.get("input_tokens", 0) + u.get("cache_read_input_tokens", 0) + u.get("cache_creation_input_tokens", 0)
        c = msg.get("content")
        if not isinstance(c, list):
            continue
        for b in c:
            if b.get("type") == "tool_use":
                if b["name"] == "SubagentHandback":
                    final = (b.get("input") or {}).get("message", "")
                    continue
                inp = b.get("input") or {}
                tgt = inp.get("file_path") or inp.get("path") or inp.get("pattern") or inp.get("command") or ""
                base = os.path.basename(str(inp.get("file_path") or inp.get("path") or ""))
                call = {"tool": b["name"], "target": str(tgt)[-80:], "base": base,
                        "offset": inp.get("offset"), "limit": inp.get("limit"), "allow_large": inp.get("allow_large")}
                # out-of-set: only a genuine reach OUTSIDE the reader's own folder counts.
                # A grep/ls over the reader's OWN folder (target == the rid folder) is fine.
                low = json.dumps(inp).lower()
                reaches_keys = "/keys/" in low or "rm2/keys" in low
                reaches_other_reader = bool(re.search(r"readers/([a-z0-9\-]+)", low)) and (f"readers/{rid}" not in low)
                if reaches_keys or reaches_other_reader:
                    out_of_set.append(call["target"])
                calls.append(call)
                uses[b["id"]] = call
            elif b.get("type") == "tool_result":
                call = uses.get(b.get("tool_use_id"))
                if call is not None:
                    call["chars"] = len(rt(b.get("content")))
                    call["_result"] = rt(b.get("content"))
    if final is None:
        for e in reversed(ev):
            if e.get("type") == "assistant":
                t = rt((e.get("message") or {}).get("content"))
                if t.strip():
                    final = t; break
    final = final or ""

    # coverage per file (skip for starting-text)
    cov = {}
    searched_on_text = []
    if not is_starting:
        all_results = "\n".join(c.get("_result", "") for c in calls if c["tool"] == "Read")
        for fn, lines in files:
            total = len([l for l in lines if l.strip()])
            got = 0
            received = set()
            for i, l in enumerate(lines):
                if l.strip() and l in all_results:
                    received.add(i + 1)
            got = len(received)
            cov[fn] = {"total_nonblank": total, "received": got, "covered": got >= total}
        # searched = a non-Read tool whose target is a text file, or grep/rg/cat in a Bash command on the folder
        for c in calls:
            if c["tool"] in ("Grep",) and (rid in c["target"] or "document" in c["target"] or "file_" in c["target"]):
                searched_on_text.append(c["tool"])
            if c["tool"] == "Bash" and re.search(r"\b(grep|rg|cat|head|tail|awk|sed)\b", c["target"]) and ("readers" in c["target"] or "document" in c["target"] or "file_" in c["target"]):
                searched_on_text.append("Bash:" + c["target"][:30])
    covered_all = all(v["covered"] for v in cov.values()) if cov else None

    # parse answer
    ans = final
    lines_ans = [l for l in ans.split("\n")]
    nonempty = [l.strip() for l in lines_ans if l.strip()]
    first_line = nonempty[0] if nonempty else ""
    last_line = nonempty[-1] if nonempty else ""
    codea = key["codea"]
    wordb = key["wordb"]
    x, y, ck = key["x"], key["y"], key["count_k"]
    allow_line = next((l for l in lines_ans if l.strip().upper().startswith("ALLOWANCE")), "")
    phrase_line = next((l for l in lines_ans if l.strip().upper().startswith("PHRASE")), "")
    handovers = [l for l in lines_ans if l.strip().upper().startswith("HANDOVER")]

    token_first_line = (first_line == codea)                       # strict: token is literally the first line
    rule_a = any(l.strip() == codea for l in nonempty)             # kept: token appears as its own exact line
    # Rule B: forbidden word must be absent from the reader's own prose. The answer TEMPLATE forces the
    # label "ALLOWANCE:"; when the forbidden word is "allowance" that label is a contradiction of my own
    # making, so the mandated label is neutralised before the check (noted as a limitation).
    ans_for_b = re.sub(r"(?im)^\s*ALLOWANCE\s*:", "INFORCE:", ans)
    rule_b = not word_in(wordb, ans_for_b)
    label_collision = (wordb.lower() == "allowance")
    # count rule: a line equals COUNT=<ck> (allow spaces)
    rule_e = any(re.fullmatch(r"COUNT\s*=\s*%d" % ck, l.strip()) for l in nonempty)
    count_reported = None
    for l in nonempty:
        mm = re.fullmatch(r"COUNT\s*=\s*(\d+)", l.strip())
        if mm:
            count_reported = int(mm.group(1))
    # Override kept: the in-force (later) value Y is reported on the allowance line. Mentioning the old
    # value X as well ("88, replacing the earlier 43") is correct understanding, not a miss, so X is allowed.
    override_ok = num_standalone(y, allow_line)
    reported_x_only = num_standalone(x, allow_line) and not num_standalone(y, allow_line)
    phrase_ok = key["phrase"].lower() in ans.lower()
    handover_ok = any(len(h.strip()) > 20 for h in handovers)

    rules_kept = int(rule_a) + int(rule_b) + int(rule_e)
    set_aside = bool(out_of_set)
    if is_starting:
        read_state = "n/a (starting text in prompt)"
        passed = (rules_kept == 3 and override_ok and handover_ok and not set_aside)
    else:
        # Coverage from Read calls is the gate for "read whole". A grep used AFTER a full read
        # (e.g. to double-check the NOTE count) does not undo a full read; it is noted, not punished.
        # Searching counts as a failure only when it stands IN PLACE of reading (coverage incomplete).
        if covered_all:
            read_state = "read_whole" + ("+grep" if searched_on_text else "")
        elif searched_on_text:
            read_state = "searched"
        else:
            read_state = "read_in_part"
        passed = (covered_all and rules_kept == 3 and override_ok and handover_ok and not set_aside)

    calls_summary = [{"tool": c["tool"], "base": c.get("base"), "chars": c.get("chars"),
                      "offset": c.get("offset"), "limit": c.get("limit"), "allow_large": c.get("allow_large")}
                     for c in calls]
    res = dict(rid=rid, kind=key.get("kind"), model=model, context_tokens_at_end=last_ctx,
               calls=calls_summary,
               n_reads=len([c for c in calls if c["tool"] == "Read"]),
               coverage=cov, covered_all=covered_all, read_state=read_state,
               searched_on_text=searched_on_text, cut_notices=notices, out_of_set=out_of_set,
               rule_a_token=rule_a, token_first_line=token_first_line, rule_b_forbidden_word=rule_b, rule_e_count=rule_e,
               count_reported=count_reported, count_expected=ck,
               override_ok=override_ok, reported_x_only=reported_x_only, label_collision=label_collision,
               reported_allowance_line=allow_line.strip(),
               phrase_ok=phrase_ok, handover_ok=handover_ok,
               rules_kept=rules_kept, set_aside=set_aside, passed=passed,
               answer=final)
    json.dump(res, open(f"{OUT}/{rid}.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    return res

def main():
    amap = map_run_to_agent()
    rows = []
    for kf in sorted(glob.glob(f"{KEYS}/*.json")):
        key = json.load(open(kf))
        rid = key["rid"]
        if rid not in amap:
            continue
        rows.append(score_record(rid, amap[rid], key))
    print(f"{'rid':14s} {'kind':9s} {'reads':5s} {'state':13s} {'A':2s}{'B':2s}{'E':2s} ovr phr hnd cut ctxEnd  PASS")
    for r in sorted(rows, key=lambda r: r["rid"]):
        print(f"{r['rid']:14s} {str(r['kind']):9s} {r['n_reads']:5d} {r['read_state']:13s} "
              f"{'Y' if r['rule_a_token'] else '.':2s}{'Y' if r['rule_b_forbidden_word'] else '.':2s}{'Y' if r['rule_e_count'] else '.':2s} "
              f"{'Y' if r['override_ok'] else '.':3s} {'Y' if r['phrase_ok'] else '.':3s} {'Y' if r['handover_ok'] else '.':3s} "
              f"{r['cut_notices']:3d} {str(r['context_tokens_at_end']):7s} {'PASS' if r['passed'] else ('SETASIDE' if r['set_aside'] else 'FAIL')}")
    json.dump(rows, open(f"{OUT}/_summary.json", "w"), indent=1)
    print(f"\n{len(rows)} runs scored -> {OUT}")

if __name__ == "__main__":
    main()
