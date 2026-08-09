#!/usr/bin/env python3
"""重新生成站点 WenKai 字体子集。

站点自托管 LXGW WenKai 的子集（全量 24MB，站点实际用字很少）。
本脚本从仓库根的 *.html 中提取全部可见字符，子集化源 TTF 并输出 woff2。

改文案后运行一次：新增汉字自动并入子集，保证不出现缺字。
（缺失字形会静默回退到系统字体栈，所以跳过本脚本不是致命，只是不一致。）

要求：python3 + fonttools + brotli。macOS Homebrew Python 为外部管理，
需用 venv：
    python3 -m venv .venv && .venv/bin/pip install fonttools brotli
然后以 .venv/bin/python3 运行本脚本。

规范：字符集 = 全站可见汉字 + BONUS 通用标点/数字。
aria-* 标签由读屏使用、不用网页字体，不纳入；<noscript> 内联样式非可见文本，不纳入。
"""
import re
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/fonts/LXGWWenKai-Medium.ttf"
OUT = ROOT / "assets/fonts/LXGWWenKai-Medium.woff2"

# 通用中文标点与数字：未来文案很可能用到，一并纳入，避免频繁重新子集化。
BONUS = set("，。！？、；：（）《》【】…—·\"'0123456789")


def visible_text(paths):
    text = ""
    for p in paths:
        html = p.read_text(encoding="utf-8")
        html = re.sub(r"<noscript>.*?</noscript>", "", html, flags=re.S)
        text += re.sub(r"<[^>]+>", "", html)  # 去标签与属性，保留文本
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


if __name__ == "__main__":
    main()
