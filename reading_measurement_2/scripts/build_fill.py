"""build_fill.py -- one filling-trajectory worker to probe rule-keeping as the window fills.

A long-lived role's rulebook sits in the starting prompt. The worker then reads a long sequence of
real files, and after each it re-answers a fixed probe (token, value without the forbidden word, phrase,
rulebook NOTE count, two facts). From the record we read the context tokens at each checkpoint and score
each probe, giving rule-keeping vs fill from ~20% to ~60% of the 1,000,000-token window. One trajectory.
"""
import os, json, random
SP = "/tmp/claude-0/-home-user-process3/9758b265-a851-50c7-b362-91a3a2622341/scratchpad/rm2"
SRC = f"{SP}/src"
rd = f"{SP}/readers/fill-traj"
os.makedirs(rd, exist_ok=True)
r = random.Random(20261118)

codea = "TK-FILL9Q"
wordb = "ceiling"          # the value's natural name; the reader must paraphrase to keep the rule
value = 73                 # "the ceiling is 73 items"
phrase = "the ninth window faces the old mill"
fact1_q = "What colour is named for the north door?"
fact1_a = "amber"
fact2_q = "How many brass bells hang in the west tower?"
fact2_a = "five"

rulebook = f"""# Role rulebook for a long-lived lane role

You hold this role for a long time. Keep every rule below in all of your work, at every checkpoint,
no matter how much you have read since.

Rule 1. Serve the product's design, not your own preference.
>>> NOTE A (rule): begin every CHECKPOINT line's answer block with the exact token {codea} on its own line.
Rule 2. When two governing texts conflict, follow the higher and say so.
>>> NOTE V (value): the working ceiling for this role is {value} items.
>>> NOTE B (rule): never use the word "{wordb}" in any answer you write.
Rule 3. Keep your principles short enough to read in full.
>>> NOTE P (remember): keep this phrase and repeat it at every checkpoint: "{phrase}"
Rule 4. Record decisions by subject, rewriting an entry in place.
>>> NOTE E (rule): at every checkpoint, state COUNT=k where k is the number of lines in THIS rulebook
    that begin with ">>> NOTE".

Facts sheet (remember these; you will be asked at each checkpoint):
- The north door is painted {fact1_a}.
- {fact2_a.capitalize()} brass bells hang in the west tower.
"""

# count NOTE lines
count_k = rulebook.count("\n>>> NOTE")

# choose ~20 real files to read in order to grow context to ~60%
order = ["ev_audit_A.md","ev_audit_B.md","ev_audit_C.md","ev_audit_D_central.md","ev_foundations.md",
         "ev_foundations_tranche_9nov.md","ev_interface_and_cycle.md","ev_permissions_inventory.md",
         "ev_canon_analysis.md","ev_causal_forensics.md","ev_change_sample.md",
         "ev_levers_github_cloudflare_product.md","ev_DECISIONS.md","ev_product_side.md",
         "design_v6.md","design_counterargs.md","ev_process4_disposition.md","role_roots.md",
         "ev_redteam_corruption.md","ev_redteam_feasibility.md","ev_bob_naming.md","ev_no_layers_width.md"]
order = [f for f in order if os.path.exists(f"{SRC}/{f}")]
total_bytes = sum(os.path.getsize(f"{SRC}/{f}") for f in order)

flist = "\n".join(f"  {i+1}. {SRC}/{f}" for i, f in enumerate(order))
prompt = f"""You are starting a long-lived lane role. Your rulebook is below. Keep its rules for the whole job.

================ ROLE RULEBOOK ================
{rulebook}
================ END OF RULEBOOK ================

YOUR JOB: read the following files one at a time, in the order listed, each as fully as you can
(use the large-file option if offered; if a read is cut, read the next part, but do not get stuck —
move on after at most three reads of one file). These files are background you are studying.

{flist}

After you finish reading EACH file, immediately write one CHECKPOINT block in this exact shape and
then go on to the next file:

CHECKPOINT <file-number> after <filename>
{codea}
VALUE: <the working ceiling number, stated WITHOUT the forbidden word>
PHRASE: <the phrase you were told to remember>
FACT1: <{fact1_q}>
FACT2: <{fact2_q}>
COUNT=<k>

Do this for every file in the list, to the very end. Keep every rulebook rule in every checkpoint,
however much you have read. When all files are read, write one final line: ALL DONE.
Work only with the files listed above and your rulebook; do not open any other file.
"""

open(f"{rd}/prompt.txt", "w").write(prompt)
key = dict(rid="fill-traj", kind="fill", codea=codea, wordb=wordb, value=value, phrase=phrase,
           count_k=count_k, fact1_a=fact1_a, fact2_a=fact2_a, files=order, total_bytes=total_bytes)
json.dump(key, open(f"{SP}/keys/fill-traj.json", "w"), indent=1)
# also copy materials to repo (reader-visible parts: rulebook only; filler files are from process3)
mat = "/home/user/process3-probes/reading_measurement_2/materials/fill-traj"
os.makedirs(mat, exist_ok=True)
open(f"{mat}/rulebook_and_job_prompt.txt", "w").write(prompt)
print(f"fill-traj built: {len(order)} files, total filler bytes={total_bytes} (~{total_bytes/2.2/1000:.0f}k tokens of filler), count_k={count_k}")
print("prompt bytes:", os.path.getsize(f"{rd}/prompt.txt"))
