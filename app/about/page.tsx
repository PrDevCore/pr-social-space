import type { Metadata } from "next";
import Link from "next/link";
import BackNav from "@/components/BackNav";

export const metadata: Metadata = {
  title: "About PR Social Hub",
  description: "Learn how PR DEV CORE TECH built PR Social Hub to make social media management clearer, faster, and more connected.",
  alternates: { canonical: "/about" },
};

const principles = [
  { mark: "01", title: "Clarity over complexity", text: "We turn scattered social workflows into one focused workspace that helps teams move with confidence." },
  { mark: "02", title: "Built for real work", text: "Every surface is designed around the daily rhythm of planning, publishing, engaging, and learning." },
  { mark: "03", title: "Trust by default", text: "We build with privacy, transparent controls, and dependable product experiences at the center." },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/70 bg-card/30 px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto flex max-w-6xl flex-col gap-12">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <BackNav fallback="/" label="Back" />
              <Link href="/" className="text-sm font-semibold tracking-tight text-foreground hover:text-primary">PR Social Hub</Link>
            </div>
            <Link href="/software" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">Our software <span aria-hidden="true">→</span></Link>
          </div>
          <div className="max-w-4xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">PR DEV CORE TECH</p>
            <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">We make technology feel more useful.</h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">PR DEV CORE TECH is an independent software company creating focused digital products for the way people work, publish, and connect online.</p>
          </div>
        </div>
      </section>
      <section className="px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Our point of view</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Small details. Serious outcomes.</h2>
          </div>
          <div className="flex flex-col gap-6 text-base leading-8 text-muted-foreground">
            <p>Good software should reduce noise, not add to it. We pair thoughtful interfaces with practical systems so the important work is easier to see and easier to finish.</p>
            <p>PR Social Hub is our social media command center: one place to compose, schedule, engage, and understand the content that moves your community forward.</p>
          </div>
        </div>
      </section>
      <section className="border-y border-border/70 bg-card/20 px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {principles.map(({ mark, title, text }) => <article key={title} className="rounded-2xl border border-border bg-background/70 p-6"><span className="font-mono text-xs font-semibold text-primary">{mark}</span><h2 className="mt-8 text-lg font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></article>)}
        </div>
      </section>
      <section className="px-6 py-20 sm:px-10 lg:px-16"><div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl bg-primary p-8 text-primary-foreground sm:p-12 lg:flex-row lg:items-end lg:justify-between"><div><span className="font-mono text-xs font-semibold uppercase tracking-[0.2em]">PR / CORE</span><h2 className="mt-6 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Build a clearer presence online.</h2></div><Link href="/auth/register" className="inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline">Try PR Social Hub <span aria-hidden="true">→</span></Link></div></section>
    </main>
  );
}
