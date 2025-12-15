# X (Twitter) Automation Setup Guide

Automatically post your blog articles to X to drive traffic.

## Cost: FREE

The X Free API tier allows **50 posts per day** - more than enough for your 3 daily AI articles.

---

## Setup Instructions

### Step 1: Create X Developer Account

1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Sign in with your X account
3. Click **Sign up for Free Account**
4. Fill out the required information about your use case

### Step 2: Create a Project and App

1. In the Developer Portal, go to **Projects & Apps**
2. Click **+ Create Project**
3. Name it: `Logs of a Thinking Machine`
4. Select use case: `Making a bot`
5. Create an App within the project

### Step 3: Configure App Permissions

**Important: Do this BEFORE generating tokens!**

1. Go to your App's **Settings**
2. Click **User authentication settings** → **Set up**
3. Set **App permissions** to **Read and Write**
4. Fill required fields:
   - Callback URL: `https://logsofthinkingmachine.com`
   - Website URL: `https://logsofthinkingmachine.com`
5. Save changes

### Step 4: Generate API Keys

1. Go to **Keys and Tokens** tab
2. Under **Consumer Keys**, click **Regenerate** (if needed)
3. Save these securely:
   - **API Key** (also called Consumer Key)
   - **API Key Secret** (also called Consumer Secret)
4. Under **Authentication Tokens**, click **Generate**
5. Save these securely:
   - **Access Token**
   - **Access Token Secret**

---

## Secure Configuration (GitHub Secrets)

**Never commit API keys to your repository!**

### Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each:

| Secret Name | Value |
|-------------|-------|
| `X_API_KEY` | Your API Key |
| `X_API_SECRET` | Your API Key Secret |
| `X_ACCESS_TOKEN` | Your Access Token |
| `X_ACCESS_SECRET` | Your Access Token Secret |

### Verify Secrets

After adding, your secrets page should show:
```
X_API_KEY          Updated just now
X_API_SECRET       Updated just now  
X_ACCESS_TOKEN     Updated just now
X_ACCESS_SECRET    Updated just now
```

---

## How It Works

The X posting is integrated into your existing `ai-digest.yml` workflow:

1. **AI content is generated** via Perplexity API
2. **New posts are committed** to the repository
3. **Vercel deploys** the updated site
4. **X posting job runs** automatically
5. **Latest article is posted** to your X account

### Workflow Flow

```
Schedule (06:15 UTC daily)
    ↓
Generate AI Content
    ↓
Commit & Push
    ↓
Trigger Vercel Deploy
    ↓
Post to X (if new content)
```

---

## Local Testing

### Dry Run (Preview without posting)

```bash
# Set environment variables
export X_API_KEY="your_api_key"
export X_API_SECRET="your_api_secret"
export X_ACCESS_TOKEN="your_access_token"
export X_ACCESS_SECRET="your_access_secret"

# Install dependency
npm install twitter-api-v2

# Preview what would be posted
DRY_RUN=true npm run x:post
```

### Actually Post

```bash
npm run x:post
```

---

## Troubleshooting

### "Unauthorized" Error (401)

- **Cause**: Invalid or expired tokens
- **Fix**: Regenerate tokens in Developer Portal
- **Important**: Regenerate AFTER setting Read+Write permissions

### "Forbidden" Error (403)

- **Cause**: App doesn't have write permissions
- **Fix**: 
  1. Go to App Settings → User authentication settings
  2. Change to "Read and Write"
  3. Regenerate Access Token and Secret

### "Rate Limit" Error (429)

- **Cause**: Too many requests
- **Fix**: Wait 15 minutes, or reduce posting frequency

### Posts Not Appearing

- Check your X account isn't restricted
- Verify at https://x.com/settings/account
- New developer accounts may have delays

---

## Tweet Format

Posts are formatted as:

```
[Robot emoji] Article Title

Article description (truncated if needed)...

https://logsofthinkingmachine.com/posts/article-slug

#AI #LLM #relevantTag
```

The script uses varied templates to avoid duplicate content errors.

---

## Customization

### Change Max Posts Per Run

Edit `scripts/post-to-x.mjs`:

```javascript
const MAX_POSTS_PER_RUN = 1; // Change to 3 for all daily articles
```

### Disable X Posting

Remove the secrets from GitHub, or comment out the `post-to-x` job in `.github/workflows/ai-digest.yml`

---

## Security Best Practices

1. **Never commit secrets** to git
2. **Use GitHub Secrets** for all API keys
3. **Rotate keys periodically** (every 90 days)
4. **Monitor API usage** in X Developer Portal
5. **Use minimal permissions** (Read+Write only, not Admin)

---

## Resources

- [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
- [X API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [twitter-api-v2 npm package](https://www.npmjs.com/package/twitter-api-v2)
