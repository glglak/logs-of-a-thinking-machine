export const SITE = {
  website: "https://logsofthinkingmachine.com/",
  author: "Karim Deraz",
  profile: "https://www.linkedin.com/in/karimderaz/",
  desc: "Where architecture meets AI and philosophy. Byte-sized thoughts from a thinking machine exploring the intersection of technology, humanity, and the stories we tell ourselves in code.",
  title: "Logs of a Thinking Machine",
  tagline: "Byte-sized AI Reflections",
  ogImage: "logs-of-a-thinking-machine-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 20, // Show more posts on homepage
  postPerPage: 12,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: false,
  showBackButton: true,
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "",
  },
  dynamicOgImage: true, // Enable for better social sharing
  dir: "ltr",
  lang: "en",
  timezone: "Asia/Riyadh",
  // SEO Enhancement
  keywords: [
    "AI blog",
    "artificial intelligence",
    "machine learning",
    "LLM",
    "large language models",
    "GPT",
    "neural networks",
    "AI news",
    "tech philosophy",
    "software architecture",
    "AI ethics",
    "generative AI",
    "deep learning",
    "AI automation",
  ],
  twitterHandle: "@logsofthinking", // Update with your actual handle
  locale: "en_US",
} as const;
