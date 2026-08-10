/* Mistvillion's Home —— page transition logic
   Enter:  whole page blur-fades in once the background is ready (3s fallback)
   Switch: prefetch (fetch + parse + cache) + DOM swap + View Transitions.
           Internal .html links never trigger a full navigation, so the
           background image and fonts are loaded exactly once per visit.
   Fallback: no View Transitions / prefers-reduced-motion -> instant swap;
             fetch failure -> normal full-page navigation. */

const root = document.documentElement;
const pageBg = document.querySelector(".page-bg");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- Entrance animation (initial load only) ---------- */

const backgroundReady = new Promise((resolve) => {
    if (!pageBg || pageBg.readyState >= 2) {
        resolve();
        return;
    }
    pageBg.addEventListener("loadeddata", resolve, { once: true });
    pageBg.addEventListener("error", resolve, { once: true });
});

Promise.race([
    backgroundReady,
    new Promise((resolve) => setTimeout(resolve, 3000)),
]).then(() => {
    requestAnimationFrame(() => {
        root.classList.add("page-ready");
    });
});

/* ---------- Prefetch: fetch, parse and cache internal pages ---------- */

const pageCache = new Map(); // key (origin + canonical path) -> Promise<Document>

function canonicalPath(pathname) {
    return pathname.endsWith("/") ? pathname + "index.html" : pathname;
}

function cacheKey(href) {
    const url = new URL(href, window.location.href);
    return url.origin + canonicalPath(url.pathname);
}

function warmPage(href) {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin || !url.pathname.endsWith(".html")) {
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

/* ---------- DOM swap (the page-specific region only) ---------- */

function applyDocument(doc, url) {
    const currentMain = document.querySelector("main.page");
    const currentSection = currentMain.querySelector(":scope > section");
    const newMain = doc.querySelector("main.page");
    const newSection = newMain.querySelector(":scope > section");

    const freshSection = newSection.cloneNode(true);
    currentSection.replaceWith(freshSection);

    currentMain.className = newMain.className;
    currentMain.setAttribute("aria-label", newMain.getAttribute("aria-label") || "");
    document.title = doc.title;

    // Nav: move aria-current to the page we just switched to
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

    // Announce the page change to assistive tech (no visible ring, see CSS)
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
        if (!doc.querySelector("main.page > section")) {
            throw new Error("unexpected page structure");
        }
    } catch (error) {
        navigating = false;
        window.location.href = url; // fallback: normal full-page navigation
        return;
    }

    const apply = () => {
        applyDocument(doc, url);
        if (updateHistory) {
            history.pushState(null, "", url);
        }
    };

    let transition = null;
    if (!prefersReducedMotion.matches && document.startViewTransition) {
        try {
            transition = document.startViewTransition(apply);
        } catch (error) {
            transition = null;
        }
    }
    if (!transition) {
        apply();
        navigating = false;
        return;
    }

    transition.finished
        .catch(() => {})
        .finally(() => {
            navigating = false;
        });
}

/* ---------- Click: intercept internal .html links ---------- */

document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) {
        return;
    }
    const target = event.target;
    const link = target && target.closest ? target.closest("a[href]") : null;
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
        return; // a swap is already in flight; ignore the extra click
    }
    navigateTo(destination.href, true);
});

/* ---------- Back/forward: swap back without a full navigation ---------- */

window.addEventListener("popstate", () => {
    const url = window.location.href;
    if (navigating) {
        window.location.href = url; // rare race: fall back to a full load
        return;
    }
    navigateTo(url, false);
});

/* ---------- Warm the other page on hover/focus/touch ---------- */

document.querySelectorAll(".top-nav a[href]").forEach((link) => {
    if (link.getAttribute("aria-current") === "page") {
        return;
    }
    link.addEventListener("mouseenter", () => warmPage(link.href), { once: true });
    link.addEventListener("focus", () => warmPage(link.href), { once: true });
    link.addEventListener("pointerdown", () => warmPage(link.href), { once: true });
});
