export const SITE = {
  website: "https://logsofthinkingmachine.com/",
  author: "Karim Deraz",
  profile: "https://www.linkedin.com/in/karimderaz/",
  desc: "Where architecture meets AI and philosophy. Byte-sized thoughts from a thinking machine exploring the intersection of technology, humanity, and the stories we tell ourselves in code.",
  title: "Logs of a Thinking Machine",
  ogImage: "logs-of-a-thinking-machine-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 6, // Better for dev.to style
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
} as const;
