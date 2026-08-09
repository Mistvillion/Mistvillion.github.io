# AGENTS.md

北城烟雨阁（Mistvillion）个人主页。纯静态多页站点：无构建步骤、无框架、无 GitHub Actions。内容一律提交到 `main`（Push 即发布，若改动后线上没更新，检查 Settings → Pages 的 Source 指向）；`gh-pages` 分支是已取消的旧部署流程的过期产物，不要在其上开发，也不要拿它回滚。别引入构建工具或框架——之前重构过又回退了，站点刻意保持朴素。

## 显现机制（reveal）

两页都依赖同一套显现机制，任何页面改动都要服从它：

- 页面默认隐形：`.page` 初始 `opacity: 0`，只有 `<html>` 挂上 `page-ready` 类才显示。
- `assets/js/site.js` 负责挂类：等背景图就绪后加 `page-ready`，3 秒超时兜底。**不再等字体**——字体是 ~14KB 的子集 woff2、`font-display: swap` 异步换入，页面不该被它拖住。新页面必须带上完整 `<head>`（site.css、字体 preload、favicon）并引入 `site.js`——漏掉脚本的页面永远不会出现。
- 同一脚本拦截同源 `.html` 链接：挂上 `page-leaving`（退场动画）后 520ms 跳转。因此站内链接必须以 `.html` 结尾；当前页导航标 `aria-current="page"`（该链接不被拦截）；外链保持 `target="_blank" rel="noopener noreferrer"` 直通。
- `page-ready` / `page-leaving` 两个类名被 site.js 与 site.css 共用，改名必须两侧同步；`.background-video` 等选择器同理，被 HTML / CSS / JS 三方共用。

## 首屏纪律

站点自托管字体，且是按**可见文字子集化**的 woff2（`assets/fonts/LXGWWenKai-Medium.woff2`，~14KB）；完整 TTF（24MB）只作为子集源保留在 `assets/fonts/LXGWWenKai-Medium.ttf`，不参与站点加载。

- **新增中文内容后，重新跑 `tools/subset-font.py`**（需 `pip install fonttools brotli`）——漏掉的字符会静默回退到系统字体。
- 背景图是压缩过的 WebP（~105KB）。新图片入库前先压缩（`cwebp -q 80`），背景/大图不得回到首屏路径。

## 改页面

1. 新页面从 `index.html` 复制 `<head>`、`site.js` 引入，以及 `.page` / `.background-video` / `.video-shade` / `.top-nav` 结构。
2. 导航是各页手写、无模板：新链接要加进**每一页**的 `.top-nav`。
3. 核对清单（全部通过才算完成）：
   - 新页面无 `page-ready` 时隐形、脚本就绪后正常显现；
   - 站内链接全部以 `.html` 结尾；
   - 每页导航包含全部页面，且仅当前页有 `aria-current="page"`；
   - 首屏路径除新页面自身外未新增任何字节；
   - 新页面含子集外的新字符 → 重跑 `tools/subset-font.py`。

## 其他约定

- `problem.md` 是待办清单，不属于站点内容；条目修好、经真机验证后即删除（git 历史自会记录）。
- 不再被引用的资源从仓库删除（grep 确认无引用后再删）。
