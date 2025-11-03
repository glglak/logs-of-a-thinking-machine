/* scripts/ai-brief.mjs */
import fs from "node:fs/promises";
import path from "node:path";

// ------------ config ------------
const OUT_DIR = "src/data/blog";
const TAGS = ["AI", "digest"];
const MAX_ITEMS = 3;

// ------------ helpers ------------
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
  } catch { return candidate || ""; }
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
function thum(u) { return `https://image.thum.io/get/width/1200/${u}`; }
function mshot(u) { return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(u)}?w=1200`; }

async function fetchHtml(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return "";
    const ct = r.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml/i.test(ct)) return "";
    return await r.text();
  } catch { return ""; }
}
function extractOg(html, base) {
  if (!html) return "";
  const reList = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+property=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i
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

  const heroFM = heroUrl ? `heroImage: "${heroUrl}"
ogImage: "${heroUrl}"
` : "";

  const heroBlock = heroUrl ? `![${titleSafe}](${heroUrl})\n\n` : "";

  return `---
title: "${titleSafe}"
pubDatetime: ${iso}
description: "${descSafe}"
${heroFM}tags: ${JSON.stringify(TAGS)}
---

${heroBlock}> ${short}

${long ? `${long}\n\n` : ""}**Source:** ${url}${source ? ` *${source}*` : ""}
`;
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

// ------------ data sources ------------
async function fetchPerplexity() {
  const key = process.env.PPLX_API_KEY;
  if (!key) return null;

  const body = {
    model: "sonar",
    search_recency_filter: "day",
    max_tokens: 1200,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ai_digest_items",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            items: {
              type: "array",
              minItems: MAX_ITEMS,
              maxItems: MAX_ITEMS,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title:  { type: "string" },
                  url:    { type: "string", format: "uri" },
                  source: { type: "string" },
                  image:  { type: "string" },
                  short:  { type: "string", maxLength: 140 },
                  long:   { type: "string", maxLength: 900 }
                },
                required: ["title","url","short","long"]
              }
            }
          },
          required: ["items"]
        }
      }
    },
    messages: [
      { role: "system", content: "You are a precise AI/LLM news editor. Neutral tone. No fluff." },
      { role: "user", content:
        "From the last 24h, return 3 credible AI/LLM items. For each: title, url, source, image (og:image if confident or empty), short (<=140 chars), long (2–3 tight paragraphs, 200–350 words total). JSON only." }
    ]
  };

  const r = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!r.ok) throw new Error(`Perplexity ${r.status}`);
  const data = await r.json();

  // PPLX JSON-mode puts payload at choices[0].message.content
  let parsed;
  try { parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}"); }
  catch { throw new Error("Perplexity JSON parse failed"); }

  const items = Array.isArray(parsed.items) ? parsed.items.slice(0, MAX_ITEMS) : [];
  return items.length ? items : null;
}

async function fetchNewsApi() {
  const key = process.env.NEWSAPI_KEY;
  if (!key) return null;
  const q = encodeURIComponent(
    '("artificial intelligence" OR "LLM" OR "large language model" OR "generative AI" OR "transformer" OR "multimodal" OR "agentic") NOT (football OR soccer OR NBA OR MLB OR NFL OR tennis OR cricket OR celebrity OR gossip OR gaming)'
  );
  const url = `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${key}`;

  const r = await fetch(url);
  if (!r.ok) throw new Error(`NewsAPI ${r.status}`);
  const data = await r.json();
  const arts = Array.isArray(data.articles) ? data.articles : [];
  return arts.slice(0, MAX_ITEMS).map(a => ({
    title: a.title || "",
    url: a.url || "",
    source: a.source?.name || "",
    image: a.urlToImage || "",
    short: (a.description || "").slice(0, 140),
    long: (a.content || a.description || "").replace(/\s+/g, " ").slice(0, 800)
  }));
}

// ------------ main ------------
(async () => {
  await ensureDir(OUT_DIR);

  let items = null;
  try { items = await fetchPerplexity(); } catch (e) { console.error(e); }
  if (!items) {
    console.log("Falling back to NewsAPI…");
    items = await fetchNewsApi();
  }
  if (!items || !items.length) {
    console.log("No items found; exiting.");
    process.exit(0);
  }

  // de-dup by URL/title and trim to MAX_ITEMS
  const seen = new Set();
  const uniq = [];
  for (const it of items) {
    const key = (it.url || it.title || "").toLowerCase();
    if (key && !seen.has(key)) { seen.add(key); uniq.push(it); }
    if (uniq.length === MAX_ITEMS) break;
  }

  for (const it of uniq) {
    const { d, iso, ymd, hhmmss, ms, rand } = nowParts();
    const url = (it.url || "").trim();
    const source = (it.source || "").trim();
    const title = (it.title || "AI Update").trim();
    const short = (it.short || title).trim();
    const long = (it.long || "").trim();
    const givenImg = (it.image || "").trim();

    // arXiv PDF preview fix → use abs page
    let previewUrl = url;
    const mPdf = url.match(/arxiv\.org\/pdf\/(.+?)\.pdf(?:$|[?#])/i);
    if (mPdf) previewUrl = `https://arxiv.org/abs/${mPdf[1]}`;

    const html = await fetchHtml(previewUrl);
    let heroUrl = "";
    if (/^https?:\/\//.test(givenImg)) heroUrl = givenImg;
    if (!heroUrl && html) heroUrl = extractOg(html, previewUrl);
    if (!heroUrl) heroUrl = ytThumb(previewUrl);
    if (!heroUrl && previewUrl) heroUrl = thum(previewUrl);
    if (!heroUrl && previewUrl) heroUrl = mshot(previewUrl);

    const md = makeMd({
      title,
      iso,
      description: short,
      heroUrl,
      short,
      long,
      url: previewUrl,
      source
    });

    const slug = slugify(title);
    const filename = `${ymd}-${slug}-${hhmmss}-${ms}-${rand}.md`;
    const outPath = path.join(OUT_DIR, filename);
    await fs.writeFile(outPath, md, "utf8");
    console.log("Wrote", outPath);
  }
})();
