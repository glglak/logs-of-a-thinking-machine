# SEO Setup Guide - Google Search Indexing

## ✅ **What Was Fixed**

### **1. Domain Configuration**
- **Updated site URL** from `logs-of-a-thinking-machine.vercel.app` to `logsofthinkingmachine.com`
- **Fixed canonical URLs** to use the correct domain
- **Updated robots.txt** to reference the correct sitemap URL

### **2. Sitemap Configuration**
- **Enhanced sitemap** with proper changefreq and priority
- **Added custom pages** (home, posts, about, tags)
- **Automatic discovery** of all blog posts
- **Daily updates** configured for better indexing

### **3. SEO Enhancements**
- **Enhanced structured data** (JSON-LD) for better Google understanding
- **Improved meta tags** (robots, Open Graph, Twitter)
- **Canonical URLs** now use correct domain
- **Article schema** with proper author and publisher information

## **How It Works**

### **Automatic Sitemap Generation**
When your JS script creates new MD files:
1. **File created** → GitHub repository
2. **Vercel detects change** → Triggers build
3. **Astro builds** → Discovers all pages
4. **Sitemap regenerates** → Includes new article
5. **robots.txt updated** → Points to correct sitemap

### **No Manual Work Needed**
- ✅ Sitemap is **automatically generated** on each build
- ✅ New articles are **automatically included**
- ✅ URLs use **correct domain** (logsofthinkingmachine.com)
- ✅ **Structured data** helps Google understand your content

## **Google Search Console Setup**

### **1. Verify Your Site**
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `logsofthinkingmachine.com`
3. Use HTML tag verification (add to Vercel environment variables):
   ```
   PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code
   ```

### **2. Submit Sitemap**
1. In Search Console, go to **Sitemaps**
2. Submit: `https://logsofthinkingmachine.com/sitemap-index.xml`
3. Google will automatically crawl your sitemap

### **3. Monitor Indexing**
- Check **Coverage** report for indexing status
- Review **Enhancements** for structured data
- Monitor **Performance** for search visibility

## **SEO Best Practices Implemented**

### **✅ Technical SEO**
- ✅ Canonical URLs (prevents duplicate content)
- ✅ Robots meta tags (index, follow)
- ✅ Sitemap (auto-generated)
- ✅ robots.txt (properly configured)
- ✅ Structured data (JSON-LD)

### **✅ On-Page SEO**
- ✅ Title tags (unique per page)
- ✅ Meta descriptions (compelling, 140-160 chars)
- ✅ Heading structure (H1, H2, H3)
- ✅ Image alt text (from your content)
- ✅ Internal linking (related posts)

### **✅ Content SEO**
- ✅ Fresh content (daily updates via automation)
- ✅ Long-form content (your philosophical analysis)
- ✅ Topic clusters (architecture, AI, philosophy)
- ✅ Author attribution (structured data)

## **Verification Checklist**

After deployment, verify:

1. **Sitemap is accessible:**
   - Visit: `https://logsofthinkingmachine.com/sitemap-index.xml`
   - Should show all your pages

2. **robots.txt is correct:**
   - Visit: `https://logsofthinkingmachine.com/robots.txt`
   - Should show: `Sitemap: https://logsofthinkingmachine.com/sitemap-index.xml`

3. **Canonical URLs are correct:**
   - View page source on any article
   - Check `<link rel="canonical">` uses `logsofthinkingmachine.com`

4. **Structured data is valid:**
   - Use [Google Rich Results Test](https://search.google.com/test/rich-results)
   - Test any article URL

## **Troubleshooting**

### **Sitemap is Empty**
- **Check**: Are MD files in `src/data/blog/`?
- **Check**: Do files have valid frontmatter?
- **Check**: Are files marked as `draft: true`? (they'll be excluded)

### **Google Not Indexing**
- **Wait**: Google can take 1-7 days to index
- **Submit**: Manually submit URLs in Search Console
- **Check**: Ensure robots.txt allows crawling
- **Verify**: Site is verified in Search Console

### **Wrong Domain in URLs**
- **Check**: `src/config.ts` has correct `website` URL
- **Check**: Vercel project settings have correct domain
- **Rebuild**: Trigger a new deployment

## **Next Steps**

1. **Deploy these changes** to production
2. **Verify site** in Google Search Console
3. **Submit sitemap** to Google
4. **Monitor indexing** over the next week
5. **Check search results** after indexing

Your blog is now fully optimized for Google Search! 🚀
