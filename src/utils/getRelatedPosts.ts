import type { CollectionEntry } from "astro:content";
import { slugifyStr } from "./slugify";

export interface RelatedPost {
  id: string;
  title: string;
  description: string;
  pubDatetime: Date;
  tags: string[];
  slug: string;
  score: number;
}

/**
 * Find related posts based on shared tags and content similarity
 * @param currentPost - The current post to find related posts for
 * @param allPosts - All available posts
 * @param maxPosts - Maximum number of related posts to return (default: 3)
 * @returns Array of related posts sorted by relevance score
 */
export function getRelatedPosts(
  currentPost: CollectionEntry<"blog">,
  allPosts: CollectionEntry<"blog">[],
  maxPosts: number = 3
): RelatedPost[] {
  const currentTags = currentPost.data.tags || [];
  const currentTitle = currentPost.data.title.toLowerCase();
  const currentDescription = currentPost.data.description.toLowerCase();
  
  // Filter out the current post and draft posts
  const candidatePosts = allPosts.filter(post => 
    post.id !== currentPost.id && 
    !post.data.draft
  );
  
  // Calculate similarity score for each candidate post
  const scoredPosts = candidatePosts.map(post => {
    const postTags = post.data.tags || [];
    const postTitle = post.data.title.toLowerCase();
    const postDescription = post.data.description.toLowerCase();
    
    let score = 0;
    
    // Tag similarity (weight: 40%)
    const commonTags = currentTags.filter(tag => 
      postTags.some(postTag => slugifyStr(postTag) === slugifyStr(tag))
    );
    const tagScore = (commonTags.length / Math.max(currentTags.length, 1)) * 0.4;
    score += tagScore;
    
    // Title similarity (weight: 30%)
    const titleWords = currentTitle.split(/\s+/);
    const postTitleWords = postTitle.split(/\s+/);
    const commonTitleWords = titleWords.filter(word => 
      word.length > 3 && postTitleWords.includes(word)
    );
    const titleScore = (commonTitleWords.length / Math.max(titleWords.length, 1)) * 0.3;
    score += titleScore;
    
    // Description similarity (weight: 20%)
    const descWords = currentDescription.split(/\s+/);
    const postDescWords = postDescription.split(/\s+/);
    const commonDescWords = descWords.filter(word => 
      word.length > 3 && postDescWords.includes(word)
    );
    const descScore = (commonDescWords.length / Math.max(descWords.length, 1)) * 0.2;
    score += descScore;
    
    // Recency bonus (weight: 10%)
    const daysDiff = Math.abs(
      (new Date().getTime() - post.data.pubDatetime.getTime()) / (1000 * 60 * 60 * 24)
    );
    const recencyScore = Math.max(0, (365 - daysDiff) / 365) * 0.1;
    score += recencyScore;
    
    return {
      id: post.id,
      title: post.data.title,
      description: post.data.description,
      pubDatetime: post.data.pubDatetime,
      tags: post.data.tags || [],
      slug: post.id,
      score
    };
  });
  
  // Sort by score (highest first) and return top posts
  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPosts)
    .filter(post => post.score > 0.1); // Only return posts with meaningful similarity
}

/**
 * Get related posts by specific tags
 * @param currentPost - The current post
 * @param allPosts - All available posts
 * @param targetTags - Specific tags to match against
 * @param maxPosts - Maximum number of related posts to return
 * @returns Array of related posts
 */
export function getRelatedPostsByTags(
  currentPost: CollectionEntry<"blog">,
  allPosts: CollectionEntry<"blog">[],
  targetTags: string[],
  maxPosts: number = 3
): RelatedPost[] {
  const candidatePosts = allPosts.filter(post => 
    post.id !== currentPost.id && 
    !post.data.draft &&
    post.data.tags.some(tag => 
      targetTags.some(targetTag => slugifyStr(tag) === slugifyStr(targetTag))
    )
  );
  
  return candidatePosts
    .map(post => ({
      id: post.id,
      title: post.data.title,
      description: post.data.description,
      pubDatetime: post.data.pubDatetime,
      tags: post.data.tags || [],
      slug: post.id,
      score: 1 // All posts match the tag criteria
    }))
    .sort((a, b) => b.pubDatetime.getTime() - a.pubDatetime.getTime())
    .slice(0, maxPosts);
}


