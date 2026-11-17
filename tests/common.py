from pathlib import Path
import subprocess

BINARY = Path(__file__).resolve().parents[1] / "build/lttx"


def cli(*args, success=True):
    result = subprocess.run(
        [BINARY, *map(str, args)],
        capture_output=True,
        text=True,
        timeout=5
    )
    assert (result.returncode == 0) == success, result.stderr
    return result
