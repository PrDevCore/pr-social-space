import Link from "next/link";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <article className="mx-auto flex max-w-3xl flex-col gap-8 leading-7">
        <header className="flex flex-col gap-3"><Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Social Hub</Link><h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1><p className="text-muted-foreground">Last updated: September 6, 2026</p></header>
        <section><h2 className="text-xl font-semibold">What we collect</h2><p>We collect account details, social connection information, content you submit, billing records, support messages, and technical information needed to secure and operate Social Hub.</p></section>
        <section><h2 className="text-xl font-semibold">How we use information</h2><p>We use information to provide the dashboard, publish and schedule content at your direction, process subscriptions, prevent abuse, provide support, improve reliability, and comply with law. We do not sell personal information.</p></section>
        <section><h2 className="text-xl font-semibold">Connected services and advertising</h2><p>When you connect a social network, we process data under your instructions and that provider&apos;s terms. With your permission, Google AdSense and Adcash may use cookies or similar technologies to measure and personalize advertising. You can reject optional cookies or change your choice through the Cookie & Advertising Policy.</p></section>
        <section><h2 className="text-xl font-semibold">Retention and security</h2><p>We retain information only as needed for the purposes described here, legal obligations, dispute resolution, and enforcement. We use access controls and appropriate technical safeguards, but no internet service is completely secure.</p></section>
        <section><h2 className="text-xl font-semibold">Your choices</h2><p>You may access, correct, export, or request deletion of personal information, withdraw optional advertising consent, and disconnect social accounts. See <Link href="/data-rights" className="underline underline-offset-4">your data rights</Link> for contact instructions.</p></section>
        <p className="text-sm text-muted-foreground">This policy is a general implementation baseline and is not legal advice. Have it reviewed for your entity, users, and applicable jurisdictions.</p>
      </article>
    </main>
  );
}
