import Link from "next/link";

export default function LegalFooter() {
  return (
    <footer className="border-t border-border bg-background px-6 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Social Hub. All rights reserved.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Legal navigation">
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/cookies" className="hover:text-foreground">Cookies & ads</Link>
          <Link href="/data-rights" className="hover:text-foreground">Data rights</Link>
        </nav>
      </div>
    </footer>
  );
}
