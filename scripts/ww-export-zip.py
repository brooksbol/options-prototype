"""Bounded, verified ZIP publication with atomic no-clobber hard-link commit."""
import sys, json, os, pathlib, tempfile, zipfile, hashlib

def publish(payload):
    dest=pathlib.Path(payload['downloads']); dest.mkdir(parents=True,exist_ok=True)
    files=payload['files']; manifest=json.loads(files['manifest.json'])
    expected={'market-and-verticals.json','tt1-account-positions-orders.json','evidence-coverage.json','symbol-liquidity.csv','manifest.json','README.md'}
    if set(files)!=expected: raise ValueError('Invalid package inventory')
    for name, content in files.items():
        if len(content.encode())>64*1024*1024: raise ValueError('Component capacity exceeded')
        if name!='manifest.json':
            row=next(x for x in manifest['files'] if x['name']==name)
            if hashlib.sha256(content.encode()).hexdigest()!=row['sha256']:raise ValueError('Checksum mismatch')
    fd,tmp=tempfile.mkstemp(prefix='.tt1-cadence-',suffix='.partial',dir=dest)
    os.chmod(tmp,0o600)
    try:
        with os.fdopen(fd,'w+b') as out:
            with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
                for name,content in files.items():z.writestr(name,content)
            out.flush();os.fsync(out.fileno())
        with zipfile.ZipFile(tmp) as z:
            if z.testzip() is not None or set(z.namelist())!=expected:raise ValueError('ZIP verification failed')
            for name,content in files.items():
                if z.read(name)!=content.encode():raise ValueError('ZIP content mismatch')
        # link() fails EEXIST and cannot overwrite even under concurrent exports.
        base='tt1-cadence-'+payload['sessionDate']
        suffix=payload['stamp']
        for i in range(10000):
            name=base+('' if i==0 else '-'+suffix+('' if i==1 else '-'+str(i)))+'.zip'
            try:os.link(tmp,dest/name);return str(dest/name)
            except FileExistsError:continue
        raise ValueError('Filename capacity exceeded')
    finally:
        os.unlink(tmp)

if __name__=='__main__':
    try:
        raw=sys.stdin.buffer.read(100*1024*1024+1)
        if len(raw)>100*1024*1024:raise ValueError('Package capacity exceeded')
        print(publish(json.loads(raw)))
    except Exception:
        sys.stderr.write('Export ZIP validation or atomic publication failed\n');sys.exit(1)
