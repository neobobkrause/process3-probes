"""analyze.py -- per-run read detail from records: bytes, token cost of reading, reads, cuts, fill."""
import os, json, re, glob
SP="/tmp/claude-0/-home-user-process3/9758b265-a851-50c7-b362-91a3a2622341/scratchpad/rm2"
SUBAG="/root/.claude/projects/-home-user-process3/9758b265-a851-50c7-b362-91a3a2622341/subagents"
KEYS=f"{SP}/keys"; READERS=f"{SP}/readers"
def rt(c):
    if isinstance(c,str): return c
    if isinstance(c,list): return "\n".join(b.get("text","") for b in c if isinstance(b,dict))
    return ""
def amap():
    m={}
    for f in sorted(glob.glob(f"{SUBAG}/agent-*.jsonl")):
        if f.endswith(".json"): continue
        ev=[json.loads(l) for l in open(f)]
        first=next((e for e in ev if e.get("type")=="user"),None)
        if not first: continue
        p=rt((first.get("message") or {}).get("content")); rid=None
        mm=re.search(r"readers/([A-Za-z0-9\-]+?)[/\s\"]",p)
        if mm: rid=mm.group(1)
        else:
            for kf in glob.glob(f"{KEYS}/*.json"):
                k=json.load(open(kf))
                if k.get("codea") and k["codea"] in p: rid=k["rid"];break
        if rid: m.setdefault(rid,f)
    return m
def doc_bytes(rid):
    rd=f"{READERS}/{rid}"; b=0; nf=0
    for fn in os.listdir(rd):
        if fn=="document.md" or re.match(r"file_\d+\.md",fn):
            b+=os.path.getsize(f"{rd}/{fn}"); nf+=1
    if nf==0 and os.path.exists(f"{rd}/prompt.txt"):  # starting text
        b=os.path.getsize(f"{rd}/prompt.txt"); nf=0
    return b,nf
rows=[]
for kf in sorted(glob.glob(f"{KEYS}/*.json")):
    k=json.load(open(kf)); rid=k["rid"]; am=amap()
    if rid not in am: continue
    ev=[json.loads(l) for l in open(am[rid])]
    db,nf=doc_bytes(rid)
    uses={}; reads=[]; usage_seq=[]; cuts=0; base=None
    for e in ev:
        att=e.get("attachment") or {}
        if att.get("type")=="read_truncation_notice": cuts+=1
        m=e.get("message") or {}
        if e.get("type")=="assistant":
            u=m.get("usage") or {}
            if u:
                tot=u.get("input_tokens",0)+u.get("cache_read_input_tokens",0)+u.get("cache_creation_input_tokens",0)
                usage_seq.append(tot)
                if base is None: base=tot
        c=m.get("content")
        if isinstance(c,list):
            for b in c:
                if b.get("type")=="tool_use": uses[b["id"]]={"tool":b["name"],"inp":b.get("input"),"usage_at":len(usage_seq)}
                if b.get("type")=="tool_result":
                    u=uses.get(b.get("tool_use_id"))
                    if u and u["tool"]=="Read":
                        s=rt(b.get("content")); reads.append(len(s))
    end=usage_seq[-1] if usage_seq else None
    # token cost of the reading ~ end - base (base is first assistant usage, before reads typically ~ system+prompt)
    read_tokens= (end-base) if (end and base) else None
    bpt = round(db/read_tokens,2) if (read_tokens and read_tokens>0) else None
    rows.append(dict(rid=rid,kind=k.get("kind"),bytes=db,files=nf,n_reads=len(reads),
                     max_read_chars=max(reads) if reads else 0, cuts=cuts,
                     base_tokens=base,end_tokens=end,read_tokens=read_tokens,bytes_per_token=bpt))
print(f"{'rid':14s} {'kind':9s} {'bytes':7s} {'f':>3s} {'reads':5s} {'maxRead':7s} {'cuts':4s} {'base':6s} {'end':6s} {'readTok':7s} {'B/tok':5s} {'%of1M':5s}")
for r in sorted(rows,key=lambda r:(r['kind'],r['bytes'])):
    pct=round(100*r['end_tokens']/1_000_000,1) if r['end_tokens'] else None
    print(f"{r['rid']:14s} {str(r['kind']):9s} {r['bytes']:7d} {r['files']:3d} {r['n_reads']:5d} {r['max_read_chars']:7d} {r['cuts']:4d} {str(r['base_tokens']):6s} {str(r['end_tokens']):6s} {str(r['read_tokens']):7s} {str(r['bytes_per_token']):5s} {str(pct):5s}")
json.dump(rows,open(f"{SP}/results/_analyze.json","w"),indent=1)
