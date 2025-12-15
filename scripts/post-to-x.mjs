/**
 * Post New Blog Articles to X (Twitter)
 * 
 * Usage:
 *   node scripts/post-to-x.mjs
 * 
 * Environment Variables Required:
 *   X_API_KEY        - X API Key (from developer portal)
 *   X_API_SECRET     - X API Secret
 *   X_ACCESS_TOKEN   - Access Token (with write permissions)
 *   X_ACCESS_SECRET  - Access Token Secret
 * 
 * Optional:
 *   SITE_URL         - Your blog URL (default: https://logsofthinkingmachine.com)
 *   DRY_RUN          - Set to "true" to preview without posting
 * 
 * You can also create a .env file in the project root with these values.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

// Load .env file if exists
try {
  const envPath = '.env';
  const envContent = await fs.readFile(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      const value = valueParts.join('=').trim();
      if (value && !process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
  console.log('📄 Loaded .env file');
} catch {
  // .env file doesn't exist, that's fine
}

import { TwitterApi } from 'twitter-api-v2';

const BLOG_DIR = 'src/data/blog';
const SITE_URL = process.env.SITE_URL || 'https://logsofthinkingmachine.com';
const POSTED_TRACKER = '.x-posted-articles.json';
const DRY_RUN = process.env.DRY_RUN === 'true';
const MAX_POSTS_PER_RUN = 1; // Avoid spam

// Tweet templates for variety
const TWEET_TEMPLATES = [
  (title, desc, url, tags) => `🤖 ${title}\n\n${desc}\n\n${url}\n\n${tags}`,
  (title, desc, url, tags) => `🚀 New on the blog:\n\n${title}\n\n${desc}\n\n${url}\n\n${tags}`,
  (title, desc, url, tags) => `💡 ${title}\n\n${desc}\n\nRead more: ${url}\n\n${tags}`,
  (title, desc, url, tags) => `📰 AI Update:\n\n${title}\n\n${desc}\n\n${url}\n\n${tags}`,
  (title, desc, url, tags) => `🧠 Thinking about AI:\n\n${title}\n\n${url}\n\n${tags}`,
];

async function loadPostedArticles() {
  try {
    const data = await fs.readFile(POSTED_TRACKER, 'utf-8');
    return new Set(JSON.parse(data));
  } catch {
    return new Set();
  }
}

async function savePostedArticles(posted) {
  await fs.writeFile(POSTED_TRACKER, JSON.stringify([...posted], null, 2));
}

function parseMarkdownFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = match[1];
  const getValue = (key) => {
    const regex = new RegExp(`${key}:\\s*"(.+?)"`, 's');
    const m = frontmatter.match(regex);
    return m ? m[1] : null;
  };

  const getArray = (key) => {
    const regex = new RegExp(`${key}:\\s*\\[(.+?)\\]`, 's');
    const m = frontmatter.match(regex);
    if (!m) return [];
    return m[1].match(/"([^"]+)"/g)?.map(t => t.replace(/"/g, '')) || [];
  };

  return {
    title: getValue('title'),
    description: getValue('description'),
    tags: getArray('tags'),
    pubDatetime: getValue('pubDatetime'),
  };
}

function createSlug(filename) {
  return filename
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')  // Remove date prefix
    .replace(/-\d{6}-\d{3}-\w{4}\.md$/, '')  // Remove timestamp suffix
    .replace(/\.md$/, '');
}

function createTweet(title, description, url, tags) {
  // Pick a random template
  const template = TWEET_TEMPLATES[Math.floor(Math.random() * TWEET_TEMPLATES.length)];
  
  // Create hashtags (max 3, clean them)
  const hashtags = tags
    .slice(0, 3)
    .map(t => `#${t.replace(/[^a-zA-Z0-9]/g, '')}`)
    .join(' ');

  // Truncate description to fit
  const maxDescLength = 280 - title.length - url.length - hashtags.length - 30; // Buffer for template
  const shortDesc = description.length > maxDescLength 
    ? description.slice(0, maxDescLength - 3) + '...'
    : description;

  let tweet = template(title, shortDesc, url, hashtags);
  
  // Final truncation if needed
  if (tweet.length > 280) {
    // Remove description if too long
    tweet = template(title, '', url, hashtags);
  }
  if (tweet.length > 280) {
    // Remove hashtags if still too long
    tweet = `🤖 ${title}\n\n${url}`;
  }
  if (tweet.length > 280) {
    tweet = tweet.slice(0, 277) + '...';
  }

  return tweet.trim();
}

async function main() {
  console.log('🐦 X/Twitter Auto-Poster for Logs of a Thinking Machine\n');

  // Check credentials
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;
  
  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
    console.error('❌ Missing X API credentials!');
    console.error('\nRequired environment variables:');
    console.error('  X_API_KEY        - Your X API Key');
    console.error('  X_API_SECRET     - Your X API Secret');
    console.error('  X_ACCESS_TOKEN   - Your Access Token');
    console.error('  X_ACCESS_SECRET  - Your Access Token Secret');
    console.error('\nGet these from: https://developer.twitter.com/en/portal/dashboard');
    process.exit(1);
  }

  // Load already posted articles
  const postedArticles = await loadPostedArticles();
  console.log(`📊 Previously posted: ${postedArticles.size} articles`);

  // Get all blog posts
  const files = await fs.readdir(BLOG_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  console.log(`📚 Found ${mdFiles.length} total articles\n`);

  // Find unposted articles
  const unposted = [];
  for (const filename of mdFiles) {
    if (postedArticles.has(filename)) continue;
    
    const filepath = path.join(BLOG_DIR, filename);
    const content = await fs.readFile(filepath, 'utf-8');
    const meta = parseMarkdownFrontmatter(content);
    
    if (meta?.title) {
      unposted.push({ filename, filepath, ...meta });
    }
  }

  console.log(`📝 Unposted articles: ${unposted.length}`);

  if (unposted.length === 0) {
    console.log('✅ All articles have been posted!');
    return;
  }

  // Sort by date (newest first)
  unposted.sort((a, b) => {
    const dateA = new Date(a.pubDatetime || 0);
    const dateB = new Date(b.pubDatetime || 0);
    return dateB - dateA;
  });

  // Initialize X client
  let client;
  if (!DRY_RUN) {
    client = new TwitterApi({
      appKey: X_API_KEY,
      appSecret: X_API_SECRET,
      accessToken: X_ACCESS_TOKEN,
      accessSecret: X_ACCESS_SECRET,
    }).readWrite;
  }

  // Post articles
  let posted = 0;
  for (const article of unposted) {
    if (posted >= MAX_POSTS_PER_RUN) {
      console.log(`\n⏸️ Reached max posts per run (${MAX_POSTS_PER_RUN})`);
      break;
    }

    const slug = createSlug(article.filename);
    const url = `${SITE_URL}/posts/${slug}`;
    const tweet = createTweet(
      article.title,
      article.description || '',
      url,
      article.tags || []
    );

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📄 ${article.title}`);
    console.log(`🔗 ${url}`);
    console.log(`\n📤 Tweet (${tweet.length}/280 chars):\n`);
    console.log(tweet);
    console.log(`${'─'.repeat(60)}`);

    if (DRY_RUN) {
      console.log('🔍 DRY RUN - Not actually posting');
      postedArticles.add(article.filename);
      posted++;
      continue;
    }

    try {
      const response = await client.v2.tweet(tweet);
      console.log(`✅ Posted! Tweet ID: ${response.data.id}`);
      console.log(`🔗 https://x.com/i/status/${response.data.id}`);
      
      postedArticles.add(article.filename);
      posted++;
      
      // Rate limiting - wait 2 seconds between posts
      if (posted < MAX_POSTS_PER_RUN) {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (error) {
      console.error(`❌ Failed to post: ${error.message}`);
      if (error.data) {
        console.error('API Error:', JSON.stringify(error.data, null, 2));
      }
    }
  }

  // Save progress
  await savePostedArticles(postedArticles);
  console.log(`\n🎉 Posted ${posted} article(s) to X!`);
  console.log(`📊 Total posted: ${postedArticles.size}/${mdFiles.length} articles`);
}

main().catch(console.error);

