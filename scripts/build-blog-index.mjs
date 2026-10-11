// Rebuild blogs/index.json from the posts in blogs/.
// Each post is a folder whose name is its unique slug, holding zh-CN.md and/or en.md
// (images sit next to them). Front matter: title, published, description, category.
// Loose files in blogs/ (profile-en.md, profile-zh.md, ...) are not posts.
// Usage: node scripts/build-blog-index.mjs

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const blogsDir = join(root, "blogs");
const languages = ["en", "zh-CN"];

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

// Chinese reads at ~400 characters per minute, English at ~200 words.
function readingMinutes(body) {
    const text = body.replace(/```[\s\S]*?```/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "");
    const cjk = (text.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
    const words = (text.match(/[A-Za-z0-9]+/g) || []).length;
    return Math.max(1, Math.round(cjk / 400 + words / 200));
}

const posts = [];
for (const slug of readdirSync(blogsDir)) {
    if (!statSync(join(blogsDir, slug)).isDirectory()) {
        continue;
    }

    const post = { slug, published: "" };
    for (const lang of languages) {
        const file = join(blogsDir, slug, lang + ".md");
        if (!existsSync(file)) {
            continue;
        }
        const { data, body } = parseFrontMatter(readFileSync(file, "utf8"));
        post.published = post.published || data.published || "";
        post[lang] = {
            path: `blogs/${slug}/${lang}.md`,
            title: data.title || slug,
            description: data.description || "",
            category: data.category || "",
            minutes: readingMinutes(body)
        };
    }
    if (languages.some((lang) => post[lang])) {
        posts.push(post);
    }
}

posts.sort((a, b) => b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug));
writeFileSync(join(blogsDir, "index.json"), JSON.stringify(posts, null, 2) + "\n");
console.log(`blogs/index.json: ${posts.length} posts`);
