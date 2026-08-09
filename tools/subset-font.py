#!/usr/bin/env python3
"""Regenerate the site's subset webfont.

The site self-hosts LXGW WenKai as a subset: the full font is 24MB, the
site's visible text is a few dozen characters. This script extracts every
visible character from the *.html files in the repo root, subsets the
source TTF, and writes the woff2 that the site actually loads.

Run after adding any new text to the site (new pages, new copy) so the
font keeps covering it. Missing glyphs silently fall back to the system
font stack, so skipping this is not fatal — just inconsistent.

Requires: python3 + fonttools with brotli (`pip install fonttools brotli`)
"""
import re
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/fonts/LXGWWenKai-Medium.ttf"
OUT = ROOT / "assets/fonts/LXGWWenKai-Medium.woff2"

# Visible text only: aria-* labels are consumed by screen readers, which
# do not use webfonts, so their glyphs do not need to be included.
BONUS = set("，。！？、；：（）《》【】…—·\"'0123456789")

def visible_text(paths):
    text = ""
    for p in paths:
        html = p.read_text(encoding="utf-8")
        text += re.sub(r"<[^>]+>", "", html)  # strip tags and attributes
    return text

def main():
    chars = BONUS | {c for c in visible_text(ROOT.glob("*.html")) if c.strip()}

    font = TTFont(SRC)
    opts = subset.Options()
    opts.flavor = "woff2"
    ss = subset.Subsetter(opts)
    ss.populate(text="".join(sorted(chars)))
    ss.subset(font)
    font.save(OUT)

    size = OUT.stat().st_size
    print(f"{len(chars)} unique chars -> {OUT.relative_to(ROOT)} ({size/1024:.1f} KB)")
    print(f"WARNING: missing glyphs will fall back; keep this runnable." if False else "")

if __name__ == "__main__":
    main()
