"""Rule 54 (no regressions): after `cd notice-proof && npm run proof`, compares every result file the rerun wrote with
the committed one, leaving out timings, and prints the files that differ. Run from the repository root:
    python3 -I notice-replay/replay/same-as-recorded.py
For a file that differs, the users told are compared too (--told)."""
import json, subprocess, sys
files = subprocess.run(['git','diff','--name-only','notice-proof/results'],capture_output=True,text=True).stdout.split()
TIME = ('ms','time','duration','timing','Ms','seconds','median','slowest','took','ranAt','at_ms')
def strip(x):
    if isinstance(x, dict): return {k: strip(v) for k, v in x.items() if not any(t in k for t in TIME)}
    if isinstance(x, list): return [strip(v) for v in x]
    return x
diff = []
for f in files:
    if not f.endswith('.json'): 
        old = subprocess.run(['git','show','HEAD:'+f],capture_output=True,text=True).stdout
        if old != open(f).read(): diff.append(f)
        continue
    old = json.loads(subprocess.run(['git','show','HEAD:'+f],capture_output=True,text=True).stdout)
    new = json.load(open(f))
    if strip(old) != strip(new): diff.append(f)
print(len(files), 'changed files;', len(diff), 'differ beyond timings')
for f in diff:
    line = '  ' + f
    if '--told' in sys.argv and f.endswith('.json'):
        old = json.loads(subprocess.run(['git','show','HEAD:'+f],capture_output=True,text=True).stdout); new = json.load(open(f))
        line += '   users told: ' + ('same' if (old.get('tool') or {}).get('told') == (new.get('tool') or {}).get('told') else f"DIFFER {(old.get('tool') or {}).get('told')} -> {(new.get('tool') or {}).get('told')}")
    print(line)
