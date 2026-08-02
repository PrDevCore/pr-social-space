import Link from "next/link";
import { PLANS } from "@/lib/plans";

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function priceLabel(plan: (typeof PLANS)[number]) {
  if (plan.monthlyPrice === null) return "Custom";
  if (plan.monthlyPrice === 0) return "Free";
  return `$${plan.monthlyPrice}`;
}

function priceSub(plan: (typeof PLANS)[number]) {
  if (plan.monthlyPrice === null) return "per month, billed annually";
  if (plan.monthlyPrice === 0) return "forever, no card required";
  return "per month, billed annually";
}

export default function PricingSection() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PLANS.map((plan) => {
        const highlighted = plan.id === "free";
        return (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-2xl border p-6 ${
              highlighted
                ? "border-accent bg-white shadow-xl shadow-accent/10"
                : "border-black/10 bg-white"
            }`}
          >
            {highlighted && (
              <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-white">
                Get started
              </span>
            )}
            <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
            <p className="mt-1 text-sm text-black/50">{plan.tagline}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">{priceLabel(plan)}</span>
              {plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                <span className="text-sm text-black/40">/mo</span>
              )}
            </div>
            <p className="mt-1 text-xs text-black/40">{priceSub(plan)}</p>

            <ul className="mt-6 flex-1 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-black/70">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Link
                href="/auth/register"
                className={`block w-full ${highlighted ? "btn-primary" : "btn-secondary"}`}
              >
                {highlighted ? "Start free" : "Upgrade"}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
