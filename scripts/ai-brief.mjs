/* scripts/ai-brief.mjs */
import fs from "node:fs/promises";
import path from "node:path";

const OUT_DIR = "src/data/blog";
const MAX_ITEMS = 3;
// Default tags - will be enhanced by LLM
const DEFAULT_TAGS = ["AI", "digest"];

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

function makeMd({ title, iso, description, heroUrl, short, long, url, source, tags, category }) {
  const titleSafe = title.replace(/"/g, '\\"');
  const descSafe = (description || title).slice(0, 140).replace(/"/g, '\\"');
  const heroFM = heroUrl
    ? `heroImage: "${heroUrl}"\nogImage: "${heroUrl}"\n`
    : "";
  const heroBlock = heroUrl ? `![${titleSafe}](${heroUrl})\n\n` : "";
  
  // Use provided tags or fallback to defaults, ensure "AI" and "digest" are included
  const finalTags = Array.isArray(tags) && tags.length > 0 
    ? [...new Set([...tags, "AI", "digest"])] // Ensure AI and digest are always present
    : DEFAULT_TAGS;
  
  const categoryFM = category ? `content_pillar: "${category}"\n` : "";

  return `---
title: "${titleSafe}"
pubDatetime: ${iso}
description: "${descSafe}"
${heroFM}${categoryFM}tags: ${JSON.stringify(finalTags)}
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
    max_tokens: 2000,
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
                  title: { 
                    type: "string",
                    description: "Human-friendly dev.to style title - catchy, curious, conversational"
                  },
                  url: { type: "string" },
                  source: { type: "string" },
                  image: { type: "string" },
                  short: { 
                    type: "string",
                    description: "Compelling one-liner that makes people want to read more"
                  },
                  long: { 
                    type: "string",
                    description: "Engaging article content with context, implications, and insights"
                  },
                  tags: { 
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 relevant tags for discoverability"
                  },
                  category: {
                    type: "string",
                    enum: ["research", "industry", "startups", "enterprise", "hardware", "software", "governance", "ethics", "applications"],
                    description: "Primary content pillar category"
                  },
                },
                required: ["title", "url", "short", "long", "tags", "category"],
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
        content: `You are a senior developer advocate and tech writer for a popular AI-focused blog. Your writing style is engaging, insightful, and genuinely helpful to developers.

TITLE PHILOSOPHY:
Your titles should spark curiosity and promise value. Think dev.to top posts, not press releases.

GREAT TITLES:
- "I Built an AI That Writes Code - Here's What I Learned"
- "Why Every Developer Should Care About This New LLM"
- "The Surprising Reason OpenAI Just Changed Everything"
- "This Open Source Model Just Beat GPT-4 (And It's Free)"
- "What Nobody Tells You About Running LLMs in Production"
- "I Spent a Week With Claude's New Feature - My Honest Review"

AVOID:
- "OpenAI Announces New Model Release" (press release)
- "Google Unveils Gemini 2.0" (corporate speak)
- Generic clickbait without substance

WRITING PRINCIPLES:
1. CONVERSATIONAL: Write like you're explaining to a smart friend
2. BALANCED: Acknowledge both potential AND limitations
3. PRACTICAL: What can developers actually DO with this information?
4. INSIGHTFUL: Add YOUR analysis, don't just report facts
5. HONEST: Call out hype when you see it, praise what deserves it
6. SPECIFIC: Include concrete details, numbers, comparisons when available`,
      },
      {
        role: "user",
        content: `Find the 3 most significant AI/LLM developments from today. Prioritize:
- Breakthrough research or capabilities
- Tools/models developers can actually use
- Industry moves that will affect the ecosystem
- Open source releases

For each item provide:

TITLE: Catchy, dev.to-style headline that promises value. Examples:
- "Wait, Did Claude Just Get Way Better at Coding?"
- "This Tiny Model Runs on Your Phone (And It's Actually Good)"
- "Why This Research Paper Changes Everything for RAG"
- "The Hidden Feature in GPT-4o That Nobody's Talking About"

SHORT: One compelling hook sentence. Make readers NEED to click. Not a summary - a teaser that creates curiosity.

LONG: Write 4-5 paragraphs of substantive content:
1. HOOK: Start with a surprising fact, bold claim, or relatable developer pain point
2. WHAT: Explain the news clearly - what actually happened/was released
3. WHY IT MATTERS: Connect to real developer workflows and use cases
4. CONTEXT: How does this compare to existing solutions? What's the competitive landscape?
5. ACTION: End with next steps - how to try it, what to watch for, or a thought-provoking question

TAGS: 3-5 lowercase tags for discoverability

URL: Primary source URL

OUTPUT: Valid JSON only.`,
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
      tags: it.tags || [],
      category: it.category || "",
    });

    const slug = slugify(title);
    const filename = `${ymd}-${slug}-${hhmmss}-${ms}-${rand}.md`;
    const outPath = path.join(OUT_DIR, filename);
    await fs.writeFile(outPath, md, "utf8");
    console.log("📝 Wrote", outPath);
  }
})();
