import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, breadcrumbJsonLd } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog — Social media management guides",
  description:
    "Practical guides on scheduling posts, best posting times, AI captions and managing every social account from one dashboard.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Social Hub Blog — Social media management guides",
    description:
      "Guides on scheduling, best posting times, AI captions and multi-platform social media management.",
    url: "/blog",
  },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="bg-paper text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
            ])
          ),
        }}
      />
      <header className="brand-header border-b border-black/10 bg-[#d4a373]/60">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center">
          <Link href="/" className="text-sm font-medium text-accent hover:underline">
            ← Social Hub
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            The Social Hub blog
          </h1>
          <p className="mt-3 text-black/60">
            Guides on scheduling, posting times, AI captions and running every
            social account from one dashboard.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="space-y-6">
          {posts.map((post) => (
            <article key={post.slug} className="card transition-shadow hover:shadow-lg">
              <time className="text-xs font-medium uppercase tracking-wide text-black/40" dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                <Link href={`/blog/${post.slug}`} className="hover:text-accent">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-black/60">{post.description}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-black/40">
                <span>{post.readingMinutes} min read</span>
                <Link href={`/blog/${post.slug}`} className="font-medium text-accent hover:underline">
                  Read guide →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <section className="card mt-10 flex flex-col items-center gap-3 p-6 text-center">
          <h2 className="text-lg font-semibold tracking-tight">Ready to try it yourself?</h2>
          <p className="text-sm text-black/60">
            One dashboard for every social account — free plan included.
          </p>
          <Link href="/auth/register" className="btn-primary">
            Start free
          </Link>
        </section>
      </main>

      <footer className="border-t border-black/10 bg-white py-8 text-center text-sm text-black/50">
        © {new Date().getFullYear()} Social Hub · <Link href="/" className="hover:text-black">Home</Link>
        {" · "}
        <a href={`${SITE_URL}/rss.xml`} className="hover:text-black">RSS</a>
      </footer>
    </div>
  );
}
