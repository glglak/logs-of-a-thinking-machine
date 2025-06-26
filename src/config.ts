export const SITE = {
  website: "https://logs-of-a-thinking-machine.vercel.app/", // replace with your actual domain
  author: "Karim",
  profile: "https://linkedin.com/in/moodraz",
  desc: "Where architecture meets abstraction and automation.",
  title: "Logs of a Thinking Machine",
  ogImage: "logs-of-a-thinking-machine-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 100, // remove pagination
  postPerPage: 100,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: false,
  showBackButton: false,
  editPost: {
    enabled: false,
    text: "Edit page",
    url: "",
  },
  dynamicOgImage: false,
  dir: "ltr",
  lang: "en",
  timezone: "Asia/Riyadh",
} as const;
