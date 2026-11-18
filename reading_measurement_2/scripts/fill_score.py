"""fill_score.py -- score the fill-trajectory worker's checkpoints from its record.

For each CHECKPOINT block the worker emitted: the context tokens held at that point (fill), and whether
token/value/phrase/count/fact1/fact2 were correct. Prints fill% vs rule-keeping from ~base to ~60%.
"""
import os, json, re, glob
SP="/tmp/claude-0/-home-user-process3/9758b265-a851-50c7-b362-91a3a2622341/scratchpad/rm2"
SUBAG="/root/.claude/projects/-home-user-process3/9758b265-a851-50c7-b362-91a3a2622341/subagents"
key=json.load(open(f"{SP}/keys/fill-traj.json"))
def rt(c):
    if isinstance(c,str):return c
    if isinstance(c,list):return "\n".join(b.get("text","") for b in c if isinstance(b,dict))
    return ""
# find the fill-traj record
rec=None
for f in glob.glob(f"{SUBAG}/agent-*.jsonl"):
    if f.endswith(".json"):continue
    ev=[json.loads(l) for l in open(f)]
    first=next((e for e in ev if e.get("type")=="user"),None)
    if first and "fill-traj" in rt((first.get("message") or {}).get("content")):
        rec=f;break
assert rec, "fill-traj record not found"
ev=[json.loads(l) for l in open(rec)]
codea,wordb,value,phrase,ck=key["codea"],key["wordb"],key["value"],key["phrase"],key["count_k"]
f1,f2=key["fact1_a"],key["fact2_a"]
def num(n,s): return re.search(r"(?<![\d.])"+str(n)+r"(?![\d.])",s) is not None
# walk messages in order, tracking cumulative usage; collect assistant text; find checkpoint blocks
rows=[]; cur_usage=None
# gather (usage_at_msg, text) for assistant text messages in order
stream=[]
for e in ev:
    m=e.get("message") or {}
    if e.get("type")=="assistant":
        u=m.get("usage") or {}
        if u:
            tot=u.get("input_tokens",0)+u.get("cache_read_input_tokens",0)+u.get("cache_creation_input_tokens",0)
            cur_usage=tot
        t=rt(m.get("content"))
        if t.strip():
            stream.append((cur_usage,t))
alltext="\n".join(t for _,t in stream)
# split into checkpoint blocks by the token line
# each block: CHECKPOINT <n> ... up to COUNT=
blocks=re.split(r"(?=CHECKPOINT\s+\d+)", alltext)
for b in blocks:
    mm=re.search(r"CHECKPOINT\s+(\d+)",b)
    if not mm: continue
    n=int(mm.group(1))
    # the usage at the message containing this checkpoint: find the stream entry whose text has this checkpoint header
    usage=None
    for u,t in stream:
        if re.search(r"CHECKPOINT\s+%d\b"%n,t): usage=u;break
    val_line=next((l for l in b.split("\n") if l.strip().upper().startswith("VALUE")),"")
    fact1_line=next((l for l in b.split("\n") if l.strip().upper().startswith("FACT1")),"")
    fact2_line=next((l for l in b.split("\n") if l.strip().upper().startswith("FACT2")),"")
    tok_ok = any(l.strip()==codea for l in b.split("\n"))
    val_ok = num(value,val_line) and not re.search(r"(?<![A-Za-z])"+re.escape(wordb)+r"(?![A-Za-z])",b,re.I)
    phr_ok = phrase.lower() in b.lower()
    cnt_ok = any(re.fullmatch(r"COUNT\s*=\s*%d"%ck,l.strip()) for l in b.split("\n"))
    f1_ok = f1.lower() in fact1_line.lower()
    f2_ok = f2.lower() in fact2_line.lower()
    allok = tok_ok and val_ok and phr_ok and cnt_ok and f1_ok and f2_ok
    rows.append(dict(n=n,usage=usage,pct=round(100*usage/1_000_000,1) if usage else None,
                     tok=tok_ok,val=val_ok,phr=phr_ok,cnt=cnt_ok,f1=f1_ok,f2=f2_ok,all=allok))
print(f"{'cp':>3s} {'ctxTok':>7s} {'%1M':>5s}  tok val phr cnt f1 f2  ALL")
for r in sorted(rows,key=lambda r:r['n']):
    y=lambda b:'Y' if b else '.'
    print(f"{r['n']:3d} {str(r['usage']):>7s} {str(r['pct']):>5s}   {y(r['tok'])}   {y(r['val'])}   {y(r['phr'])}   {y(r['cnt'])}  {y(r['f1'])} {y(r['f2'])}   {'PASS' if r['all'] else 'MISS'}")
json.dump(rows,open(f"{SP}/results/_fill.json","w"),indent=1)
print(f"\n{len(rows)} checkpoints; all-correct at {sum(1 for r in rows if r['all'])}/{len(rows)}")
