import type { Metadata } from "next";
import Link from "next/link";
import { BlogExplorer } from "@/components/BlogExplorer";
import { breadcrumbJsonLd, getAllPosts } from "@/lib/blog";
import { getLatestNews } from "@/lib/news";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog — Technology, entertainment and social media insights",
  description: "Fresh technology and entertainment news, plus practical social media guides for creators and growing teams.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "Social Hub Blog", description: "Fresh technology, entertainment and social media insights.", url: "/blog" },
};

export default async function BlogIndex() {
  const [posts, stories] = await Promise.all([Promise.resolve(getAllPosts()), getLatestNews()]);

  return (
    <div className="bg-paper text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])) }} />
      <header className="brand-header border-b border-black/10 bg-[#d4a373]/60">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <Link href="/" className="text-sm font-medium text-accent hover:underline">← Social Hub</Link>
          <div className="mt-8 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Signal over noise</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">What&apos;s moving the internet today.</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-black/65 sm:text-lg">A sharper mix of technology, entertainment and practical publishing ideas — updated for curious creators and teams.</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12"><BlogExplorer posts={posts} stories={stories} /></main>
      <footer className="border-t border-black/10 bg-white py-8 text-center text-sm text-black/50">© {new Date().getFullYear()} Social Hub · <Link href="/" className="hover:text-black">Home</Link>{" · "}<a href={`${SITE_URL}/rss.xml`} className="hover:text-black">RSS</a></footer>
    </div>
  );
}
