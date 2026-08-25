"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-[#3b2314] transition hover:bg-black/10"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full border-b border-black/10 bg-[#d4a373] shadow-lg backdrop-blur">
          <nav className="mx-auto flex max-w-6xl flex-col px-6 py-2">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-black/5 py-3.5 text-base font-medium text-[#3b2314] last:border-b-0 hover:text-black"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="py-3.5 text-base font-medium text-[#3b2314] hover:text-black"
            >
              Sign in
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
