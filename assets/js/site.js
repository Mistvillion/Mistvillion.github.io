/* 北城烟雨阁 —— 页面切换逻辑
   进入：背景图就绪后整页模糊淡入（3s 兜底）
   离开：全屏遮罩淡出（520ms，与 CSS 一致）→ 跳转
   预取：导航站内链接 hover/focus 时 rel=prefetch */

const root = document.documentElement;
const pageBg = document.querySelector(".page-bg");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// 进入动画只等背景图：字体是小体积子集 + font-display: swap，不阻塞首屏。
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

// 浏览器往返缓存（bfcache）恢复时清除离开态
window.addEventListener("pageshow", () => {
    root.classList.remove("page-leaving");
});

/* ---------- 预取站内页面 ---------- */

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

/* ---------- 站内切换：淡出 → 跳转 ---------- */

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
