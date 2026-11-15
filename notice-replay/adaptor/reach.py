"""For each replayed change: how many modules use the provider directly (declared) and directly or through another
module (the closure of declared uses), at the commit before. Writes data/reach.json.
Run: python3 -I adaptor/reach.py <bare clone>"""
import sys, json, subprocess
repo = sys.argv[1]
d = json.load(open('data/changes.json'))
out = {}
for c in d['changes']:
    ms = json.loads(subprocess.run(['git', '-C', repo, 'show', c['before'] + ':build/modules.json'], capture_output=True, check=True).stdout)['modules']
    users_of = {}
    for m in ms:
        for u in m.get('uses', []):
            users_of.setdefault(u, set()).add(m['id'])
    seen, todo = set(), [c['provider']]
    while todo:
        x = todo.pop()
        for u in users_of.get(x, ()):
            if u not in seen and u != c['provider']:
                seen.add(u); todo.append(u)
    out[c['change']] = {'direct': len(users_of.get(c['provider'], ())), 'closure': len(seen), 'modules': len(ms)}
json.dump(out, open('data/reach.json', 'w'), indent=1)
for k, v in out.items(): print(k, v)
