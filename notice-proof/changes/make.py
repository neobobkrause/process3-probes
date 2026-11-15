"""Writes the planned changes as folders: change.json, files/ (each file the change writes, whole), change.diff.

Each change is described here as exact text replacements on the product as it stands before the change, so that
every edit is checked to land exactly once. Run: python3 changes/make.py <series> (from notice-proof/).
"""
import json, os, re, subprocess, sys, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRODUCT = os.path.join(ROOT, 'product')

def before_text(series, before, path):
    """The text of a product file in the state 'before' (a list of earlier changes), else the product's."""
    text = open(os.path.join(PRODUCT, path)).read() if os.path.exists(os.path.join(PRODUCT, path)) else None
    for b in before:
        s, i = b.split('/') if '/' in b else (series, b)
        p = os.path.join(ROOT, 'changes', s, i, 'files', path)
        if os.path.exists(p):
            text = open(p).read()
    return text

def change(series, cid, title, provider, covers, edits, before=(), note=None):
    d = os.path.join(ROOT, 'changes', series, cid)
    shutil.rmtree(d, ignore_errors=True)
    os.makedirs(d)
    meta = {'title': title, 'provider': provider, 'covers': covers}
    if before:
        meta['before'] = list(before)
    if note:
        meta['note'] = note
    json.dump(meta, open(os.path.join(d, 'change.json'), 'w'), indent=2)
    diffs = []
    for path, ops in edits.items():
        old = before_text(series, before, path)
        if isinstance(ops, str):
            new = ops
        else:
            new = old
            for op in ops:
                if op[0] == 'ALL':
                    _, a, b = op
                    assert a in new, (cid, path, a)
                    new = new.replace(a, b)
                elif op[0] == 'RE':
                    _, a, b = op
                    new, n = re.subn(a, b, new)
                    assert n > 0, (cid, path, a)
                else:
                    a, b = op
                    assert new.count(a) == 1, (cid, path, new.count(a), a[:80])
                    new = new.replace(a, b)
        assert new != old, (cid, path, 'no change')
        out = os.path.join(d, 'files', path)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, 'w').write(new)
        a_tmp, b_tmp = out + '.a', out + '.b'
        open(a_tmp, 'w').write(old or '')
        open(b_tmp, 'w').write(new)
        r = subprocess.run(['diff', '-u', '--label', f'before/{path}', '--label', f'after/{path}', a_tmp, b_tmp], capture_output=True, text=True)
        diffs.append(r.stdout)
        os.remove(a_tmp); os.remove(b_tmp)
    open(os.path.join(d, 'change.diff'), 'w').write(''.join(diffs))

if __name__ == '__main__':
    series = sys.argv[1]
    exec(open(os.path.join(ROOT, 'changes', f'{series}.py')).read())
