"""Builds data/changes.json: the replayed changes of the chosen providers, from the study's data and the product's
own history (read-only). Run: python3 -I changes.py <study folder> <bare clone of civicsmith-copy> <out json>

For each change: the provider, the pull request, the commit before (the merge's first parent) and after (the merge),
the users Process3 told (with the study's import facts), the declared users at the commit before, and the judged
verdict of every user that was judged affected (classified241.tsv). Users told and never judged affected were judged
"not affected" by Process3's AI workers or never judged; the study's verdict files hold which (not used here)."""
import sys, json, csv, re, subprocess, collections

study, repo, out = sys.argv[1:4]
PROVIDERS = ['ai-runs', 'ai-accounts', 'op-declarations', 'ai-catalogue', 'ai-use', 'wizard-scripts']

def git(*a):
    return subprocess.run(['git', '-C', repo, *a], capture_output=True, check=True).stdout.decode()

srcimp = json.load(open(f'{study}/data/srcimp.json'))
rows = list(csv.DictReader(open(f'{study}/data/classified241.tsv'), delimiter='\t'))
app = open(f'{study}/../replay/appendix_commits.md').read()
changes = []
for p in PROVIDERS:
    keys = sorted({k.split('|')[0] for k in srcimp if k.split(':')[0] == p}, key=lambda c: int(c.split(':')[1]))
    for c in keys:
        m = re.search(r'`' + re.escape(c) + r'` \| (\w+) \| `(\w+)` \| `(\w+)`', app)
        kind, merge, parent = m.group(1), m.group(2), m.group(3)
        told = {k.split('|')[1]: {'srcImports': v[0], 'testImports': v[1]} for k, v in srcimp.items() if k.split('|')[0] == c}
        mods = json.loads(git('show', f'{parent}:build/modules.json'))['modules']
        declared = [x['id'] for x in mods if p in x.get('uses', [])]
        verdicts = {r['user']: {'outcome': r['outcome (judged)'], 'kind': r['kind (judged)'], 'brokenIn': r['broken in'], 'evidence': r['evidence']} for r in rows if r['change'] == c}
        files = [l for l in git('diff', '--name-only', parent, merge).splitlines()]
        own = [x for x in mods if x['id'] == p][0]
        under = lambda f, q: f == q or (q.endswith('/') and f.startswith(q))
        pfiles = [f for f in files if any(under(f, q) for q in own['paths'] + own['tests'])]
        changes.append({'change': c, 'provider': p, 'pr': int(c.split(':')[1]), 'kind': kind, 'before': parent, 'after': merge,
                        'told': told, 'declaredUsers': declared, 'verdicts': verdicts,
                        'providerFilesChanged': pfiles, 'otherFilesChanged': len(files) - len(pfiles)})
json.dump({'providers': PROVIDERS, 'changes': changes}, open(out, 'w'), indent=1)
tot = sum(len(c['told']) for c in changes)
oc = collections.Counter(v['outcome'] for c in changes for v in c['verdicts'].values())
print(len(changes), 'changes', tot, 'notifications', dict(oc))
for c in changes:
    print(c['change'], c['kind'], len(c['told']), 'told', len(c['declaredUsers']), 'declared', len(c['providerFilesChanged']), 'provider files', c['otherFilesChanged'], 'other files')
