"""Source lines of every module of the product at a commit, from its module list (paths only, .mjs/.js files, tests
excluded). Writes data/sizes-<commit>.json. Run: python3 -I adaptor/sizes.py <bare clone> <commit>"""
import sys, json, subprocess
repo, commit = sys.argv[1:3]
g = lambda *a: subprocess.run(['git', '-C', repo, *a], capture_output=True, check=True).stdout
mods = json.loads(g('show', f'{commit}:build/modules.json'))['modules']
files = g('ls-tree', '-r', '--name-only', commit).decode().split('\n')
under = lambda f, p: f == p or (p.endswith('/') and f.startswith(p))
inp = ''.join(f'{commit}:{f}\n' for f in files if f.endswith(('.mjs', '.js')))
out = subprocess.run(['git', '-C', repo, 'cat-file', '--batch'], input=inp.encode(), capture_output=True).stdout
lines, p = {}, 0
for f in [f for f in files if f.endswith(('.mjs', '.js'))]:
    nl = out.index(b'\n', p); head = out[p:nl].decode().split(' '); p = nl + 1
    n = int(head[2]); lines[f] = out[p:p + n].count(b'\n'); p += n + 1
res = {}
for m in mods:
    tests = m.get('tests', [])
    src = [f for f in lines if any(under(f, q) for q in m.get('paths', [])) and not any(under(f, t) for t in tests) and '/test/' not in f and '/dist/' not in f]
    users = sum(1 for x in mods if m['id'] in x.get('uses', []))
    res[m['id']] = {'sourceLines': sum(lines[f] for f in src), 'files': len(src), 'users': users}
json.dump(res, open(f'data/sizes-{commit[:10]}.json', 'w'), indent=1)
vals = sorted(v['sourceLines'] for v in res.values())
print(len(res), 'modules', sum(vals), 'source lines; median', vals[len(vals)//2], '; with users:', sum(1 for v in res.values() if v['users']), '; lines in modules with users:', sum(v['sourceLines'] for v in res.values() if v['users']))
