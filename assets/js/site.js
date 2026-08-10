/* Mistvillion's Home - page logic
   First load: reveal once the background is ready (2.5s fallback).
   Internal links: prefetch + synchronous DOM swap.
   Failure: full-page navigation. */

(function () {
    "use strict";

    const root = document.documentElement;
    const pageBg = document.querySelector(".page-bg");

    /* ---------- First-load reveal ---------- */

    const backgroundReady = new Promise((resolve) => {
        if (!pageBg || pageBg.complete) {
            resolve();
            return;
        }
        pageBg.addEventListener("load", resolve, { once: true });
        pageBg.addEventListener("error", resolve, { once: true });
    });

    const revealFallback = new Promise((resolve) => setTimeout(resolve, 2500));
    Promise.race([backgroundReady, revealFallback]).then(() => {
        requestAnimationFrame(() => root.classList.add("page-ready"));
    });

    /* ---------- Prefetch and cache internal pages ---------- */

    const pageCache = new Map();

    function canonicalPath(pathname) {
        return pathname.endsWith("/") ? pathname + "index.html" : pathname;
    }

    function cacheKey(href) {
        const url = new URL(href, window.location.href);
        return url.origin + canonicalPath(url.pathname);
    }

    function warmPage(href) {
        const url = new URL(href, window.location.href);
        if (
            url.origin !== window.location.origin ||
            !url.pathname.endsWith(".html") ||
            canonicalPath(url.pathname) === canonicalPath(window.location.pathname)
        ) {
            return;
        }

        const key = cacheKey(href);
        if (pageCache.has(key)) {
            return;
        }

        const promise = fetch(href, { credentials: "same-origin" })
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

    function loadPage(href) {
        const key = cacheKey(href);
        if (!pageCache.has(key)) {
            warmPage(href);
        }
        return pageCache.get(key);
    }

    /* ---------- DOM swap ---------- */

    function applyDocument(doc, url) {
        const currentMain = document.querySelector("main.page");
        const currentSection = currentMain && currentMain.querySelector(":scope > section");
        const newMain = doc && doc.querySelector("main.page");
        const newSection = newMain && newMain.querySelector(":scope > section");

        if (!currentMain || !currentSection || !newMain || !newSection) {
            throw new Error("unexpected page structure");
        }

        const freshSection = newSection.cloneNode(true);
        currentSection.replaceWith(freshSection);
        currentMain.className = newMain.className;
        currentMain.setAttribute("aria-label", newMain.getAttribute("aria-label") || "");
        document.title = doc.title;

        const targetPath = canonicalPath(new URL(url, window.location.href).pathname);
        document.querySelectorAll(".top-nav a[href]").forEach((link) => {
            const linkUrl = new URL(link.href, window.location.href);
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
        freshSection.tabIndex = -1;
        freshSection.focus({ preventScroll: true });
    }

    /* ---------- Navigation ---------- */

    let navigating = false;

    async function navigateTo(url, updateHistory) {
        if (navigating) {
            return;
        }
        navigating = true;

        let doc;
        try {
            doc = await loadPage(url);
            if (!doc || !doc.querySelector("main.page > section")) {
                throw new Error("unexpected page structure");
            }
        } catch (error) {
            navigating = false;
            window.location.href = url;
            return;
        }

        applyDocument(doc, url);
        if (updateHistory) {
            history.pushState(null, "", url);
        }

        navigating = false;
    }

    /* ---------- Click handling ---------- */

    document.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0) {
            return;
        }

        const node = event.target instanceof Element ? event.target : null;
        const link = node && node.closest ? node.closest("a[href]") : null;
        if (!link || link.target || link.getAttribute("aria-current") === "page") {
            return;
        }
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        const destination = new URL(link.href, window.location.href);
        const isInternalHtml =
            destination.origin === window.location.origin &&
            destination.pathname.endsWith(".html");
        const isCurrentPage =
            canonicalPath(destination.pathname) === canonicalPath(window.location.pathname) &&
            destination.search === window.location.search &&
            destination.hash === window.location.hash;

        if (!isInternalHtml || isCurrentPage) {
            return;
        }

        event.preventDefault();
        if (navigating) {
            return;
        }
        navigateTo(destination.href, true);
    });

    /* ---------- Back and forward ---------- */

    window.addEventListener("popstate", () => {
        const url = window.location.href;
        if (navigating) {
            window.location.href = url;
            return;
        }
        navigateTo(url, false);
    });

    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }

    /* ---------- Warm the other page as early as possible ---------- */

    function warmInternalPages() {
        document.querySelectorAll(".top-nav a[href]").forEach((link) => {
            warmPage(link.href);
        });
    }

    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(warmInternalPages, { timeout: 1200 });
    } else {
        setTimeout(warmInternalPages, 400);
    }

    document.querySelectorAll(".top-nav a[href]").forEach((link) => {
        if (link.getAttribute("aria-current") === "page") {
            return;
        }
        link.addEventListener("mouseenter", () => warmPage(link.href), { once: true });
        link.addEventListener("focus", () => warmPage(link.href), { once: true });
        link.addEventListener("pointerdown", () => warmPage(link.href), { once: true });
    });
})();
