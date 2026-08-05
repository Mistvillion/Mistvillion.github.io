# 北城烟雨阁 · 个人主页

Mistvillion 的个人主页（非博客）。基于 Vite + React 19 + TypeScript 构建，部署于 GitHub Pages（`sparklerain.top`）。

## 技术栈

| 领域     | 选型                                                                      |
| -------- | ------------------------------------------------------------------------- |
| 构建     | Vite 7                                                                    |
| UI       | React 19 + React Router 7（SPA）                                          |
| 语言     | TypeScript（strict）                                                      |
| 国际化   | react-i18next（中 / 英，localStorage 记忆，默认跟随浏览器语言）           |
| 留言板   | Giscus（GitHub Discussions）                                              |
| 测试     | Vitest + Testing Library                                                  |
| 代码质量 | ESLint 9（flat config）+ Prettier + Husky/lint-staged（提交前自动格式化） |
| CI/CD    | GitHub Actions（CI 门禁 + 构建推送 gh-pages 分支）                        |

## 快速开始

```bash
npm install
npm run dev        # 本地开发 http://localhost:5173
```

## 常用脚本

| 命令                              | 说明                                  |
| --------------------------------- | ------------------------------------- |
| `npm run dev`                     | 启动开发服务器                        |
| `npm run build`                   | 类型检查 + 生产构建（输出到 `dist/`） |
| `npm run preview`                 | 本地预览构建产物                      |
| `npm run lint` / `lint:fix`       | ESLint 检查 / 自动修复                |
| `npm run format` / `format:check` | Prettier 格式化 / 校验                |
| `npm test`                        | 运行单元测试（Vitest）                |
| `npm run typecheck`               | TypeScript 类型检查                   |
| `npm run subset:font`             | 重新生成字体子集（见下文）            |

## 目录结构

```
public/                  # 静态资源（直接拷贝到产物根目录）
  CNAME                  # 自定义域名 sparklerain.top
  favicon.jpg
  fonts/                 # 子集化字体（构建产物）
  images/                # 背景视频
src/
  components/            # 背景视频、导航、留言板、语言切换等组件
  pages/                 # 首页 / 个人简介 / 留言板
  hooks/                 # 加载门控、页面进场、标题同步等 hooks
  i18n/                  # 国际化初始化 + 中英文案
  config/guestbook.ts    # Giscus 配置（repo-id / category-id 等）
  data/                  # 站点数据（导航外链、个人简介）
  styles/site.css        # 全局样式
  test/setup.ts          # 测试环境初始化
tools/
  font-source/           # 完整字体（仅子集化用，不参与构建）
  subset-font.mjs        # 字体子集化脚本
```

## 内容维护

- **页面文案**：编辑 `src/i18n/locales/zh.json` 与 `en.json`，无需改动组件。
- **个人简介**：数据入口在 `src/data/profile.ts`，文案 key 指向 i18n 文件中的 `profile.*` 字段，追加章节即在数组中新增条目。
- **导航外链**：`src/data/site.ts`。
- **站名与 kicker**：`i18n` 中的 `site.name` / `site.kicker`（中文态 kicker 为「雾都之家」，英文态为 "Mistvillion's Home"，可自行调整）。

## 字体子集化

完整字体 `LXGWWenKai-Medium.ttf` 约 24MB，站点实际只用其中少量字形。`npm run subset:font` 会扫描文案源文件收集所需字符，用 `pyftsubset` 生成 woff2 子集（约数百 KB）到 `public/fonts/`。

依赖与用法：

```bash
pip install fonttools brotli
npm run subset:font
```

**新增页面文案后务必重新执行一次**，否则新字符会回退到系统字体显示。

## 留言板（Giscus）

留言板基于 [Giscus](https://giscus.app)，数据存储于本仓库的 GitHub Discussions。

- 配置集中在 `src/config/guestbook.ts`。
- 前提：仓库已启用 Discussions（Settings → General → Features → Discussions），且 giscus app 已安装。
- 更换分类或仓库后，到 giscus.app 重新生成配置并同步更新该文件。

## 部署

1. 推送到 `main` 分支后，GitHub Actions 自动执行 CI（lint + typecheck + test + build），通过后 `deploy.yml` 将 `dist/` 推送到 `gh-pages` 分支。
2. 仓库设置（Settings → Pages → Build and deployment → Source）需选择 **Deploy from a branch**，分支选 `gh-pages`。
3. 自定义域名 `sparklerain.top` 由 `public/CNAME` 维护。
4. SPA 深链接（如直接访问 `/guestbook`）由构建产物中的 `404.html` 兜底（构建时自动从 `index.html` 复制）。

## 测试

```bash
npm test          # 单次运行
npm run test:watch  # 监听模式
```

测试覆盖：路由渲染、导航与外部链接、语言切换与持久化、i18n 语言检测、页面渲染。
