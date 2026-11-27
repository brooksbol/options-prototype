"""Load hash-bound accepted PR50/PR46 components; never dispatch on import."""
from pathlib import Path
import hashlib, importlib.util
from functools import lru_cache
BASE = Path.home()/'Library/Application Support/Wheelwright/agent-communication/20261117-pr50'
PINS = {
 'nov18-batch-20261117/batch.py':'e0b8b7adc9dd2e328b6bb8039e9ee81c221e35702d723865da74ede615b02767',
 'p50-exits-20261117/exits.py':'ac8b58d8340c507c4591f89f34167e903bce97ac4b4a0a63dc79f7ca8867488f',
 'expiry-executor-v04-repair/runner.py':'d9834feee93f82f9f491decb6eff415f1ea90a6f1d057de5c32e2416ad28e766',
}

def load(name, path):
    spec=importlib.util.spec_from_file_location(name,path)
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
    return mod

@lru_cache(maxsize=1)
def components():
    for rel,digest in PINS.items():
        if hashlib.sha256((BASE/rel).read_bytes()).hexdigest()!=digest:
            raise RuntimeError('Accepted reuse source changed: '+rel)
    exits=load('i2_accepted_exits',BASE/'p50-exits-20261117/exits.py')
    runner=load('i2_accepted_expiry',BASE/'expiry-executor-v04-repair/runner.py')
    return exits.m,exits,runner
