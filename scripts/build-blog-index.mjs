// Rebuild blogs/index.json from the posts in blogs/.
// Each post is a folder whose name is its unique slug, holding index.md
// (images sit next to it). Front matter: title, published, description, category.
// Loose files in blogs/ (profile.md, ...) are not posts.
// Usage: node scripts/build-blog-index.mjs

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const blogsDir = join(root, "blogs");

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

    const file = join(blogsDir, slug, "index.md");
    if (!existsSync(file)) {
        continue;
    }
    const { data, body } = parseFrontMatter(readFileSync(file, "utf8"));
    posts.push({
        slug,
        published: data.published || "",
        path: `blogs/${slug}/index.md`,
        title: data.title || slug,
        description: data.description || "",
        category: data.category || "",
        minutes: readingMinutes(body)
    });
}

posts.sort((a, b) => b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug));
writeFileSync(join(blogsDir, "index.json"), JSON.stringify(posts, null, 2) + "\n");
console.log(`blogs/index.json: ${posts.length} posts`);
