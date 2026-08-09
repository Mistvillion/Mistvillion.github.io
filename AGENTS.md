# 北城烟雨阁 个人主页

本仓库是个人主页 `sparklerain.top` 的源码仓库。本文档是构建与维护该站点的**唯一权威规范**：站点按本文档重建，任何与线上草稿的差异以本文档为准。

站点为纯静态（无构建框架、零外部依赖、不引 CDN），最终由 GitHub Pages 部署，仓库根目录即站点根目录。

---

## 不可变源文件

以下**源文件**是只读的，任何操作（构建、清理、优化）都不得修改或删除，也不得改动其内容：

- `assets/images/background2.png`（背景原件，用于派生 webp）
- `assets/images/favicon.jpg`（favicon 原件，页面直接引用）
- `assets/fonts/LXGWWenKai-Medium.ttf`（全量字体，用于重新子集化）
- `assets/fonts/PT_Serif/PTSerif-Regular.ttf`、`assets/fonts/PT_Serif/PTSerif-Bold.ttf`（PT Serif 源字体）
- `assets/fonts/PT_Serif/OFL.txt`（许可证，不可删除）

保留理由：源字体用于未来改文案时**重新子集化**；背景原件用于重新派生 webp。

## 目录约定

| 目录 | 角色 |
|---|---|
| `assets/fonts/`、`assets/images/` | 资源根目录，同时容纳源文件（只读，见上）与派生文件（woff2 子集、webp） |
| `assets/css/`、`assets/js/` | 样式与脚本 |
| 仓库根 | 页面文件：`index.html`、`profile.html` |

派生文件（字体子集、背景 webp）写入与源文件同目录（`assets/fonts/`、`assets/images/`）；源文件按清单只读，派生文件可随时重建。

---

## 页面规范

### 两页共享

**背景**：`assets/images/background2.png` 的 webp 派生，位于 `assets/images/background2.webp`，≤ 150KB。

**favicon**：两页 `<link rel="icon">` 直接引用源文件 `assets/images/favicon.jpg`。

**导航栏**：右上角**玻璃胶囊导航**（半透明 + 模糊、胶囊形、内联一行）。5 栏顺序固定：

| 栏 | 文字 | 链接 | 行为 |
|---|---|---|---|
| 1 | Home | `index.html`（站点根） | 站内 |
| 2 | Profile | `profile.html` | 站内 |
| 3 | GitHub | `https://github.com/Mistvillion` | 新标签页，`rel="noopener noreferrer"` |
| 4 | Blogs | `https://blog.sparklerain.top/` | 新标签页，同上 |
| 5 | Notes | `https://note.sparklerain.top/` | 新标签页，同上 |

站内链接一律用**相对路径**，确保无 404；当前页的导航项标 `aria-current="page"`。

**字体策略**（全站统一，见"字体规范"）。

**视觉约束**：以下三条是唯一被钉死的视觉规范，其余视觉细节由构建者决定：
1. 玻璃胶囊导航（如上）。
2. 模糊淡入动画（页面元素进入时 blur + 淡入）。
3. 副标题为金色 `#f6d38a`。

### Home（`index.html`）

极简，只有三样：背景、导航、左下角标题块。

标题块：**副标题 "Mistvillion's Home"（金色 `#f6d38a`）在上，主标题 "北城烟雨阁" 在下**。

### Profile（`profile.html`）

与 Home 相同的背景与导航，**没有**左下角标题块。正中间直接显示内容：

- 标题：`Profile 个人简介`
- 正文（原文照抄，无标点、无换行，18 连写）：

```
这是一段占位简介这是一段占位简介这是一段占位简介这是一段占位简介这是一段占位简介这是一段占位简介这是一段占位简介这是一段占位简介这是一段占位简介这是一段占位简介这是一段占位简介这是一段占位简介这是一段占位简介这是一段占位简介这是一段占位简介这是一段占位简介这是一段占位简介这是一段占位简介
```

---

## 字体规范

**全站规则：中文一律用霞鹭文楷（LXGW WenKai），英文一律用 PT Serif。**

一个字体栈即可，浏览器按字形自动分配（PT Serif 无 CJK 字形，中文自动落到 WenKai）：

```css
font-family: "PT Serif", "LXGW WenKai", "PingFang SC", "Microsoft YaHei", sans-serif;
```

**子集与产物**（源 TTF 保留在 `assets/fonts/`，产物与其同目录，均转 woff2）：

