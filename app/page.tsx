import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";
import ThemeToggle from "@/components/ThemeToggle";
import RegionToggle from "@/components/RegionToggle";
import AnimatedMockup from "@/components/landing/AnimatedMockup";
import MetricsCounter from "@/components/landing/MetricsCounter";
import PricingSection from "@/components/landing/PricingSection";

// If the user already has a session, skip straight to /dashboard.
export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const metrics = [
    { value: 48000, compact: true, label: "Accounts managed" },
    { value: 2400000, compact: true, label: "Posts published" },
    { value: 86000000, compact: true, label: "Engagements driven" },
    { value: 3200, compact: true, label: "Brands onboard" },
  ];

  const features = [
    {
      title: "Compose everywhere",
      body: "Write once, publish to TikTok, Instagram, X, LinkedIn, YouTube and more from a single composer with a live platform-accurate preview.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      title: "AI writing assistant",
      body: "Generate captions from your media, pull ready-to-publish hashtags, and re-tone posts per platform with Gemini.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
    },
    {
      title: "Unified smart inbox",
      body: "Comments, DMs and mentions from every network in one place. Reply, like and hide across platforms without tab-hopping.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      title: "Visual content calendar",
      body: "See your whole month on a drag-and-drop calendar. Move scheduled posts by dragging, with best-time slots surfaced automatically.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
        </svg>
      ),
    },
    {
      title: "Analytics & PDF reports",
      body: "Impressions, reach and engagement-rate dashboards, best-time heatmaps, and white-label PDF reports you can send straight to clients.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: "Competitor tracking",
      body: "Manually track competitor follower growth and compare it against your own accounts on a shared chart.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M12 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  const steps = [
    {
      title: "Connect your accounts",
      body: "One-click OAuth for every major network. No API keys to manage, no spreadsheets to maintain.",
    },
    {
      title: "Compose with confidence",
      body: "Preview every post exactly how it will render on each platform, with AI help for captions and hashtags.",
    },
    {
      title: "Publish, engage, report",
      body: "Schedule on a visual calendar, answer every comment from one inbox, then export client-ready PDF reports.",
    },
  ];

  const faqs = [
    {
      q: "Which platforms do you support?",
      a: "TikTok, Instagram, Facebook, X (Twitter), LinkedIn, YouTube, Pinterest, Threads and Bluesky, all through Zernio's unified API. You'll see only the platforms that are available for your connected accounts.",
    },
    {
      q: "Is my data safe?",
      a: "Yes. Passwords are hashed with scrypt, sessions are opaque tokens stored server-side, and your Zernio API key never leaves the server. Only the accounts you explicitly connect are reachable.",
    },
    {
      q: "Do I need an API key or developer account?",
      a: "No. You connect your social accounts with a standard OAuth flow. Everything happens in your dashboard.",
    },
    {
      q: "Can I upgrade or change plans later?",
      a: "Yes. From your profile you can upgrade to Pro with secure Flutterwave payments, billed in USD, NGN or GBP depending on your region. Pro and Team unlock more accounts, PDF reports, best-time recommendations and more seats.",
    },
  ];

  const faqsLd = faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  }));

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Social Hub",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description:
        "Compose, schedule, engage and report across every major social network from one dashboard.",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Social Hub",
      url: SITE_URL,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqsLd,
    },
  ];

  return (
    <div className="bg-paper text-ink">
      {structuredData.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
      {/* Sticky nav */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/80 backdrop-blur [&_button]:!border-black/40 [&_button]:!text-black [&_button]:hover:!bg-black/5 [&_svg]:!text-black">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-black">
            <Image src="/logo.png" alt="Social Hub logo" width={32} height={32} className="h-8 w-8 rounded-lg" />
            Social Hub
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-black md:flex">
            <a href="#features" className="hover:text-black/70">Features</a>
            <a href="#how-it-works" className="hover:text-black/70">How it works</a>
            <a href="#pricing" className="hover:text-black/70">Pricing</a>
            <a href="#faq" className="hover:text-black/70">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <RegionToggle />
            <Link
              href="/auth/login"
              className="hidden rounded-xl border border-black px-3.5 py-1.5 text-sm font-medium text-black transition hover:bg-black/5 sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="rounded-xl border border-black bg-black px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-black/80"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            All systems online
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            One dashboard. Every social account.{" "}
            <span className="text-accent">One click to post.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-black/60">
            Connect TikTok, Instagram, X, LinkedIn and more via Zernio, then compose,
            schedule, engage and report from a single workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/register" className="btn-primary">
              Start free — no card required
            </Link>
            <a href="#how-it-works" className="btn-secondary">
              See how it works
            </a>
          </div>
          <p className="mt-3 text-xs text-black/40">
            Free plan: 2 connected accounts · 100 posts/month
          </p>
        </div>
        <AnimatedMockup />
      </section>

      {/* Metrics band */}
      <MetricsCounter metrics={metrics} />

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Everything your social team needs</h2>
          <p className="mt-3 text-black/60">
            Built on one unified API, so your tools work together instead of against each other.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card group transition-shadow hover:shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm text-black/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Up and running in minutes</h2>
            <p className="mt-3 text-black/60">No code, no API keys, no migration headaches.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm text-black/60">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Simple, transparent pricing</h2>
          <p className="mt-3 text-black/60">
            Start free and upgrade when you&apos;re ready. Prices shown in your local
            currency, paid securely through Flutterwave.
          </p>
        </div>
        <PricingSection />
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-6 pb-20">
        <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-black/10 bg-white p-5 open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium">
                {f.q}
                <svg className="h-5 w-5 shrink-0 text-black/40 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-black/60">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-black/50 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Social Hub logo" width={24} height={24} className="rounded" />
            Social Hub
          </div>
          <p>Powered by Zernio · © {new Date().getFullYear()}</p>
          <nav className="flex gap-6">
            <a href="#features" className="hover:text-black">Features</a>
            <a href="#pricing" className="hover:text-black">Pricing</a>
            <Link href="/auth/login" className="hover:text-black">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
