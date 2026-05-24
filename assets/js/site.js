const root = document.documentElement;
const backgroundVideo = document.querySelector(".background-video");

const fontReady = document.fonts
    ? document.fonts.load('500 1em "LXGW WenKai"', "北城烟雨阁")
    : Promise.resolve();
const safeFontReady = fontReady.catch(() => undefined);

const videoReady = new Promise((resolve) => {
    if (!backgroundVideo || backgroundVideo.readyState >= 2) {
        resolve();
        return;
    }

    backgroundVideo.addEventListener("loadeddata", resolve, { once: true });
    backgroundVideo.addEventListener("error", resolve, { once: true });
});

Promise.race([
    Promise.all([safeFontReady, videoReady]),
    new Promise((resolve) => setTimeout(resolve, 4000))
]).then(() => {
    root.classList.add("page-ready");
});
