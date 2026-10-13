# Mistvillion's Home

个人主页 [sparklerain.top](https://sparklerain.top) 的源码。纯静态站点，零依赖，GitHub Pages 部署。

## 本地预览

页面通过 fetch 读取文章，需要用静态服务器打开：

```sh
python3 -m http.server 8000
```

然后访问 <http://localhost:8000/>

## 写一篇新博客

1. 在 `blogs/` 下新建文件夹，命名为 `日期-英文名`，比如 `blogs/2026-10-12-Something/`。文件夹名就是文章链接里的 slug。
2. 在里面新建 `index.md`，并放入文章用到的图片。开头写 front matter：

   ```
   ---
   title: 标题
   published: 2026-10-12
   description: 一句话简介
   category: 多彩生活
   ---
   ```

   分类用中文，现有：多彩生活、学习心得、瞬息欢愉。
3. 正文里图片用相对路径：`![](图片.jpg)`。不支持内嵌 HTML。
4. 重建索引：

   ```sh
   node scripts/build-blog-index.mjs
   ```

   改了标题、简介、分类、正文，或者删了文章，也要重跑这一步。
5. 本地预览确认无误后提交、推送。

## 部署

推送到 GitHub 后由 GitHub Pages 自动发布，仓库根目录即站点根目录。
