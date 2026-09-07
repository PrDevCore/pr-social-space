import "server-only";

export type NewsTopic = "Technology" | "Entertainment";

export interface NewsStory {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  topic: NewsTopic;
}

type FeedConfig = { topic: NewsTopic; query: string };

const FEEDS: FeedConfig[] = [
  { topic: "Technology", query: "technology OR AI OR startups" },
  { topic: "Entertainment", query: "film OR music OR streaming OR gaming" },
];

function clean(value: string) {
  return value.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim();
}

function readTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? clean(match[1]) : "";
}

function readItems(xml: string, config: FeedConfig): NewsStory[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 8).map((match, index) => {
    const item = match[1];
    const title = readTag(item, "title");
    const url = readTag(item, "link");
    const publishedAt = readTag(item, "pubDate") || new Date().toISOString();
    const source = readTag(item, "source") || "Social Hub News";
    const description = readTag(item, "description");
    return {
      id: `${config.topic.toLowerCase()}-${index}-${encodeURIComponent(url)}`,
      title,
      description: description || `The latest ${config.topic.toLowerCase()} story from ${source}.`,
      url,
      source,
      publishedAt,
      topic: config.topic,
    };
  }).filter((story) => story.title && story.url);
}

async function fetchFeed(config: FeedConfig): Promise<NewsStory[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(config.query)}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) return [];
    return readItems(await response.text(), config);
  } catch {
    return [];
  }
}

export async function getLatestNews(): Promise<NewsStory[]> {
  const feeds = await Promise.all(FEEDS.map(fetchFeed));
  return feeds.flat().sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export function formatNewsDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Latest";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function storyFallback(topic: NewsTopic): NewsStory {
  return {
    id: `fallback-${topic.toLowerCase()}`,
    title: `Explore the latest ${topic.toLowerCase()} stories`,
    description: "Fresh updates will appear here as publishers make them available.",
    url: "/blog",
    source: "Social Hub",
    publishedAt: new Date().toISOString(),
    topic,
  };
}

export const NEWS_TOPICS: Array<"All" | NewsTopic> = ["All", "Technology", "Entertainment"];
export const NEWS_REVALIDATION_SECONDS = 900;
