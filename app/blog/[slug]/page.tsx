import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllPosts,
  getPostBySlug,
  postJsonLd,
  breadcrumbJsonLd,
} from "@/lib/blog";

interface Params {
  slug: string;
}

export function generateStaticParams(): Params[] {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getAllPosts().filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="bg-paper text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd(post)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              { name: post.title, path: `/blog/${post.slug}` },
            ])
          ),
        }}
      />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/blog" className="text-sm font-medium text-accent hover:underline">
          ← All guides
        </Link>

        <header className="mt-6">
          <time
            className="text-xs font-medium uppercase tracking-wide text-black/40"
            dateTime={post.date}
          >
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            · {post.readingMinutes} min read
          </time>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-black/60">{post.description}</p>
        </header>

        <article className="mt-8 space-y-5">
          {post.blocks.map((block, i) => {
            switch (block.type) {
              case "h2":
                return (
                  <h2 key={i} className="pt-4 text-2xl font-semibold tracking-tight">
                    {block.text}
                  </h2>
                );
              case "h3":
                return (
                  <h3 key={i} className="text-lg font-semibold tracking-tight">
                    {block.text}
                  </h3>
                );
              case "ul":
                return (
                  <ul key={i} className="list-disc space-y-1.5 pl-6 text-[15px] leading-relaxed text-black/75">
                    {block.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                );
              case "quote":
                return (
                  <blockquote
                    key={i}
                    className="border-l-4 border-accent/40 bg-accent/5 px-5 py-3 text-[15px] italic text-black/70"
                  >
                    {block.text}
                  </blockquote>
                );
              case "cta":
                return (
                  <div key={i} className="card my-6 flex flex-col items-center gap-3 p-6 text-center">
                    <p className="font-medium">{block.text}</p>
                    <Link href={block.href} className="btn-primary">
                      {block.label}
                    </Link>
                  </div>
                );
              default:
                return (
                  <p key={i} className="text-[15px] leading-relaxed text-black/75">
                    {(block as { text: string }).text}
                  </p>
                );
            }
          })}
        </article>

        <section className="mt-12 border-t border-black/10 pt-8">
          <h2 className="mb-4 text-xl font-semibold tracking-tight">Keep reading</h2>
          <ul className="space-y-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/blog/${r.slug}`} className="font-medium text-accent hover:underline">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-black/10 bg-white py-8 text-center text-sm text-black/50">
        © {new Date().getFullYear()} Social Hub ·{" "}
        <Link href="/" className="hover:text-black">Home</Link>
        {" · "}
        <Link href="/auth/register" className="hover:text-black">Start free</Link>
      </footer>
    </div>
  );
}