| 产物 | 来源 | 字符集 |
|---|---|---|
| `assets/fonts/LXGWWenKai-Medium.woff2` | `assets/fonts/LXGWWenKai-Medium.ttf`（字重 500） | 全站**实际渲染**的 15 个不重复汉字：`北城烟雨阁个人这是一段占位简介`，外加通用中文标点与数字（见 `tools/subset-font.py` 的 BONUS） |
| `assets/fonts/PTSerif-Regular.woff2` | `assets/fonts/PT_Serif/PTSerif-Regular.ttf` | 用到的拉丁字母与标点（空格、撇号等） |
| `assets/fonts/PTSerif-Bold.woff2` | `assets/fonts/PT_Serif/PTSerif-Bold.ttf` | 同上 |

注意：

- 15 字来源：`北城烟雨阁`(5) + `个人简介`(3，其中"简介"已含) + `这是一段占位简介`(8)。
- WenKai 子集由 `tools/subset-font.py` 生成：自动提取全站可见汉字 + 通用标点/数字。改文案后直接运行该脚本即可（运行要求见脚本头注释）。
- WenKai 只有 Medium 字重，站点**不得依赖中文粗体**（英文粗体用 PT Serif Bold）。
- 所有 `@font-face` 必须 `font-display: swap`。

## 页面切换（"融洽"）

站内页面切换沿用既定逻辑，并加上预取：

1. 点击站内 `.html` 链接 → 全屏淡出遮罩（约 520ms）→ 跳转目标页。
2. 新页**背景图就绪后**才做模糊淡入（`loadeddata` 或 error，3 秒兜底超时）。
3. 跳过条件：修饰键按下（ctrl/cmd/shift/alt）、非左键、外链、`target="_blank"`、当前页、`prefers-reduced-motion`。
4. `pageshow` 时清除离开态（兼容浏览器往返缓存）。
5. 导航栏站内链接 hover/focus 时 `rel="prefetch"` 目标页，切换体感接近瞬开。
6. 支持 `prefers-reduced-motion`（关闭全部动画）。

## 性能预算（可验收）

- 字体合计 ≤ 60KB（15 字 WenKai + 两个 PT Serif 拉丁子集）。
- 背景 webp ≤ 150KB。
- 首屏传输量（HTML + CSS + JS + 字体）≤ 250KB，背景图与 favicon 不计入。
- 零外部依赖：不引任何 CDN 库、字体、图标。

---

## 构建步骤

按序执行，每步完成后再进入下一步：

1. **准备工具**：`python3 -m venv .venv && .venv/bin/pip install fonttools brotli`（macOS 的 Homebrew Python 为外部管理，必须用 venv）提供 `pyftsubset`；背景转 webp 用 `cwebp`。
2. **生成字体子集**：WenKai 用 `tools/subset-font.py` 一键生成（自动提取可见字符）；PT Serif 按"字体规范"的字符集用 `pyftsubset` 子集化并转 woff2，均写入 `assets/fonts/`。完成后确认：产物总大小 ≤ 60KB，且用浏览器打开时**无任何缺字**（15 字与全部英文都渲染正确）。
3. **生成背景 webp**：`assets/images/background2.png` → `assets/images/background2.webp`，≤ 150KB。
4. **favicon**：无需复制，页面直接引用源文件 `assets/images/favicon.jpg`。
5. **编写页面**：`index.html`、`profile.html`、`assets/css/site.css`、`assets/js/site.js`，遵守"页面规范"与"字体规范"。
6. **本地验收**：逐条核对"完成标准"。通过后再部署。
7. **部署**：由用户执行 `git remote` + `push`（GitHub Pages），本步骤不在构建范围内。

## 完成标准（Checklist）

构建完成后必须全部满足：

- [ ] 所有渲染中文均来自 WenKai 子集且无缺字；所有渲染英文均为 PT Serif。
- [ ] 导航 5 栏、顺序、链接、外链新标签行为正确；当前页有 `aria-current="page"`。
- [ ] Home 只有背景 + 导航 + 左下标题块；副标题（金色 `#f6d38a`）在上、主标题在下。
- [ ] Profile 无标题块，正中显示 "Profile 个人简介" + 原文照抄的正文。
- [ ] 站内链接全部为相对路径，逐个点击无 404；页面切换逻辑（淡出→跳转→就绪后淡入、prefetch、reduced-motion）齐全。
- [ ] 性能预算四条全部达标。
- [ ] 「不可变源文件」清单中的文件内容均未被修改或删除。

## 维护规则

- **改文案**：正文或标题新增汉字时，运行 `tools/subset-font.py` 重新生成 WenKai 子集（自动并入新字），并把新汉字同步进本文档的 15 字清单。
- **改样式**：只允许改动页面文件与 `assets/` 中的代码/派生文件；任何改动不得触及「不可变源文件」清单中的文件。
- 部署后如需验证，本地构建产物与线上（GitHub Pages 根目录）应逐字节一致。
