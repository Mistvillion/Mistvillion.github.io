const root = document.documentElement;
const backgroundVideo = document.querySelector(".background-video");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Reveal is gated on the background only: the webfont is a small subset
// loaded with font-display: swap, so the page must not wait for it.
const videoReady = new Promise((resolve) => {
    if (!backgroundVideo || backgroundVideo.readyState >= 2) {
        resolve();
        return;
    }

    backgroundVideo.addEventListener("loadeddata", resolve, { once: true });
    backgroundVideo.addEventListener("error", resolve, { once: true });
});

Promise.race([
    videoReady,
    new Promise((resolve) => setTimeout(resolve, 3000))
]).then(() => {
    requestAnimationFrame(() => {
        root.classList.add("page-ready");
    });
});

window.addEventListener("pageshow", () => {
    root.classList.remove("page-leaving");
});

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
