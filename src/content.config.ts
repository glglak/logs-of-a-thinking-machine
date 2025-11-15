import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { SITE } from "@/config";

export const BLOG_PATH = "src/data/blog";

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: `./${BLOG_PATH}` }),
  schema: z
    .object({
      author: z.string().default(SITE.author),

      // ✅ THIS LINE is the key
      pubDatetime: z.coerce.date(), // <— coerce strings like "2025-11-05T06:44:50Z" into Date objects

      modDatetime: z.coerce.date().optional().nullable(),
      title: z.string(),
      description: z.string(),
      tags: z.array(z.string()).default(["others"]),
      heroImage: z.string().optional(),
      ogImage: z.string().optional(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      canonicalURL: z.string().optional(),
      timezone: z.string().optional(),
      hideEditPost: z.boolean().optional(),

      // Optional fields
      content_pillar: z.string().optional(),
      content_type: z.string().optional(),
      source_url: z.string().optional(),
      source_name: z.string().optional(),
    })
    .passthrough(), // ✅ allow any extra fields silently
});

export const collections = { blog };
