// Zero-dependency static guardrail checks for Mistvillion's Home.
// Usage: node scripts/check-site.mjs

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const failures = [];
let passed = 0;

function check(name, ok, detail = "") {
    if (ok) {
        passed += 1;
        console.log(`PASS  ${name}`);
    } else {
        failures.push({ name, detail });
        console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
    }
}

function readText(relPath) {
    return readFileSync(join(root, relPath), "utf8");
}

// 1. JS syntax checks
for (const file of ["assets/js/site.js", "scripts/build-blog-index.mjs", "scripts/check-site.mjs"]) {
    try {
        execFileSync(process.execPath, ["--check", join(root, file)], { stdio: "pipe" });
        check(`JS syntax: ${file}`, true);
    } catch (error) {
        check(`JS syntax: ${file}`, false, error.stderr?.toString().trim() || error.message);
    }
}

// 2. blogs/index.json freshness & referenced post images
function parseFrontMatter(source) {
    const match = source.match(/^\ufeff?---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
    const data = {};
    if (!match) {
        return { data, body: source };
    }
    for (const line of match[1].split("\n")) {
        const field = line.match(/^(\w+)\s*:\s*(.*?)\s*$/);
        if (field) {
            data[field[1]] = field[2].replace(/^(["'])(.*)\1$/, "$2");
        }
    }
    return { data, body: source.slice(match[0].length) };
}

function readingMinutes(body) {
    const text = body.replace(/```[\s\S]*?```/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "");
    const cjk = (text.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
    const words = (text.match(/[A-Za-z0-9]+/g) || []).length;
    return Math.max(1, Math.round(cjk / 400 + words / 200));
}

const blogsDir = join(root, "blogs");
const expectedPosts = [];
const missingPostImages = [];

for (const slug of readdirSync(blogsDir)) {
    const dir = join(blogsDir, slug);
    if (!statSync(dir).isDirectory()) {
        continue;
    }
    const mdFile = join(dir, "index.md");
    if (!existsSync(mdFile)) {
        continue;
    }
    const source = readFileSync(mdFile, "utf8");
    const { data, body } = parseFrontMatter(source);
    expectedPosts.push({
        slug,
        published: data.published || "",
        path: `blogs/${slug}/index.md`,
        title: data.title || slug,
        description: data.description || "",
        category: data.category || "",
        minutes: readingMinutes(body)
    });

    for (const m of body.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
        const raw = m[1];
        if (/^([a-z][a-z0-9+.-]*:|\/)/i.test(raw)) {
            continue;
        }
        const decoded = decodeURIComponent(raw);
        if (!existsSync(join(dir, decoded))) {
            missingPostImages.push(`blogs/${slug}/${decoded}`);
        }
    }
}

expectedPosts.sort((a, b) => b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug));
const actualIndexRaw = readText("blogs/index.json");
const expectedIndexRaw = JSON.stringify(expectedPosts, null, 2) + "\n";
check(
    "blogs/index.json synced with blogs/*/index.md",
    actualIndexRaw === expectedIndexRaw,
    "Run `node scripts/build-blog-index.mjs` to update blogs/index.json"
);
check("blogs/about.md exists", existsSync(join(root, "blogs/about.md")));
check(
    "All local Markdown post images exist on disk",
    missingPostImages.length === 0,
    missingPostImages.join(", ")
);

// 3. HTML structural, landmark, and local asset invariants
const entryPages = ["index.html", "blogs.html", "post.html"];
const expectedViewport = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';

for (const page of entryPages) {
    const html = readText(page);
    check(`${page}: viewport meta unchanged`, html.includes(expectedViewport));

    const mainClose = html.indexOf("</main>");
    const footerMatches = [...html.matchAll(/<footer\s+class="site-footer">/g)];
    check(
        `${page}: single Site Footer placed after </main>`,
        mainClose > 0 && footerMatches.length === 1 && footerMatches[0].index > mainClose,
        "<footer> must sit directly under <body> after </main> to preserve contentinfo landmark"
    );

    const missingAssets = [];
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        const ref = m[1];
        if (/^(https?:|mailto:|#)/i.test(ref)) {
            continue;
        }
        const cleanRef = ref.split(/[?#]/)[0];
        if (cleanRef && !existsSync(resolve(root, cleanRef))) {
            missingAssets.push(cleanRef);
        }
    }
    check(`${page}: all local asset links resolve`, missingAssets.length === 0, missingAssets.join(", "));
}

const indexHtml = readText("index.html");
check("index.html: has Cover (.home) and .scroll-hint", indexHtml.includes('class="home"') && indexHtml.includes('class="scroll-hint"'));

const blogsHtml = readText("blogs.html");
check(
    "blogs.html: uses Page Banner with sole H1 and no Cover/scroll-hint",
    blogsHtml.includes('class="page-banner"') &&
        blogsHtml.includes('<h1 class="page-banner-title" id="blogs-title">Blogs</h1>') &&
        !blogsHtml.includes('class="home"') &&
        !blogsHtml.includes('class="scroll-hint"')
);

// 4. CSS mechanical invariants
const css = readText("assets/css/site.css");
const forbiddenCss = [
    { label: "--pink", pattern: /--pink\b/ },
    { label: "#f7a8c4", pattern: /#f7a8c4\b/i },
    { label: "rgba(247, 168, 196", pattern: /247\s*,\s*168\s*,\s*196/ },
    { label: "#f4f7fb", pattern: /#f4f7fb\b/i },
    { label: "rgba(244, 247, 251", pattern: /244\s*,\s*247\s*,\s*251/ },
    { label: "hardcoded #000", pattern: /#000(?:000)?(?![0-9a-f])/i }
];
const cssViolations = forbiddenCss.filter(({ pattern }) => pattern.test(css)).map(({ label }) => label);
check("site.css: no legacy tokens or hardcoded #000", cssViolations.length === 0, cssViolations.join(", "));

const fontFaces = [...css.matchAll(/@font-face\s*\{[\s\S]*?\}/g)].map((m) => m[0]);
check(
    "site.css: both PT Serif @font-face rules declare CJK-excluding unicode-range",
    fontFaces.length === 2 && fontFaces.every((block) => /unicode-range:\s*U\+0000-00B6\b/i.test(block))
);

const profilePRule = css.match(/\.profile-content\s+p\s*\{[\s\S]*?\}/)?.[0] || "";
check(
    "site.css: .profile-content p omits max-width: 62ch (preserves centered column)",
    profilePRule.length > 0 && !/max-width\s*:/i.test(profilePRule)
);

check(
    "site.css: prefers-reduced-motion suppresses View Transitions",
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*::view-transition-group\(\*\)/.test(css)
);

// 5. JS mechanical invariants (ADR-0001, lazy loading, Giscus theme)
const js = readText("assets/js/site.js");
check(
    "site.js: standalone <figure> image sets alt=\"\", loading=\"lazy\", decoding=\"async\" (ADR-0001)",
    js.includes("'<figure><img src=\"' + src + '\" alt=\"\" loading=\"lazy\" decoding=\"async\">'")
);
check(
    "site.js: inline <img> preserves loading=\"lazy\" decoding=\"async\"",
    js.includes('loading="lazy" decoding="async">')
);
check(
    "site.js: Giscus theme avoids dark / noborder_dark",
    /theme:\s*"transparent_dark"/.test(js) && !/theme:\s*"(?:dark|noborder_dark)"/.test(js)
);

console.log(`\nSummary: ${passed} passed, ${failures.length} failed.`);
if (failures.length > 0) {
    process.exit(1);
}
