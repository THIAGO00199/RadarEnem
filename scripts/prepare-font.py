"""Reproducible, self-hosted Latin Manrope variable font (SIL Open Font License)."""
from pathlib import Path
from urllib.request import urlopen
from io import BytesIO
from hashlib import sha1
from fontTools.ttLib import TTFont
from fontTools import subset
target = Path(__file__).resolve().parent.parent / "portable/public/shared/fonts/manrope-latin-variable.woff2"
if target.exists() and target.stat().st_size > 10000:
    print("Manrope ready:", target.stat().st_size, "bytes")
else:
    raw = urlopen("https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf", timeout=30).read()
    digest = sha1(b"blob " + str(len(raw)).encode() + bytes([0]) + raw).hexdigest()
    if digest != "75274da58537d6123b14f2cd0c355ad4681fc2b3":
        raise RuntimeError("Font source changed. Review and update the pinned source hash.")
    font = TTFont(BytesIO(raw))
    options = subset.Options()
    options.layout_features = ["*"]
    tool = subset.Subsetter(options=options)
    tool.populate(unicodes=list(range(0x250)) + list(range(0x2000,0x2070)) + list(range(0x20A0,0x20D0)))
    tool.subset(font)
    font.flavor = "woff2"
    target.parent.mkdir(parents=True, exist_ok=True)
    font.save(target)
    print("Manrope prepared:", target.stat().st_size, "bytes")
