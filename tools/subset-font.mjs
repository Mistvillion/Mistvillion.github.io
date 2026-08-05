/**
 * 字体子集化脚本。
 *
 * 完整字体（tools/font-source/LXGWWenKai-Medium.ttf，约 24MB）只需在
 * 站点文案变更后重新生成一次子集即可，产物输出到 public/fonts/。
 *
 * 依赖：python3 + fonttools + brotli
 *   pip install fonttools brotli
 *
 * 用法：npm run subset:font
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = join(ROOT, 'tools/font-source/LXGWWenKai-Medium.ttf')
const OUTPUT = join(ROOT, 'public/fonts/LXGWWenKai-subset.woff2')
const VENV_PYFTSUBSET = join(ROOT, 'tools/.venv/bin/pyftsubset')

/** 覆盖 ASCII（拉丁字母、数字、常用符号） */
const ASCII_UNICODES = 'U+0020-007E'
/** 始终保留的中文标点 */
const CJK_PUNCT = '，。！？：；（）【】《》、·—…“”‘’'

/** 站点内可能出现文案的源文件，用于收集字形 */
const CONTENT_FILES = [
  'index.html',
  'src/i18n/locales/zh.json',
  'src/i18n/locales/en.json',
  'src/data/site.ts',
  'src/data/profile.ts',
  'src/config/guestbook.ts',
]

if (!existsSync(SOURCE)) {
  console.error(`找不到完整字体：${SOURCE}`)
  process.exit(1)
}

const chars = new Set(CJK_PUNCT)

for (const file of CONTENT_FILES) {
  const path = join(ROOT, file)
  if (!existsSync(path)) {
    continue
  }
  const text = readFileSync(path, 'utf8')
  for (const ch of text) {
    const code = ch.codePointAt(0)
    if (code === undefined) continue
    if (code >= 0x20 && code <= 0x7e) continue // ASCII 由 --unicodes 覆盖
    chars.add(ch)
  }
}

const charList = [...chars].sort().join('')
const textFile = join(ROOT, 'tools/.subset-chars.txt')
writeFileSync(textFile, charList)

mkdirSync(dirname(OUTPUT), { recursive: true })

const pyftsubset = existsSync(VENV_PYFTSUBSET) ? VENV_PYFTSUBSET : 'pyftsubset'

execFileSync(pyftsubset, [
  SOURCE,
  `--text-file=${textFile}`,
  `--unicodes=${ASCII_UNICODES}`,
  `--output-file=${OUTPUT}`,
  '--flavor=woff2',
  '--layout-features=*',
  '--glyph-names',
  '--symbol-cmap',
  '--legacy-cmap',
  '--notdef-glyph',
  '--notdef-outline',
  '--recommended-glyphs',
  '--name-IDs=*',
  '--name-legacy',
  '--name-languages=*',
])

console.log(`子集化完成：${OUTPUT}（收集 ${chars.size + 95} 个字符）`)
