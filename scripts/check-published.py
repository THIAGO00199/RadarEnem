"""Compare the public CDN with the actual committed Next.js static export."""
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from pathlib import Path
from time import sleep
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import os

root = Path(__file__).resolve().parent.parent / "docs"
base = os.environ.get("PUBLISHED_URL", "https://thiago00199.github.io/RadarEnem/").rstrip("/") + "/"
version = os.environ.get("GITHUB_SHA", "atena")
# Verify every exported resource, including React chunks, local fonts and the image.
paths = sorted(str(item.relative_to(root)) for item in root.rglob("*") if item.is_file() and not item.name.startswith(".") and item.name != "CNAME")


def verify(name):
    expected = (root / name).read_bytes()
    resource = "" if name == "index.html" else name
    request = Request(base + resource + "?" + urlencode({"build": version}), headers={"Cache-Control": "no-cache", "User-Agent": "ATENA-Published-Check"})
    with urlopen(request, timeout=20) as response:
        actual = response.read()
    if sha256(actual).digest() != sha256(expected).digest():
        raise RuntimeError("CDN has not published the expected version of " + name)
    return name, len(actual)


for attempt in range(18):
    try:
        with ThreadPoolExecutor(max_workers=6) as pool:
            results = list(pool.map(verify, paths))
        for name, size in results:
            print("Published:", name, size, "bytes")
        print("Public smoke check passed:", len(results), "resources match the validated build.")
        break
    except Exception as error:
        if attempt == 17:
            raise
        print("Waiting for Pages:", type(error).__name__, str(error)[:200], flush=True)
        sleep(8)
