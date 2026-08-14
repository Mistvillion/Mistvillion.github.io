# Mistvillion's Home 个人主页

本仓库是个人主页 `sparklerain.top` 的源码仓库。本文档是构建与维护该站点的**唯一权威规范**：站点按本文档重建，任何与线上草稿的差异以本文档为准。

站点为纯静态（无构建框架、零外部依赖、不引 CDN），最终由 GitHub Pages 部署，仓库根目录即站点根目录。

站点**仅使用英文**（无任何中文内容），全站唯一字体为 PT Serif（**全量 TTF，不子集化**）。

---

## 不可变源文件

以下**源文件**是只读的，任何操作（构建、清理、优化）都不得修改或删除，也不得改动其内容：

- `assets/images/background2.png`（背景原件，用于派生 webp）
- `assets/images/favicon.jpg`（favicon 原件，页面直接引用）
- `assets/fonts/PTSerif-Regular.ttf`、`assets/fonts/PTSerif-Bold.ttf`（PT Serif 源字体，页面直接引用）
- `assets/fonts/OFL.txt`（许可证，不可删除）
- `.git`
- `CNAME`

保留理由：字体即源文件本身（页面直接引用）；背景原件用于重新派生 webp。

## 目录约定

| 目录 | 角色 |
|---|---|
| `assets/fonts/`、`assets/images/` | 资源根目录；`assets/fonts/` 为只读源字体，`assets/images/` 容纳源文件与派生 webp |
| `assets/css/`、`assets/js/` | 样式与脚本 |
| `docs/` | 非站点的维护文档（诊断记录等） |
| `CONTEXT.md` | 领域词汇表（术语规范），非站点页面 |
| 仓库根 | 页面文件：`index.html`、`profile.html`、`notes.html` |

背景 webp 派生文件写入 `assets/images/` 与源文件同目录；源文件按清单只读，派生文件可随时重建。

---

## 页面规范

### 三页共享

**背景**：`assets/images/background2.png` 的 webp 派生，位于 `assets/images/background2.webp`，≤ 150KB。

**favicon**：三页 `<link rel="icon">` 直接引用源文件 `assets/images/favicon.jpg`。

**导航栏**：右上角**液态玻璃胶囊导航**（全透明 + 模糊、胶囊形、内联一行）。5 栏顺序固定：

| 栏 | 文字 | 链接 | 行为 |
|---|---|---|---|
| 1 | Home | `index.html`（站点根） | 站内 |
| 2 | Profile | `profile.html` | 站内 |
| 3 | Notes | `notes.html`（站内页面） | 站内 |
| 4 | Blogs | `https://blog.sparklerain.top/` | 新标签页，同上 |
| 5 | GitHub | `https://github.com/Mistvillion` | 新标签页，同上 |

站内链接一律用**相对路径**，确保无 404；当前页的导航项标 `aria-current="page"`。

**字体策略**（全站统一，见"字体规范"）：全站唯一字体 PT Serif（全量 TTF）。

**视觉约束**：以下是唯一被钉死的视觉规范，其余视觉细节由构建者决定：
1. 液态玻璃胶囊导航（如上）。
2. 标题为金色 `#f6d38a`。

**页面结构**：三页必须保持 `main.page` 内含唯一 `section`（Home 为 `.home`，Profile 为 `.profile-view`，Notes 为 `.notes-view`）——站内切换通过替换该 `section` 实现（见"页面切换"）。

### Home（`index.html`）

极简，只有三样：背景、导航、左下角标题块。

标题块：主标题 **"Mistvillion's Home"（金色 `#f6d38a`）** 在上，**下方一行引言**（原文照抄）：

```
Such feeling cannot be recalled again; It seemed long lost e'en when it was felt then.
```

### Profile（`profile.html`）

与 Home 相同的背景与导航，**没有**左下角标题块。正中间直接显示内容：

- 标题：`Profile`
- 正文（原文照抄，6 连写，句末句点）：

```
This is a placeholder introduction. This is a placeholder introduction. This is a placeholder introduction. This is a placeholder introduction. This is a placeholder introduction. This is a placeholder introduction.
```

### Notes（`notes.html`）

与 Home 相同的背景与导航，**没有**左下角标题块。正中间直接显示内容：

- 标题：`Notes`
- 正文（原文照抄，句末句点）：

