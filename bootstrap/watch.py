#!/usr/bin/env python3
"""Cloud OS liveness watchdog. Restarts failed supervisor, never claims product work complete."""
import argparse
from pathlib import Path
import signal
import subprocess
import sys
import time


def watch(command, delay=95, max_restarts=None):
    restarts=0
    while True:
        child=subprocess.Popen(command,start_new_session=True)
        try:
            code=child.wait()
        except KeyboardInterrupt:
            import os
            os.killpg(child.pid,signal.SIGTERM)
            child.wait()
            return 130
        if code==0:
            return 0
        restarts+=1
        print(f'Supervisor exited {code}; replacement {restarts} after lease expiry.',flush=True)
        if max_restarts is not None and restarts>max_restarts:
            return code
        time.sleep(delay)


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--state',required=True); p.add_argument('--repo',required=True)
    p.add_argument('--runtime',required=True); p.add_argument('--max-restarts',type=int,default=3)
    a=p.parse_args()
    cmd=[sys.executable,str(Path(__file__).with_name('runner.py')),'--state',a.state,
         '--repo',a.repo,'--runtime',a.runtime]
    return watch(cmd,max_restarts=a.max_restarts)

if __name__=='__main__': sys.exit(main())
