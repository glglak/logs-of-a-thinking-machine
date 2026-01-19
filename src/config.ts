export const SITE = {
  website: "https://logsofthinkingmachine.com/",
  author: "Karim Deraz",
  profile: "https://www.linkedin.com/in/karimderaz/",
  desc: "Daily AI news and insights that actually matter. No hype, just what developers need to know about LLMs, tools, and the tech reshaping how we build software.",
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
