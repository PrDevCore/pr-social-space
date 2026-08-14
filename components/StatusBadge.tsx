"use client";

export type StatusTone = "optimal" | "attention" | "error";

const STYLES: Record<StatusTone, string> = {
  optimal:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
  attention:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
  error:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
};

const LABELS: Record<StatusTone, string> = {
  optimal: "Optimal",
  attention: "Needs Attention",
  error: "Error",
};

/**
 * Small status pill: green "Optimal", orange "Needs Attention", red "Error".
 * Include a live dot so screen readers announce state changes via aria-live.
 */
export default function StatusBadge({
  tone,
  label,
}: {
  tone: StatusTone;
  label?: string;
}) {
  const dot = {
    optimal: "bg-green-500",
    attention: "bg-amber-500",
    error: "bg-red-500",
  }[tone];

  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STYLES[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {label ?? LABELS[tone]}
    </span>
  );
}