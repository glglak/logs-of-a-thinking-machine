/* scripts/ai-brief.mjs */
import fs from "node:fs/promises";
import path from "node:path";

const OUT_DIR = "src/data/blog";
const MAX_ITEMS = 3;
const TAGS = ["AI", "digest"];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function nowParts() {
  const d = new Date();
  const iso = d.toISOString();
  const ymd = iso.slice(0, 10);
  const hhmmss = iso.slice(11, 19).replace(/:/g, "");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  const rand = Math.random().toString(36).slice(2, 6);
  return { d, iso, ymd, hhmmss, ms, rand };
}

function absUrl(candidate, base) {
  try {
    if (!candidate) return "";
    if (candidate.startsWith("//")) return "https:" + candidate;
    return new URL(candidate, base).href;
  } catch {
    return candidate || "";
  }
}

function ytThumb(u) {
  try {
    const U = new URL(u);
    if (U.hostname.includes("youtube.com")) {
      const v = U.searchParams.get("v");
      if (v) return `https://img.youtube.com/vi/${v}/maxresdefault.jpg`;
    }
    if (U.hostname === "youtu.be") {
      const id = U.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    }
  } catch {}
  return "";
}

function thum(u) {
  return `https://image.thum.io/get/width/1200/${u}`;
}
function mshot(u) {
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(u)}?w=1200`;
}

async function fetchHtml(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return "";
    const ct = r.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml/i.test(ct)) return "";
    return await r.text();
  } catch {
    return "";
  }
}

function extractOg(html, base) {
  if (!html) return "";
  const reList = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+property=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
  ];
  for (const re of reList) {
    const m = re.exec(html);
    if (m) return absUrl(m[1], base);
  }
  return "";
}

function makeMd({ title, iso, description, heroUrl, short, long, url, source }) {
  const titleSafe = title.replace(/"/g, '\\"');
  const descSafe = (description || title).slice(0, 140).replace(/"/g, '\\"');
  const heroFM = heroUrl
    ? `heroImage: "${heroUrl}"\nogImage: "${heroUrl}"\n`
    : "";
  const heroBlock = heroUrl ? `![${titleSafe}](${heroUrl})\n\n` : "";

  return `---
title: "${titleSafe}"
pubDatetime: ${iso}
description: "${descSafe}"
${heroFM}tags: ${JSON.stringify(TAGS)}
---

${heroBlock}> ${short}

${long ? `${long}\n\n` : ""}**Source:** [${source || url}](${url})
`;
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

// --------------- Perplexity Fetch ---------------
async function fetchPerplexity() {
  const key = process.env.PPLX_API_KEY;
  if (!key) return null;

  const body = {
    model: "sonar",
    search_recency_filter: "day",
    max_tokens: 1500,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ai_digest",
        strict: true,
        schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              maxItems: MAX_ITEMS,
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  source: { type: "string" },
                  image: { type: "string" },
                  short: { type: "string" },
                  long: { type: "string" },
                },
                required: ["title", "url", "short", "long"],
              },
            },
          },
          required: ["items"],
        },
      },
    },
    messages: [
      {
        role: "system",
        content:
          "You are a concise AI news editor. Write human-readable summaries without filler or clickbait.",
      },
      {
        role: "user",
        content:
          "Summarize the 3 most interesting AI or LLM developments from the past 24h. Each item: title, url, source, short (≤140 chars), long (2–3 paragraphs, ~300 words). Output JSON only.",
      },
    ],
  };

  const r = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) throw new Error(`Perplexity ${r.status}`);
  const data = await r.json();

  let parsed;
  try {
    parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
  } catch {
    throw new Error("Perplexity JSON parse failed");
  }

  const items = Array.isArray(parsed.items)
    ? parsed.items.slice(0, MAX_ITEMS)
    : [];
  return items.length ? items : null;
}

// ----------------- MAIN -----------------
(async () => {
  await ensureDir(OUT_DIR);

  let items;
  try {
    items = await fetchPerplexity();
  } catch (e) {
    console.error("Perplexity error:", e);
  }

  if (!items?.length) {
    console.log("No items found; exiting.");
    process.exit(0);
  }

  for (const it of items) {
    const { iso, ymd, hhmmss, ms, rand } = nowParts();
    const url = (it.url || "").trim();
    const source = (it.source || "").trim();
    const title = (it.title || "AI Update").trim();
    const short = (it.short || title).trim();
    const long = (it.long || "").trim();
    const givenImg = (it.image || "").trim();

    // try to find a good preview image
    const html = await fetchHtml(url);
    let heroUrl = "";
    if (/^https?:\/\//.test(givenImg)) heroUrl = givenImg;
    if (!heroUrl && html) heroUrl = extractOg(html, url);
    if (!heroUrl) heroUrl = ytThumb(url);
    if (!heroUrl && url) heroUrl = thum(url);
    if (!heroUrl && url) heroUrl = mshot(url);

    const md = makeMd({
      title,
      iso,
      description: short,
      heroUrl,
      short,
      long,
      url,
      source,
    });

    const slug = slugify(title);
    const filename = `${ymd}-${slug}-${hhmmss}-${ms}-${rand}.md`;
    const outPath = path.join(OUT_DIR, filename);
    await fs.writeFile(outPath, md, "utf8");
    console.log("📝 Wrote", outPath);
  }
})();
