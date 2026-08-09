/* Mistvillion's Home —— page transition logic
   Enter: whole page blur-fades in once the background is ready (3s fallback)
   Leave: full-screen veil (520ms, matches CSS) -> navigate
   Prefetch: nav internal links prefetch on hover/focus */

const root = document.documentElement;
const pageBg = document.querySelector(".page-bg");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Entrance animation waits only for the background image: fonts load with
// font-display: swap, so they never block first paint.
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

// Clear the leaving state when the page is restored from the bfcache
window.addEventListener("pageshow", () => {
    root.classList.remove("page-leaving");
});

/* ---------- Prefetch internal pages ---------- */

function prefetchPage(href) {
    if (!href || !href.endsWith(".html")) {
        return;
    }
    const destination = new URL(href, window.location.href);
    if (destination.origin !== window.location.origin) {
        return;
    }
    if (document.querySelector(`link[rel="prefetch"][href="${destination.href}"]`)) {
        return;
    }
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = destination.href;
    document.head.appendChild(link);
}

document.querySelectorAll(".top-nav a[href]").forEach((link) => {
    if (link.getAttribute("aria-current") === "page") {
        return;
    }
    link.addEventListener("mouseenter", () => prefetchPage(link.href), { once: true });
    link.addEventListener("focus", () => prefetchPage(link.href), { once: true });
});

/* ---------- Internal transition: fade out -> navigate ---------- */

document.addEventListener("click", (event) => {
    const clickTarget = event.target instanceof Element
        ? event.target
        : event.target?.parentElement;
    const link = clickTarget?.closest("a[href]");

    if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        root.classList.contains("page-leaving") ||
        link.target ||
        link.getAttribute("aria-current") === "page" ||
        prefersReducedMotion.matches
    ) {
        return;
    }

    const destination = new URL(link.href, window.location.href);
    const isSameOrigin = destination.origin === window.location.origin;
    const isHtmlPage = destination.pathname.endsWith(".html");
    const isCurrentPage =
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search &&
        destination.hash === window.location.hash;

    if (!isSameOrigin || !isHtmlPage || isCurrentPage) {
        return;
    }

    event.preventDefault();
    root.classList.add("page-leaving");

    window.setTimeout(() => {
        window.location.href = destination.href;
    }, 520);
});
