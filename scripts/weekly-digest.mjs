/* scripts/weekly-digest.mjs
 * Generates and sends a weekly email digest via Buttondown API
 *
 * SETUP:
 * 1. Get your Buttondown API key from: https://buttondown.email/settings/api
 * 2. Set environment variable: BUTTONDOWN_API_KEY=your_api_key
 * 3. Run: npm run digest:send (or node scripts/weekly-digest.mjs)
 *
 * AUTOMATION:
 * Add to GitHub Actions or cron job to run weekly (e.g., every Sunday at 9am)
 */

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = "src/data/blog";
const SITE_URL = process.env.SITE_URL || "https://logsofthinking.com";
const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY;
const DRY_RUN = process.env.DRY_RUN === "true";

// Get posts from the last 7 days
async function getRecentPosts(days = 7) {
  const files = await fs.readdir(BLOG_DIR);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const posts = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const filePath = path.join(BLOG_DIR, file);
    const content = await fs.readFile(filePath, "utf-8");
    const { data } = matter(content);

    if (data.draft) continue;

    const pubDate = new Date(data.pubDatetime);
    if (pubDate >= cutoffDate) {
      // Generate slug from filename
      const slug = file.replace(/\.md$/, "");
      posts.push({
        title: data.title,
        description: data.description,
        pubDatetime: pubDate,
        tags: data.tags || [],
        slug,
        url: `${SITE_URL}/posts/${slug}`,
      });
    }
  }

  // Sort by date descending
  return posts.sort((a, b) => b.pubDatetime - a.pubDatetime);
}

// Generate digest email HTML
function generateDigestHTML(posts) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const postsHTML = posts
    .map(
      (post) => `
    <tr>
      <td style="padding: 20px 0; border-bottom: 1px solid #e5e7eb;">
        <a href="${post.url}" style="color: #1e90ff; text-decoration: none; font-size: 18px; font-weight: 600;">
          ${post.title}
        </a>
        <p style="color: #6b7280; margin: 8px 0 0; line-height: 1.5;">
          ${post.description || ""}
        </p>
        <p style="color: #9ca3af; margin: 8px 0 0; font-size: 14px;">
          ${formatDate(post.pubDatetime)} · ${post.tags.slice(0, 3).join(", ")}
        </p>
      </td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e90ff 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">
                Logs of a Thinking Machine
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">
                Weekly AI Digest · ${formatDate(weekStart)} - ${formatDate(now)}
              </p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding: 32px 32px 16px;">
              <p style="color: #374151; line-height: 1.6; margin: 0;">
                Hey there! Here's what happened in AI this week — ${posts.length} stories curated just for you.
              </p>
            </td>
          </tr>

          <!-- Posts -->
          <tr>
            <td style="padding: 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${postsHTML}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 32px; text-align: center;">
              <a href="${SITE_URL}/posts" style="display: inline-block; background: #1e90ff; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View All Posts
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                You're receiving this because you subscribed to Logs of a Thinking Machine.
              </p>
              <p style="color: #9ca3af; font-size: 14px; margin: 8px 0 0;">
                <a href="${SITE_URL}" style="color: #6b7280;">Visit Site</a> ·
                <a href="https://x.com/logsofthinking" style="color: #6b7280;">Follow on X</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// Generate plain text version
function generateDigestText(posts) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const postsText = posts
    .map(
      (post) => `
${post.title}
${post.description || ""}
${formatDate(post.pubDatetime)} · ${post.tags.slice(0, 3).join(", ")}
Read more: ${post.url}
`
    )
    .join("\n---\n");

  return `
LOGS OF A THINKING MACHINE
Weekly AI Digest · ${formatDate(weekStart)} - ${formatDate(now)}

Hey there! Here's what happened in AI this week — ${posts.length} stories curated just for you.

${postsText}

---

View all posts: ${SITE_URL}/posts
Follow on X: https://x.com/logsofthinking

You're receiving this because you subscribed to Logs of a Thinking Machine.
`;
}

// Send digest via Buttondown API
async function sendDigest(posts) {
  if (!BUTTONDOWN_API_KEY) {
    console.error("Error: BUTTONDOWN_API_KEY not set");
    console.log("Set it with: export BUTTONDOWN_API_KEY=your_api_key");
    process.exit(1);
  }

  if (posts.length === 0) {
    console.log("No posts from the last week. Skipping digest.");
    return;
  }

  const now = new Date();
  const subject = `AI Weekly: ${posts.length} Stories You Shouldn't Miss (${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;

  const body = {
    subject,
    body: generateDigestHTML(posts),
    // Buttondown uses HTML body directly
  };

  if (DRY_RUN) {
    console.log("=== DRY RUN - Would send: ===");
    console.log("Subject:", subject);
    console.log("Posts:", posts.length);
    posts.forEach((p) => console.log(`  - ${p.title}`));
    console.log("\n=== HTML Preview (first 500 chars): ===");
    console.log(body.body.slice(0, 500));
    return;
  }

  console.log(`Sending digest with ${posts.length} posts...`);

  const response = await fetch("https://api.buttondown.email/v1/emails", {
    method: "POST",
    headers: {
      Authorization: `Token ${BUTTONDOWN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to send digest:", response.status, error);
    process.exit(1);
  }

  const result = await response.json();
  console.log("Digest sent successfully!");
  console.log("Email ID:", result.id);
  console.log("Subject:", result.subject);
}

// Main
(async () => {
  console.log("Generating weekly digest...\n");

  const posts = await getRecentPosts(7);
  console.log(`Found ${posts.length} posts from the last 7 days:\n`);

  posts.forEach((post) => {
    console.log(`  - ${post.title}`);
    console.log(`    ${post.pubDatetime.toLocaleDateString()}`);
  });

  console.log("");

  await sendDigest(posts);
})();
