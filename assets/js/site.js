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

    /* Hero and navigation are English; everything below the fold is Chinese. */
    const TEXT = {
        "blogs.title": "Mistvillion's Blogs",
        "all": "全部",
        "minRead": " 分钟阅读",
        "empty": "暂无文章。",
        "listFailed": "文章列表加载失败。",
        "postFailed": "文章加载失败。",
        "postMissing": "文章不存在。"
    };

    const PROFILE_FILE = "blogs/profile.md";

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
                html.push("<h" + level + ">" + renderInline(heading[2], base) + "</h" + level + ">");
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

    /* ---------- Single post ---------- */

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
        header.append(el("h1", "section-title", post.title), postMeta(post, true));

        try {
            const source = stripFrontMatter(await fetchText(post.path));
            const body = el("div", "post-body");
            body.innerHTML = renderMarkdown(source, post.path.replace(/[^/]*$/, ""));
            show(header, body);
        } catch (error) {
            show(header, el("p", "post-empty", t("postFailed")));
        }
        document.title = post.title + " - " + t("blogs.title");
    }

    function hydrate(root) {
        applyTitle();
        fadeInBackground(root);
        hydrateProfile(root);
        hydratePostLists(root);
        hydratePost(root);
    }

    hydrate(document);

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
            section.animate(
                [
                    { opacity: 0, transform: "translateY(6px)" },
                    { opacity: 1, transform: "none" }
                ],
                { duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
            );
        });
    }

    /* ---------- Navigation ---------- */

    let navigating = false;

    async function navigateTo(url, updateHistory) {
        if (navigating) {
            return;
        }
        navigating = true;

        let doc;
        const swap = () => {
            if (updateHistory) {
                history.pushState(null, "", url);
            }
            const main = applyDocument(doc, url);
            hydrate(main);
            return main;
        };

        try {
            doc = await loadPage(url);
            if (prefersReducedMotion.matches) {
                swap();
            } else if (typeof document.startViewTransition === "function") {
                await document.startViewTransition(swap).updateCallbackDone;
            } else {
                fadeIn(swap());
            }
        } catch (error) {
            window.location.href = url;
        } finally {
            navigating = false;
        }
    }

    /* ---------- Click handling ---------- */

    document.addEventListener("click", (event) => {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
        ) {
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

        event.preventDefault();
        if (!isCurrentPath(destination)) {
            navigateTo(destination.href, true);
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
