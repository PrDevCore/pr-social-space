"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BlogPost } from "@/lib/blog";
import { formatNewsDate, NEWS_TOPICS, type NewsStory } from "@/lib/news";

export function BlogExplorer({ posts, stories }: { posts: BlogPost[]; stories: NewsStory[] }) {
  const [topic, setTopic] = useState<(typeof NEWS_TOPICS)[number]>("All");
  const [query, setQuery] = useState("");
  const filteredStories = useMemo(() => stories.filter((story) => {
    const matchesTopic = topic === "All" || story.topic === topic;
    const haystack = `${story.title} ${story.description} ${story.source}`.toLowerCase();
    return matchesTopic && haystack.includes(query.toLowerCase());
  }), [query, stories, topic]);
  const featured = posts[0];

  return (
    <>
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <article className="card border border-black/10 bg-white p-7 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Editor&apos;s pick</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            <Link href={`/blog/${featured.slug}`} className="hover:text-accent">{featured.title}</Link>
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-black/60">{featured.description}</p>
          <Link href={`/blog/${featured.slug}`} className="btn-primary mt-6 inline-flex">Read the guide</Link>
        </article>
        <aside className="card border border-black/10 bg-[#17212b] p-7 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a373]">Stay in the loop</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">A smarter scroll, once a week.</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/65">Get useful social media tactics and the stories shaping tech and entertainment.</p>
          <Link href="/auth/register" className="mt-6 inline-flex rounded-md bg-[#d4a373] px-4 py-2 text-sm font-semibold text-[#17212b] hover:opacity-90">Join Social Hub</Link>
        </aside>
      </section>

      <section className="mt-14" aria-labelledby="latest-news-heading">
        <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">The daily brief</p>
            <h2 id="latest-news-heading" className="mt-2 text-2xl font-semibold tracking-tight">Latest from the culture feed</h2>
          </div>
          <label className="flex items-center gap-2 text-sm text-black/60">
            <span className="sr-only">Search news</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stories" className="w-full rounded-md border border-black/15 bg-white px-3 py-2 outline-none ring-accent focus:ring-2 sm:w-48" />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter news by topic">
          {NEWS_TOPICS.map((item) => (
            <button key={item} type="button" onClick={() => setTopic(item)} aria-pressed={topic === item} className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${topic === item ? "border-accent bg-accent text-white" : "border-black/15 bg-white text-black/60 hover:border-accent hover:text-accent"}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filteredStories.length > 0 ? filteredStories.map((story) => (
            <article key={story.id} className="card border border-black/10 bg-white p-5 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-wide text-black/40">
                <span>{story.topic}</span><time dateTime={story.publishedAt}>{formatNewsDate(story.publishedAt)}</time>
              </div>
              <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight"><a href={story.url} target="_blank" rel="noreferrer" className="hover:text-accent">{story.title}</a></h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-black/60">{story.description}</p>
              <p className="mt-4 text-xs text-black/40">Source: {story.source}</p>
            </article>
          )) : <p className="text-sm text-black/60">No stories match that search yet.</p>}
        </div>
      </section>

      <section className="mt-14" aria-labelledby="guides-heading">
        <div className="flex items-end justify-between border-b border-black/10 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Practical reads</p><h2 id="guides-heading" className="mt-2 text-2xl font-semibold tracking-tight">Guides for better publishing</h2></div><span className="text-sm text-black/40">{posts.length} guides</span></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">{posts.slice(0, 4).map((post) => <article key={post.slug} className="card border border-black/10 bg-white p-5"><p className="text-xs text-black/40">{post.readingMinutes} min read</p><h3 className="mt-2 text-lg font-semibold"><Link href={`/blog/${post.slug}`} className="hover:text-accent">{post.title}</Link></h3><p className="mt-2 text-sm leading-relaxed text-black/60">{post.description}</p></article>)}</div>
      </section>
    </>
  );
}
