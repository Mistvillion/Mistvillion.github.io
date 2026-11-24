/* Mistvillion's Home - page logic
   First load: content shows at once; the background fades in when loaded.
   Internal links: prefetch + DOM swap inside a View Transition.
   Failure: full-page navigation.
   Blog data: blogs/index.json lists posts; posts and the profile are Markdown rendered here. */

(function () {
    "use strict";

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    /* ---------- Background fade-in ---------- */

    function fadeInBackground(root) {
        const pageBg = root.querySelector(".page-bg");
        if (!pageBg) {
            return;
        }
        const markLoaded = () => pageBg.classList.add("is-loaded");
        if (pageBg.complete) {
            markLoaded();
        } else {
            pageBg.addEventListener("load", markLoaded, { once: true });
            pageBg.addEventListener("error", markLoaded, { once: true });
        }
    }

    /* ---------- Text ---------- */

    /* Bilingual Chrome: navigation, page titles, section headings, and category labels are English;
       body copy, reading time, and interactive UI feedback are Chinese. */
    const TEXT = {
        "blogs.title": "Mistvillion's Blogs",
        "all": "All",
        "minRead": " 分钟阅读",
        "empty": "暂无文章。",
        "listFailed": "文章列表加载失败。",
        "postFailed": "文章加载失败。",
        "postMissing": "文章不存在。",
        "postSection": "章节",
        "commentsFailed": "评论加载失败，请刷新后重试。"
    };

    const PROFILE_FILE = "blogs/about.md";

    function t(key) {
        return TEXT[key];
    }

    /* Keep the tab title in sync with the page's data-title. */
    function applyTitle() {
        const main = document.querySelector("main.page");
        if (main && main.dataset.title) {
            document.title = main.dataset.title;
            main.setAttribute("aria-label", main.dataset.title);
        }
    }

    /* ---------- Blog data ---------- */

    let postIndex = null;
    const textCache = new Map();

    function fetchText(path) {
        if (!textCache.has(path)) {
            const promise = fetch(path, { credentials: "same-origin" })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("HTTP " + response.status);
                    }
                    return response.text();
                })
                .catch((error) => {
                    textCache.delete(path);
                    throw error;
                });
            textCache.set(path, promise);
        }
        return textCache.get(path);
    }

    function loadPostIndex() {
        if (!postIndex) {
            postIndex = fetchText("blogs/index.json")
                .then((text) => JSON.parse(text))
                .then((posts) => posts.slice().sort((a, b) => (a.published < b.published ? 1 : -1)))
                .catch((error) => {
                    postIndex = null;
                    throw error;
                });
        }
        return postIndex;
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) {
            node.className = className;
        }
        if (text) {
            node.textContent = text;
        }
        return node;
    }

    function postMeta(post, withMinutes) {
        const meta = el("div", "post-meta");
        const time = el("time", "", post.published);
        time.dateTime = post.published;
        meta.append(time);
        if (post.category) {
            meta.append(el("span", "tag", post.category));
        }
        if (withMinutes && post.minutes) {
            meta.append(el("span", "", post.minutes + t("minRead")));
        }
        return meta;
    }

    function postItem(post) {
        const item = el("li", "post-item");
        const link = el("a", "post-link");
        link.href = "post.html?slug=" + encodeURIComponent(post.slug);

        const text = el("div", "post-text");
        text.append(postMeta(post, false), el("h3", "post-title", post.title));
        if (post.description) {
            text.append(el("p", "post-desc", post.description));
        }
        link.append(text);
        item.append(link);
        return item;
    }

    function renderList(list, posts) {
        list.replaceChildren(...posts.map(postItem));
        if (!posts.length) {
            list.append(el("li", "post-empty", t("empty")));
        }
    }

    async function hydratePostLists(root) {
        const lists = root.querySelectorAll("[data-post-list]");
        if (!lists.length) {
            return;
        }
        let posts;
        try {
            posts = await loadPostIndex();
        } catch (error) {
            lists.forEach((list) => list.replaceChildren(el("li", "post-empty", t("listFailed"))));
            return;
        }

        lists.forEach((list) => {
            const limit = Number(list.dataset.limit) || posts.length;
            const filter = list.parentElement.querySelector("[data-category-filter]");
            if (!filter) {
                renderList(list, posts.slice(0, limit));
                return;
            }

            const categories = [...new Set(posts.map((post) => post.category).filter(Boolean))];
            const select = (category) => {
                filter.querySelectorAll(".tag").forEach((button) => {
                    button.setAttribute("aria-pressed", String(button.dataset.category === category));
                });
                renderList(list, posts.filter((post) => !category || post.category === category).slice(0, limit));
            };
            filter.replaceChildren(...["", ...categories].map((category) => {
                const button = el("button", "tag", category || t("all"));
                button.type = "button";
                button.dataset.category = category;
                button.addEventListener("click", () => select(category));
                return button;
            }));
            select("");
        });
    }

    /* ---------- Markdown ---------- */

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function resolveUrl(href, base) {
        if (/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(href)) {
            return href;
        }
        return base + href;
    }

    function safeUrl(href) {
        return /^\s*(javascript|data|vbscript):/i.test(href) ? "#" : href;
    }

    function renderInline(text, base) {
        const stash = [];
        const keep = (html) => "\u0000" + (stash.push(html) - 1) + "\u0000";

        let out = text.replace(/`([^`]+)`/g, (m, code) => keep("<code>" + escapeHtml(code) + "</code>"));
        out = out.replace(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g, (m, alt, src) =>
            keep('<img src="' + escapeHtml(safeUrl(resolveUrl(src, base))) + '" alt="' + escapeHtml(alt) + '" loading="lazy" decoding="async">'));
        out = out.replace(/\[([^\]]+)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g, (m, label, href) => {
            const url = safeUrl(resolveUrl(href, base));
            const external = /^https?:/i.test(url);
            return keep('<a href="' + escapeHtml(url) + '"' +
                (external ? ' target="_blank" rel="noopener noreferrer"' : "") + ">") +
                label + keep("</a>");
        });
        out = out.replace(/<(https?:\/\/[^>\s]+)>/g, (m, url) =>
            keep('<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(url) + "</a>"));

        out = escapeHtml(out)
            .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, "<strong>$2</strong>")
            .replace(/\*(?=\S)([\s\S]*?\S)\*/g, "<em>$1</em>")
            .replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<del>$1</del>");

        while (out.includes("\u0000")) {
            out = out.replace(/\u0000(\d+)\u0000/g, (m, i) => stash[i]);
        }
        return out;
    }

    function splitRow(line) {
        return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
    }

    function renderMarkdown(source, base) {
        const lines = source.replace(/\r\n?/g, "\n").split("\n");
        const html = [];
        let i = 0;

        const isBlank = (line) => !line.trim();
        const standaloneImage = /^!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)$/;
        const listMatch = (line) => line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
        const startsBlock = (line) =>
            /^(#{1,6})\s/.test(line) || /^```/.test(line) || /^>/.test(line) ||
            /^(\*{3,}|-{3,}|_{3,})\s*$/.test(line) || Boolean(listMatch(line));

        function renderMdList(indent) {
            const first = listMatch(lines[i]);
            const ordered = /\d/.test(first[2]);
            const tag = ordered ? "ol" : "ul";
            const start = ordered ? parseInt(first[2], 10) : 1;
            const parts = ["<" + tag + (ordered && start !== 1 ? ' start="' + start + '"' : "") + ">"];

            while (i < lines.length) {
                const match = listMatch(lines[i]);
                if (!match || match[1].length !== indent || /\d/.test(match[2]) !== ordered) {
                    break;
                }
                let text = match[3];
                i += 1;
                let nested = "";
                while (i < lines.length && !isBlank(lines[i])) {
                    const inner = listMatch(lines[i]);
                    if (inner && inner[1].length > indent) {
                        nested += renderMdList(inner[1].length);
                    } else if (!inner && !startsBlock(lines[i].trim())) {
                        text += " " + lines[i].trim();
                        i += 1;
                    } else {
                        break;
                    }
                }
                if (i < lines.length && isBlank(lines[i])) {
                    const next = lines.slice(i).find((line) => !isBlank(line));
                    const nextMatch = next && listMatch(next);
                    if (nextMatch && nextMatch[1].length === indent && /\d/.test(nextMatch[2]) === ordered) {
                        while (isBlank(lines[i])) {
                            i += 1;
                        }
                    }
                }
                parts.push("<li>" + renderInline(text, base) + nested + "</li>");
            }
            parts.push("</" + tag + ">");
            return parts.join("");
        }

        while (i < lines.length) {
            const line = lines[i];

            if (isBlank(line)) {
                i += 1;
                continue;
            }

            const fence = line.match(/^```\s*([\w-]*)/);
            if (fence) {
                const code = [];
                i += 1;
                while (i < lines.length && !/^```/.test(lines[i])) {
                    code.push(lines[i]);
                    i += 1;
                }
                i += 1;
                html.push("<pre><code>" + escapeHtml(code.join("\n")) + "</code></pre>");
                continue;
            }

            const heading = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
            if (heading) {
                const level = Math.max(heading[1].length, 2);
                // 目录只收录原文的 ##，不包括降级后同为 h2 的一级标题。
                const tocMarker = heading[1].length === 2 ? " data-toc-heading" : "";
                html.push("<h" + level + tocMarker + ">" + renderInline(heading[2], base) + "</h" + level + ">");
                i += 1;
                continue;
            }

            if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) {
                html.push("<hr>");
                i += 1;
                continue;
            }

            if (/^>/.test(line)) {
                const quote = [];
                while (i < lines.length && /^>/.test(lines[i])) {
                    quote.push(lines[i].replace(/^>\s?/, ""));
                    i += 1;
                }
                html.push("<blockquote>" + renderMarkdown(quote.join("\n"), base) + "</blockquote>");
                continue;
            }

            const list = listMatch(line);
            if (list) {
                html.push(renderMdList(list[1].length));
                continue;
            }

            if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
                const head = splitRow(line);
                i += 2;
                const rows = [];
                while (i < lines.length && /^\s*\|/.test(lines[i])) {
                    rows.push(splitRow(lines[i]));
                    i += 1;
                }
                html.push(
                    "<table><thead><tr>" + head.map((cell) => "<th>" + renderInline(cell, base) + "</th>").join("") +
                    "</tr></thead><tbody>" +
                    rows.map((row) => "<tr>" + row.map((cell) => "<td>" + renderInline(cell, base) + "</td>").join("") + "</tr>").join("") +
                    "</tbody></table>"
                );
                continue;
            }

            const paragraph = [];
            while (i < lines.length && !isBlank(lines[i]) && !(paragraph.length && startsBlock(lines[i]))) {
                paragraph.push(lines[i].trim());
                i += 1;
            }
            const figure = paragraph.length === 1 && paragraph[0].match(standaloneImage);
            if (figure) {
                const caption = figure[1].trim();
                const src = escapeHtml(safeUrl(resolveUrl(figure[2], base)));
                // 遵循 ADR-0001：非空方括号文本渲染为可见 figcaption，对应 img 的 alt 置空以防屏幕阅读器重复朗读。
                html.push(
                    '<figure><img src="' + src + '" alt="" loading="lazy" decoding="async">' +
                    (caption ? "<figcaption>" + escapeHtml(caption) + "</figcaption>" : "") +
                    "</figure>"
                );
                continue;
            }
            html.push("<p>" + renderInline(paragraph.join(" "), base) + "</p>");
        }

        return html.join("\n");
    }

    function stripFrontMatter(source) {
        return source.replace(/^\ufeff?---\s*\n[\s\S]*?\n---\s*(\n|$)/, "");
    }

    /* ---------- Profile ---------- */

    async function hydrateProfile(root) {
        const target = root.querySelector("[data-profile]");
        if (!target) {
            return;
        }
        try {
            const source = await fetchText(PROFILE_FILE);
            target.innerHTML = renderMarkdown(stripFrontMatter(source), "blogs/");
        } catch (error) {
            /* Keep the text already on the page. */
        }
    }

    /* ---------- 文章目录 ---------- */

    let disposePostToc = null;

    function headingId(text) {
        const base = text.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
            .replace(/^-+|-+$/g, "") || "section";
        let id = base;
        for (let suffix = 2; document.getElementById(id); suffix += 1) {
            id = base + "-" + suffix;
        }
        return id;
    }

    function mountPostToc(toc, title, body, comments) {
        const toggle = toc.querySelector(".post-toc-toggle");
        const panel = toc.querySelector(".post-toc-panel");
        const map = toc.querySelector(".post-toc-map");
        const list = toc.querySelector(".post-toc-list");
        const commentLink = toc.querySelector(".post-toc-comments");

        function makeRow(target, text, href, labelTag = "span") {
            target.tabIndex = -1;
            const link = el("a", "post-toc-link");
            link.href = href;
            link.append(el(labelTag, "post-toc-label", text));
            const item = el("li");
            item.append(link);
            return { target, link, item };
        }

        const titleRow = makeRow(title, title.textContent, "#", "strong");
        const chapters = [...body.querySelectorAll(":scope > [data-toc-heading]")].map((target) => {
            const text = target.textContent.trim().replace(/\s+/g, " ") || target.querySelector("img")?.alt.trim() || t("postSection");
            target.id = headingId(text);
            return makeRow(target, text, "#" + encodeURIComponent(target.id));
        });
        const rows = [titleRow, ...chapters];
        list.replaceChildren(...rows.map(({ item }) => item));
        toc.hidden = false;

        const entries = [...rows, { target: comments, link: commentLink }];
        const desktop = window.matchMedia("(min-width: 1160px) and (hover: hover) and (pointer: fine)");
        const lifetime = new AbortController();
        const events = { signal: lifetime.signal };
        const isOpen = () => toggle.getAttribute("aria-expanded") === "true";
        const close = () => toggle.setAttribute("aria-expanded", "false");
        let offsets, stops, scrollMargin, maxScroll;
        let active = -1;
        let dirty = true;
        let frame = 0;

        function measure() {
            const y = window.scrollY;
            // 标题项代表页面顶部，后续条目对应正文里的锚点。
            offsets = entries.map(({ target }, i) => i === 0 ? 0 : target.getBoundingClientRect().top + y);
            scrollMargin = parseFloat(getComputedStyle(comments).scrollMarginTop);
            maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (desktop.matches) {
                // 按各章节的实际长度分配轨道，文字行仍保有最小间距。
                rows.forEach(({ item }, i) => item.style.setProperty("--toc-span", offsets[i + 1] - offsets[i]));
                const dot = parseFloat(getComputedStyle(list).getPropertyValue("--toc-marker-y"));
                stops = [...rows.map(({ item }) => item.offsetTop + dot), list.offsetHeight];
            }
        }

        function update() {
            frame = 0;
            if (dirty) {
                measure();
                dirty = false;
            }
            const y = Math.max(0, window.scrollY);
            const cursor = y + scrollMargin + 1;
            const reached = offsets.findLastIndex((offset) => offset <= cursor);
            const atEnd = y >= maxScroll - 1;
            let selected = reached;
            if (atEnd) {
                // 若目标离文末太近，无法滚到阅读基准线，仍选中该锚点。
                const fragment = fragmentTarget(window.location.hash);
                const anchored = entries.findIndex(({ target }, i) => target === fragment && offsets[i] > cursor);
                selected = anchored >= 0 ? anchored : y > 0 ? entries.length - 1 : reached;
            }
            if (selected !== active) {
                entries[active]?.link.removeAttribute("aria-current");
                entries[selected]?.link.setAttribute("aria-current", "location");
                active = selected;
            }

            if (desktop.matches) {
                const trackHeight = stops.at(-1);
                const next = reached + 1;
                let fill = trackHeight;
                if (next < offsets.length && !(atEnd && (y > 0 || active === entries.length - 1))) {
                    const start = offsets[reached];
                    const part = (cursor - start) / (offsets[next] - start);
                    fill = stops[reached] + part * (stops[next] - stops[reached]);
                }
                list.style.setProperty("--toc-progress", (trackHeight ? (100 * fill / trackHeight).toFixed(2) : "0") + "%");

                // 轨道过长时跟随当前圆点，但不抢走用户正在操作的目录。
                if (!toc.matches(":hover, :focus-within") && map.scrollHeight > map.clientHeight) {
                    const dot = stops[active];
                    map.scrollTop = Math.max(dot + 16 - map.clientHeight, Math.min(dot - 16, map.scrollTop));
                }
            }
        }

        function schedule() {
            if (!frame) {
                frame = requestAnimationFrame(update);
            }
        }

        function remeasure() {
            dirty = true;
            schedule();
        }

        const observer = new ResizeObserver(remeasure);
        observer.observe(toc.closest(".post-view"));
        window.addEventListener("scroll", schedule, { ...events, passive: true });
        window.addEventListener("resize", remeasure, events);
        window.addEventListener("popstate", schedule, events);
        desktop.addEventListener("change", () => {
            close();
            remeasure();
        }, events);

        toggle.addEventListener("click", () => toggle.setAttribute("aria-expanded", String(!isOpen())), events);
        panel.addEventListener("click", (event) => {
            const link = event.target.closest("a[href]");
            if (isPlainClick(event) && link) {
                close();
                if (link === titleRow.link) {
                    title.focus({ preventScroll: true });
                }
                schedule();
            }
        }, events);
        document.addEventListener("click", (event) => {
            if (isOpen() && !toc.contains(event.target)) {
                close();
            }
        }, events);
        toc.addEventListener("focusout", (event) => {
            if (event.relatedTarget && !toc.contains(event.relatedTarget)) {
                close();
            }
        }, events);
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && isOpen()) {
                close();
                toggle.focus({ preventScroll: true });
            }
        }, events);
        schedule();

        return () => {
            lifetime.abort();
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }

    /* ---------- 文章加载 ---------- */

    function mountPostComments(comments, slug) {
        const container = comments.querySelector("[data-giscus]");
        if (!container || container.querySelector("script")) {
            return;
        }

        const script = document.createElement("script");
        script.src = "https://giscus.app/client.js";
        script.crossOrigin = "anonymous";
        // giscus 会查找全页的 .giscus；按插入顺序执行，避免旧脚本覆盖新文章的评论。
        script.async = false;
        Object.assign(script.dataset, {
            repo: "Mistvillion/Mistvillion.github.io",
            repoId: "R_kgDORL2RGQ",
            category: "Announcements",
            categoryId: "DIC_kwDORL2RGc4DCuBS",
            mapping: "specific",
            term: slug,
            strict: "1",
            reactionsEnabled: "1",
            emitMetadata: "0",
            inputPosition: "bottom",
            // 选用 transparent_dark 透出页面基底色；排除 noborder_dark（实测为不透明 #1e1e20 灰底 + 荧光薄荷绿强调色）。
            theme: "transparent_dark",
            lang: "zh-CN",
            loading: "lazy"
        });
        script.addEventListener("error", () => {
            container.replaceChildren(el("p", "", t("commentsFailed")));
        }, { once: true });
        container.append(script);
    }

    async function hydratePost(root) {
        const target = root.querySelector("[data-post-content]");
        if (!target) {
            return;
        }
        const slug = new URLSearchParams(window.location.search).get("slug");
        const show = (...nodes) => target.replaceChildren(...nodes);

        let post;
        try {
            post = (await loadPostIndex()).find((entry) => entry.slug === slug);
        } catch (error) {
            show(el("p", "post-empty", t("postFailed")));
            return;
        }
        if (!post) {
            show(el("p", "post-empty", t("postMissing")));
            return;
        }

        const header = el("header", "post-header");
        const title = el("h1", "post-heading", post.title);
        header.append(title, postMeta(post, true));

        let body;
        try {
            const source = stripFrontMatter(await fetchText(post.path));
            const content = el("div", "post-body");
            content.innerHTML = renderMarkdown(source, post.path.replace(/[^/]*$/, ""));
            show(header, content);
            body = content;
        } catch (error) {
            show(header, el("p", "post-empty", t("postFailed")));
        }
        if (!target.isConnected) {
            return;
        }
        document.title = post.title + " - " + t("blogs.title");
        if (body) {
            const view = target.closest(".post-view");
            const comments = view.querySelector("#comments");
            comments.hidden = false;
            mountPostComments(comments, post.slug);
            disposePostToc = mountPostToc(view.querySelector("[data-post-toc]"), title, body, comments);
            restoreFragment();
        }
    }

    function hydrate(root) {
        applyTitle();
        fadeInBackground(root);
        hydrateProfile(root);
        const listsReady = hydratePostLists(root);
        hydratePost(root);
        return listsReady;
    }

    hydrate(document);

    /* ---------- 滚动时显隐导航 ---------- */

    const topNav = document.querySelector(".top-nav");
    const navScrollThreshold = 8;
    let navScrollAnchor = Math.max(0, window.scrollY);

    function resetNavScroll() {
        navScrollAnchor = 0;
        if (topNav) {
            topNav.classList.remove("is-scroll-hidden");
        }
    }

    if (topNav) {
        window.addEventListener("scroll", () => {
            // 限制在实际滚动范围内，避免触底回弹被当成上滑。
            const root = document.documentElement;
            const scrollY = Math.max(0, Math.min(window.scrollY, root.scrollHeight - root.clientHeight));
            if (scrollY === 0) {
                resetNavScroll();
                return;
            }

            const delta = scrollY - navScrollAnchor;
            const hidden = topNav.classList.contains("is-scroll-hidden");

            // 保留当前方向的极值，反向滚动累积到阈值才切换。
            if (hidden ? delta < 0 : delta > 0) {
                if (Math.abs(delta) < navScrollThreshold) {
                    return;
                }
                topNav.classList.toggle("is-scroll-hidden", !hidden);
            }
            navScrollAnchor = scrollY;
        }, { passive: true });
    }

    /* ---------- Prefetch and cache internal pages ---------- */

    const pageCache = new Map();

    function canonicalPath(pathname) {
        return pathname.endsWith("/") ? pathname + "index.html" : pathname;
    }

    function pageKey(url) {
        return canonicalPath(url.pathname) + url.search;
    }

    function isCurrentPath(url) {
        return pageKey(url) === pageKey(window.location);
    }

    function isInternalPage(url) {
        return url.origin === window.location.origin && url.pathname.endsWith(".html");
    }

    function loadPage(href) {
        const url = new URL(href, window.location.href);
        const key = canonicalPath(url.pathname);
        if (!pageCache.has(key)) {
            const promise = fetch(url.href, { credentials: "same-origin" })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("HTTP " + response.status);
                    }
                    return response.text();
                })
                .then((html) => new DOMParser().parseFromString(html, "text/html"))
                .catch((error) => {
                    pageCache.delete(key);
                    throw error;
                });
            pageCache.set(key, promise);
        }
        return pageCache.get(key);
    }

    /* ---------- DOM swap ---------- */

    /* Replace every top-level section of main; the nav stays in place. */
    function applyDocument(doc, url) {
        const currentMain = document.querySelector("main.page");
        const currentSections = currentMain ? currentMain.querySelectorAll(":scope > section") : [];
        const newMain = doc.querySelector("main.page");
        const newSections = newMain ? newMain.querySelectorAll(":scope > section") : [];

        if (!currentSections.length || !newSections.length) {
            throw new Error("unexpected page structure");
        }

        const freshSections = [...newSections].map((section) => document.importNode(section, true));

        /* A background already on screen skips the first-load fade, so it doesn't blink. */
        const shownBackgrounds = new Set(
            [...currentMain.querySelectorAll(".page-bg.is-loaded")].map((bg) => bg.currentSrc || bg.src)
        );
        freshSections.forEach((section) => {
            section.querySelectorAll(".page-bg").forEach((bg) => {
                if (shownBackgrounds.has(bg.src)) {
                    bg.classList.add("is-loaded");
                }
            });
        });

        if (disposePostToc) {
            disposePostToc();
            disposePostToc = null;
        }
        currentSections[0].before(...freshSections);
        currentSections.forEach((section) => section.remove());
        currentMain.setAttribute("aria-label", newMain.getAttribute("aria-label") || "");
        currentMain.dataset.title = newMain.dataset.title || "";
        document.title = doc.title;

        const targetPath = canonicalPath(new URL(url, window.location.href).pathname);
        document.querySelectorAll(".top-nav a[href]").forEach((link) => {
            const linkUrl = new URL(link.href);
            if (linkUrl.origin !== window.location.origin) {
                return;
            }
            if (canonicalPath(linkUrl.pathname) === targetPath) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        window.scrollTo(0, 0);
        resetNavScroll();
        const firstSection = freshSections[0];
        firstSection.tabIndex = -1;
        firstSection.focus({ preventScroll: true });
        return currentMain;
    }

    /* Fallback for browsers without View Transitions. */
    function fadeIn(main) {
        if (typeof main.animate !== "function") {
            return;
        }
        main.querySelectorAll(":scope > section").forEach((section) => {
            // 文章页只淡入，避免 transform 改变固定目录的定位基准。
            const keyframes = section.classList.contains("post-view")
                ? [{ opacity: 0 }, { opacity: 1 }]
                : [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }];
            section.animate(keyframes, { duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
        });
    }

    /* ---------- Navigation ---------- */

    const ARTWORK_SELECTOR = ".home, .page-banner";
    const VT_CLASSES = ["vt-shared-backdrop", "vt-to-banner", "vt-to-cover"];
    let navigating = false;
    let renderedPageKey = pageKey(window.location);
    let vtToken = 0;

    function clearBackdropTransitionClasses() {
        document.documentElement.classList.remove(...VT_CLASSES);
    }

    function getSharedBackdropDirection(doc) {
        const currentMain = document.querySelector("main.page");
        const currentArtwork = currentMain && currentMain.querySelector(ARTWORK_SELECTOR);
        const nextArtwork = doc.querySelector("main.page " + ARTWORK_SELECTOR);
        if (!currentArtwork || !nextArtwork || window.scrollY >= window.innerHeight * 0.5) {
            return null;
        }
        const rect = currentArtwork.getBoundingClientRect();
        if (!(rect.height > 0 && rect.bottom > rect.height * 0.5)) {
            return null;
        }
        return nextArtwork.classList.contains("page-banner") ? "vt-to-banner" : "vt-to-cover";
    }

    function fragmentTarget(hash) {
        try {
            return hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
        } catch (error) {
            return null;
        }
    }

    function restoreFragment() {
        fragmentTarget(window.location.hash)?.scrollIntoView();
    }

    async function navigateTo(url, updateHistory) {
        if (navigating) {
            return;
        }
        navigating = true;

        let doc;
        let listsReady = Promise.resolve();
        const swap = () => {
            if (updateHistory) {
                history.pushState(null, "", url);
            }
            const main = applyDocument(doc, url);
            renderedPageKey = pageKey(window.location);
            listsReady = hydrate(main);
            return main;
        };

        const swapForTransition = async () => {
            swap();
            await Promise.race([
                listsReady,
                new Promise((resolve) => setTimeout(resolve, 120))
            ]);
        };

        try {
            doc = await loadPage(url);
            if (prefersReducedMotion.matches) {
                vtToken += 1;
                clearBackdropTransitionClasses();
                swap();
            } else if (typeof document.startViewTransition === "function") {
                const direction = getSharedBackdropDirection(doc);
                if (direction) {
                    const token = ++vtToken;
                    clearBackdropTransitionClasses();
                    document.documentElement.classList.add("vt-shared-backdrop", direction);
                    const clearShared = () => {
                        if (vtToken === token) {
                            clearBackdropTransitionClasses();
                        }
                    };
                    const transition = document.startViewTransition(swapForTransition);
                    transition.finished.then(clearShared, clearShared);
                    await transition.updateCallbackDone;
                } else {
                    vtToken += 1;
                    clearBackdropTransitionClasses();
                    const transition = document.startViewTransition(swapForTransition);
                    transition.finished.catch(() => {});
                    await transition.updateCallbackDone;
                }
            } else {
                fadeIn(swap());
            }
        } catch (error) {
            clearBackdropTransitionClasses();
            window.location.href = url;
        } finally {
            navigating = false;
        }
    }

    /* ---------- Click handling ---------- */

    function isPlainClick(event) {
        return !event.defaultPrevented && event.button === 0 &&
            !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    }

    document.addEventListener("click", (event) => {
        if (!isPlainClick(event)) {
            return;
        }

        const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (!link || link.target) {
            return;
        }

        const destination = new URL(link.href);
        if (!isInternalPage(destination)) {
            return;
        }

        if (!isCurrentPath(destination)) {
            event.preventDefault();
            navigateTo(destination.href, true);
            return;
        }

        const target = fragmentTarget(destination.hash);
        if (destination.hash && !target) {
            return;
        }
        event.preventDefault();
        if (destination.hash !== window.location.hash) {
            history.pushState(null, "", destination.href);
        }
        if (target) {
            target.focus({ preventScroll: true });
            // 直接定位，让浏览器在懒加载图片改变高度时保持锚点可见。
            target.scrollIntoView();
        } else {
            window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
        }
    });

    /* ---------- Scroll hint: jump to the section below the first screen ---------- */

    document.addEventListener("click", (event) => {
        const hint = event.target.closest(".scroll-hint");
        const next = hint && hint.closest("section").nextElementSibling;
        if (next) {
            next.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
        }
    });

    /* ---------- Back and forward ---------- */

    window.addEventListener("popstate", () => {
        if (navigating) {
            window.location.reload();
            return;
        }
        // 同一篇文章的锚点历史不触发页面切换或重复加载正文。
        if (pageKey(window.location) === renderedPageKey) {
            if (window.location.hash) {
                restoreFragment();
            } else {
                window.scrollTo(0, 0);
            }
            return;
        }
        navigateTo(window.location.href, false);
    });

    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }

    /* ---------- Warm the other pages once the browser is idle ---------- */

    function warmInternalPages() {
        document.querySelectorAll(".top-nav a[href]").forEach((link) => {
            const url = new URL(link.href);
            if (isInternalPage(url) && !isCurrentPath(url)) {
                loadPage(url.href).catch(() => {});
            }
        });
        loadPage("post.html").catch(() => {});
        loadPostIndex().catch(() => {});
        fetchText(PROFILE_FILE).catch(() => {});
    }

    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(warmInternalPages, { timeout: 1200 });
    } else {
        setTimeout(warmInternalPages, 400);
    }
})();
