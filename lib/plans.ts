export type PlanId = "free" | "pro" | "team";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** USD per month. null = "Contact us" pricing. */
  monthlyPrice: number | null;
  /** Max connected accounts. null = unlimited. */
  maxAccounts: number | null;
  /** Max posts per month. null = unlimited. */
  maxPostsPerMonth: number | null;
  seats: number;
  /** Full feature checklist shown on the pricing card. */
  features: string[];
  /** Short feature flags used for enforcement in API routes. */
  capability: {
    pdfReports: boolean;
    bestTime: boolean;
    analytics: boolean;
  };
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Kick the tires on one brand.",
    monthlyPrice: 0,
    maxAccounts: 2,
    maxPostsPerMonth: 100,
    seats: 1,
    capability: { pdfReports: false, bestTime: false, analytics: true },
    features: [
      "2 connected accounts",
      "100 posts per month",
      "Compose + live multi-platform preview",
      "AI caption assistant",
      "Unified smart inbox (comments, DMs, mentions)",
      "Basic analytics",
      "1 seat",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For growing teams that post daily.",
    monthlyPrice: 29,
    maxAccounts: 10,
    maxPostsPerMonth: null,
    seats: 3,
    capability: { pdfReports: true, bestTime: true, analytics: true },
    features: [
      "10 connected accounts",
      "Unlimited posts",
      "Everything in Free",
      "Best-time-to-post recommendations",
      "Downloadable PDF reports (white-label)",
      "Competitor tracking",
      "3 seats",
    ],
  },
  {
    id: "team",
    name: "Team",
    tagline: "Agencies and multi-brand teams.",
    monthlyPrice: null,
    maxAccounts: null,
    maxPostsPerMonth: null,
    seats: 10,
    capability: { pdfReports: true, bestTime: true, analytics: true },
    features: [
      "Unlimited connected accounts",
      "Unlimited posts",
      "Everything in Pro",
      "Multi-brand workspaces",
      "Priority support",
      "10 seats",
    ],
  },
];

export function getPlan(id: PlanId | null | undefined): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function getPlanForAccountCount(accountCount: number): Plan {
  for (const plan of PLANS) {
    if (plan.maxAccounts === null || accountCount <= plan.maxAccounts) return plan;
  }
  return PLANS[PLANS.length - 1];
}
