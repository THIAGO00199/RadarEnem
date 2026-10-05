"""Confirm that the public CDN serves this checked-out build after Pages deployment."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from hashlib import sha256
from concurrent.futures import ThreadPoolExecutor
from time import sleep
import os
import re
root = Path(__file__).resolve().parent.parent / "docs"
base = "https://thiago00199.github.io/RadarEnem/"
version = os.environ.get("GITHUB_SHA", "glow")
assets = re.findall(r'(?:src|href)="[.]/(assets/[^"]+)"', (root / "index.html").read_text())
paths = ["index.html", "estudar.html", "estudar-offline.html", "sw.js", "shared/recommend.js", "shared/essay-ideas-data.js", "shared/essay-ideas-model.js", "shared/essay-ideas-ui.js", "shared/essay-ideas.css", "hub/library-data.js", "hub/glow.css", "hub/experience.css", "hub/experience.js", "hub/session-model.js", "hub/insights.js", "hub/insights.css", "hub/insights-model.js", "hub/practice-data.js", "shared/brief.js", "hub/core.js", "hub/app.js", "shared/tokens.css", "shared/motion.js", "shared/fonts/manrope-latin-variable.woff2", "materiais/pdfs/redacao.pdf", "materiais/pdfs/matematica.pdf", "materiais/pdfs/revisao.pdf", "materiais/pdfs/planejamento.pdf"] + assets
def verify(name):
    expected = (root / name).read_bytes()
    resource = "" if name == "index.html" else name
    request = Request(base + resource + "?" + urlencode({"build": version}), headers={"Cache-Control": "no-cache", "User-Agent": "Kalore-Published-Check"})
    with urlopen(request, timeout=20) as response:
        actual = response.read()
    if sha256(actual).digest() != sha256(expected).digest():
        raise RuntimeError("CDN has not published the expected version of " + name)
    return name, len(actual)
for attempt in range(18):
    try:
        with ThreadPoolExecutor(max_workers=4) as pool:
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
