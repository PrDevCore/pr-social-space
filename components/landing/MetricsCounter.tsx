"use client";

import { useEffect, useRef, useState } from "react";

interface Metric {
  value: number;
  decimals?: number;
  suffix?: string;
  label: string;
  /** e.g. "48k" style formatting for large illustrative numbers. */
  compact?: boolean;
}

function formatNumber(value: number, opts: { compact?: boolean; decimals?: number }) {
  if (opts.compact) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return value.toLocaleString(undefined, {
    maximumFractionDigits: opts.decimals ?? 0,
  });
}

function Counter({ metric, started }: { metric: Metric; started: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!started) return;
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(metric.value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, metric.value]);

  return (
    <div className="text-center">
      <p className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {formatNumber(display, metric)}
        {metric.suffix}
      </p>
      <p className="mt-1 text-sm text-black/50">{metric.label}</p>
    </div>
  );
}

/**
 * Animated count-up stats band. Values are illustrative marketing figures —
 * there is no public data source pre-login.
 */
export default function MetricsCounter({
  metrics,
}: {
  metrics: Metric[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden border-y border-black/10 bg-white">
      <div className="pointer-events-none absolute -left-20 top-0 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-14 sm:grid-cols-4">
        {metrics.map((m) => (
          <Counter key={m.label} metric={m} started={started} />
        ))}
      </div>
      <p className="relative pb-6 text-center text-xs text-black/40">
        Illustrative platform-wide metrics
      </p>
    </section>
  );
}