```
This is a record of some notes I took while attending different courses.
```

- 正文下方纵向堆叠 note cards，每张为与导航栏相同的液态玻璃胶囊，含标题与简介，外链新标签页并带 `rel="noopener noreferrer"`：

| 标题 | 简介 | 链接 |
|---|---|---|
| Linear Algebra | Based on notes from the MIT 18.06 Linear Algebra course. | `https://vulpara.github.io/Linear-Algebra/` |
| Probability Theory | Reference is made to Sheldon M. Ross's "A First Course in Probability (Tenth Edition)". | `https://vulpara.github.io/Probability/` |

---

## 字体规范

**全站规则：所有文字一律用 PT Serif，直接引用全量源 TTF（不子集化、不转 woff2）。** 站点无中文内容，不引入任何 CJK 字体。

```css
font-family: "PT Serif", Georgia, "Times New Roman", serif;
```

**字体文件与引用**：

| 文件 | 用途 | `@font-face` |
|---|---|---|
| `assets/fonts/PTSerif-Regular.ttf`（≈216KB，只读源文件） | 正文 | weight 400，`format("truetype")` |
| `assets/fonts/PTSerif-Bold.ttf`（≈196KB，只读源文件） | 标题/强调 | weight 700，`format("truetype")` |

三页的 `<link rel="preload" as="font" type="font/ttf" crossorigin>` 与 CSS `@font-face` 均直接指向上述 TTF。

注意：

- 全量 TTF 体积较大（合计 ≈ 412KB），换取**任何英文文案、任何标点都无需重新子集化**。
- 所有 `@font-face` 必须 `font-display: swap`。
- 不得在 `assets/fonts/` 下生成或保留 woff2/子集产物。

## 性能预算（可验收）

- 字体为全量 TTF（Regular ≈ 216KB + Bold ≈ 196KB，合计 ≈ 412KB），**不再子集化**。
- 背景 webp ≤ 150KB。
- 首屏传输量（HTML + CSS + JS + 字体）≤ 500KB，背景图与 favicon 不计入。
- 零外部依赖：不引任何 CDN 库、字体、图标。

---

## 构建步骤

按序执行，每步完成后再进入下一步：

1. **准备工具**：背景转 webp 用 `cwebp`（字体直接引用源 TTF，无需任何工具）。
2. **生成背景 webp**：`assets/images/background2.png` → `assets/images/background2.webp`，≤ 150KB。
3. **favicon**：无需复制，页面直接引用源文件 `assets/images/favicon.jpg`。
4. **编写页面**：`index.html`、`profile.html`、`notes.html`、`assets/css/site.css`、`assets/js/site.js`，遵守"页面规范"与"字体规范"。
5. **本地验收**：逐条核对"完成标准"。通过后再部署。
6. **部署**：由用户执行 `git remote` + `push`（GitHub Pages），本步骤不在构建范围内。

## 完成标准（Checklist）

构建完成后必须全部满足：

- [ ] 站点无任何中文；所有渲染英文均为 PT Serif（全量 TTF 直接引用）且无缺字。
- [ ] 导航 5 栏、顺序、链接、外链新标签行为正确；当前页有 `aria-current="page"`。
- [ ] Home 只有背景 + 导航 + 左下角标题块；金色标题 "Mistvillion's Home" 下方为引言行。
- [ ] Profile 无标题块，正中显示 "Profile" + 原文照抄的英文正文。
- [ ] Notes 无标题块，正中显示 "Notes" + 原文照抄的英文正文，正文下方为纵向堆叠的液态玻璃 note cards（含标题、简介，外链新标签页）。
- [ ] 站内链接全部为相对路径，逐个点击无 404；页面切换逻辑（预取 + DOM 交换 + View Transitions、popstate、失败回退整页跳转、reduced-motion 降级）齐全。
- [ ] 性能预算四条全部达标。
- [ ] 「不可变源文件」清单中的文件内容均未被修改或删除。

## 维护规则

- **改文案**：仅改动页面文件；全量 TTF 覆盖全部拉丁字形，英文文案新增无需任何字体处理。
- **改样式**：只允许改动页面文件与 `assets/` 中的代码/派生文件；任何改动不得触及「不可变源文件」清单中的文件。
- 部署后如需验证，本地构建产物与线上（GitHub Pages 根目录）应逐字节一致。
