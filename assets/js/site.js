/* Mistvillion's Home - page logic
   First load: content shows at once; the background fades in when loaded.
   Internal links: prefetch + DOM swap inside a View Transition.
   Failure: full-page navigation. */

(function () {
    "use strict";

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    /* ---------- Background fade-in ---------- */

    const pageBg = document.querySelector(".page-bg");
    if (pageBg) {
        const markLoaded = () => pageBg.classList.add("is-loaded");
        if (pageBg.complete) {
            markLoaded();
        } else {
            pageBg.addEventListener("load", markLoaded, { once: true });
            pageBg.addEventListener("error", markLoaded, { once: true });
        }
    }

    /* ---------- Prefetch and cache internal pages ---------- */

    const pageCache = new Map();

    function canonicalPath(pathname) {
        return pathname.endsWith("/") ? pathname + "index.html" : pathname;
    }

    function isCurrentPath(url) {
        return canonicalPath(url.pathname) === canonicalPath(window.location.pathname);
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

    function applyDocument(doc, url) {
        const currentMain = document.querySelector("main.page");
        const currentSection = currentMain && currentMain.querySelector(":scope > section");
        const newMain = doc.querySelector("main.page");
        const newSection = newMain && newMain.querySelector(":scope > section");

        if (!currentSection || !newSection) {
            throw new Error("unexpected page structure");
        }

        const freshSection = document.importNode(newSection, true);
        currentSection.replaceWith(freshSection);
        currentMain.setAttribute("aria-label", newMain.getAttribute("aria-label") || "");
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
        freshSection.tabIndex = -1;
        freshSection.focus({ preventScroll: true });
        return freshSection;
    }

    /* Fallback for browsers without View Transitions. */
    function fadeIn(section) {
        if (typeof section.animate !== "function") {
            return;
        }
        section.animate(
            [
                { opacity: 0, transform: "translateY(6px)" },
                { opacity: 1, transform: "none" }
            ],
            { duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
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
            const section = applyDocument(doc, url);
            if (updateHistory) {
                history.pushState(null, "", url);
            }
            return section;
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
    }

    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(warmInternalPages, { timeout: 1200 });
    } else {
        setTimeout(warmInternalPages, 400);
    }
})();
