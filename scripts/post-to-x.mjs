/**
 * Post New Blog Articles to X (Twitter)
 * 
 * Features:
 * - Posts with images when available
 * - Correct URL generation
 * - Varied tweet templates
 * - Tracks posted articles to avoid duplicates
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
const MAX_POSTS_PER_RUN = 1;

// Human-friendly tweet templates (dev.to style)
const TWEET_TEMPLATES = [
  (title, desc, url) => `${title}\n\n${desc}\n\n${url}`,
  (title, desc, url) => `New post:\n\n${title}\n\n${url}`,
  (title, desc, url) => `${title}\n\nRead more:\n${url}`,
  (title, desc, url) => `Just published:\n\n${title}\n\n${desc}\n\n${url}`,
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
    heroImage: getValue('heroImage'),
    ogImage: getValue('ogImage'),
    tags: getArray('tags'),
    pubDatetime: getValue('pubDatetime'),
  };
}

// Create slug exactly like Astro does - use filename without .md
function createSlug(filename) {
  // Remove .md extension, keep everything else including date
  // Example: 2025-11-22-some-article-title-211406-943-7a9c.md -> 2025-11-22-some-article-title-211406-943-7a9c
  return filename.replace(/\.md$/, '');
}

function createTweet(title, description, url, tags) {
  const template = TWEET_TEMPLATES[Math.floor(Math.random() * TWEET_TEMPLATES.length)];
  
  // Create hashtags (max 2, clean them)
  const hashtags = tags
    .filter(t => t.toLowerCase() !== 'digest' && t.toLowerCase() !== 'ai')
    .slice(0, 2)
    .map(t => `#${t.replace(/[^a-zA-Z0-9]/g, '')}`)
    .join(' ');

  // Truncate description to fit
  const shortDesc = description.length > 100 
    ? description.slice(0, 97) + '...'
    : description;

  let tweet = template(title, shortDesc, url);
  
  // Add hashtags if room
  if (tweet.length + hashtags.length + 2 <= 280 && hashtags) {
    tweet += `\n\n${hashtags}`;
  }

  // Final truncation if needed
  if (tweet.length > 280) {
    tweet = `${title}\n\n${url}`;
  }
  if (tweet.length > 280) {
    tweet = tweet.slice(0, 277) + '...';
  }

  return tweet.trim();
}

// Download image and return buffer for upload
async function downloadImage(imageUrl) {
  try {
    if (!imageUrl || !imageUrl.startsWith('http')) return null;
    
    console.log(`📷 Downloading image: ${imageUrl.slice(0, 60)}...`);
    
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!response.ok) {
      console.log(`⚠️ Image download failed: ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('image')) {
      console.log(`⚠️ Not an image: ${contentType}`);
      return null;
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    console.log(`✅ Image downloaded: ${(buffer.length / 1024).toFixed(1)}KB`);
    return buffer;
  } catch (error) {
    console.log(`⚠️ Image error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🐦 X Auto-Poster for Logs of a Thinking Machine\n');

  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;
  
  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
    console.error('❌ Missing X API credentials!');
    console.error('Required: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET');
    process.exit(1);
  }

  const postedArticles = await loadPostedArticles();
  console.log(`📊 Previously posted: ${postedArticles.size} articles`);

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
    });
  }

  let posted = 0;
  for (const article of unposted) {
    if (posted >= MAX_POSTS_PER_RUN) {
      console.log(`\n⏸️ Reached max posts per run (${MAX_POSTS_PER_RUN})`);
      break;
    }

    // Create correct URL using full slug (filename without .md)
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
      // Try to upload image if available
      let mediaId = null;
      const imageUrl = article.heroImage || article.ogImage;
      
      if (imageUrl) {
        const imageBuffer = await downloadImage(imageUrl);
        if (imageBuffer) {
          try {
            mediaId = await client.v1.uploadMedia(imageBuffer, { mimeType: 'image/jpeg' });
            console.log(`📷 Image uploaded: ${mediaId}`);
          } catch (uploadError) {
            console.log(`⚠️ Image upload failed: ${uploadError.message}`);
          }
        }
      }

      // Post tweet (with or without image)
      const tweetOptions = mediaId 
        ? { text: tweet, media: { media_ids: [mediaId] } }
        : { text: tweet };
      
      const response = await client.v2.tweet(tweetOptions);
      console.log(`✅ Posted! Tweet ID: ${response.data.id}`);
      console.log(`🔗 https://x.com/logsthinkingai/status/${response.data.id}`);
      
      postedArticles.add(article.filename);
      posted++;
      
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

  await savePostedArticles(postedArticles);
  console.log(`\n🎉 Posted ${posted} article(s) to X!`);
  console.log(`📊 Total posted: ${postedArticles.size}/${mdFiles.length} articles`);
}

main().catch(console.error);
