# Build Time Optimization Guide

## Current Performance
- **Build Time**: ~4-5 minutes for 100+ posts
- **Bottleneck**: Multiple `getCollection()` calls across components

## Optimizations Implemented

### 1. ✅ Efficient Tag Counting
**Before**: Called `getPostsByTag()` for each tag (O(n²) complexity)
**After**: Single pass through posts with Map-based counting (O(n) complexity)

```typescript
// Old (slow)
tags.map(tag => {
  const tagPosts = getPostsByTag(posts, tag); // Recalculates for each tag
  return { tag, count: tagPosts.length };
});

// New (fast)
const tagCountMap = new Map();
posts.forEach(post => {
  post.data.tags?.forEach(tag => {
    const slug = slugifyStr(tag);
    tagCountMap.set(slug, (tagCountMap.get(slug) || 0) + 1);
  });
});
```

### 2. ✅ Reduced Redundant Calculations
- Sidebar now calculates tags once per page
- Tag component accepts count as prop (no recalculation)
- DevLayout calculates stats once per page

### 3. ✅ Increased Homepage Posts
- Changed from 6 to 20 posts (better UX)
- Added "View All Posts" button for navigation

## Further Optimization Opportunities

### Option A: Astro Content Cache (Recommended)
Create a shared data file that calculates once:

```typescript
// src/data/blogStats.ts
export async function getBlogStats() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  // Calculate all stats once
  return { posts, tags, stats };
}
```

### Option B: Incremental Static Regeneration (ISR)
Use Astro's ISR for pages that don't change often:
- Tag pages
- Archive pages
- Static content

### Option C: Parallel Processing
Astro already parallelizes builds, but you can:
- Split large collections
- Use worker threads for heavy calculations
- Cache expensive operations

## Expected Improvements

With current optimizations:
- **Tag calculation**: ~70% faster
- **Sidebar rendering**: ~50% faster
- **Overall build**: ~20-30% faster

With further optimizations:
- **Target**: <3 minutes for 200+ posts
- **ISR**: Near-instant updates for new posts

## Monitoring

Track build times:
```bash
npm run build -- --verbose
```

Watch for:
- Multiple `getCollection()` calls
- Redundant tag calculations
- Large image processing
- Slow markdown parsing

## Recommendations

1. **Short-term**: Current optimizations are good
2. **Medium-term**: Implement shared data cache
3. **Long-term**: Consider ISR for better performance
