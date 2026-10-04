#!/usr/bin/env python3
"""Test-only PTY capture: preserve separate terminal stdout and stderr."""

import errno
import json
import os
import selectors
import subprocess
import sys


def main():
    out_master, out_slave = os.openpty()
    err_master, err_slave = os.openpty()
    process = subprocess.Popen(
        sys.argv[1:], stdin=subprocess.DEVNULL, stdout=out_slave, stderr=err_slave
    )
    os.close(out_slave)
    os.close(err_slave)
    selector = selectors.DefaultSelector()
    selector.register(out_master, selectors.EVENT_READ, "stdout")
    selector.register(err_master, selectors.EVENT_READ, "stderr")
    output = {"stdout": bytearray(), "stderr": bytearray()}
    while selector.get_map():
        for key, _ in selector.select():
            try:
                chunk = os.read(key.fd, 65536)
            except OSError as error:
                if error.errno != errno.EIO:
                    raise
                chunk = b""
            if chunk:
                output[key.data].extend(chunk)
            else:
                selector.unregister(key.fd)
                os.close(key.fd)
    status = process.wait()
    print(json.dumps({
        "status": status,
        "stdout": output["stdout"].decode("utf-8", errors="replace"),
        "stderr": output["stderr"].decode("utf-8", errors="replace"),
    }))


if __name__ == "__main__":
    main()
