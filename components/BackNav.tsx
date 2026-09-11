"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BackNav({
  fallback = "/dashboard",
  label = "Back",
}: {
  fallback?: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      aria-label={`${label} to previous page`}
    >
      <span aria-hidden="true" className="text-lg leading-none">←</span>
      {label}
    </button>
  );
}

export function BackLink({
  href,
  label = "Back",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <span aria-hidden="true" className="text-lg leading-none">←</span>
      {label}
    </Link>
  );
}
