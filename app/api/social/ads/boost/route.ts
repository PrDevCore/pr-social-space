import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  boostPost,
  ensureProfileForUser,
  listAccounts,
  listAllPosts,
  type BoostGoal,
  type BoostPostParams,
} from "@/lib/zernio";

// POST /api/social/ads/boost
// { postId, accountId, adAccountId, name, goal, budget:{amount,type}, currency?, ... }
// Creates a paid ad from an already-published post. Both the post and the
// social account are ownership-checked against the user's Zernio profile so
// users can never boost someone else's content or accounts.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Partial<BoostPostParams> & {
    goal?: string;
    budgetType?: string;
    budgetAmount?: number;
    startDate?: string;
    endDate?: string;
  };

  const postId = body.postId;
  const accountId = body.accountId;
  const adAccountId = body.adAccountId;
  const name = body.name?.trim();
  const goal = body.goal as BoostGoal;
  const budgetAmount = body.budgetAmount;
  const budgetType = body.budget?.type ?? body.budgetType;

  if (!postId || !accountId || !adAccountId || !name || !goal || !budgetAmount || !budgetType) {
    return NextResponse.json(
      {
        error:
          "postId, accountId, adAccountId, name, goal, budgetAmount and budgetType are required",
      },
      { status: 400 }
    );
  }

  const validGoals: BoostGoal[] = [
    "engagement",
    "traffic",
    "awareness",
    "video_views",
    "lead_generation",
    "conversions",
    "app_promotion",
  ];
  if (!validGoals.includes(goal) || !["daily", "lifetime"].includes(budgetType)) {
    return NextResponse.json({ error: "Invalid goal or budget type" }, { status: 400 });
  }

  try {
    const profileId = await ensureProfileForUser(user.id);

    // Ownership check: the social account must belong to this user.
    const ownedAccounts = await listAccounts(profileId);
    if (!ownedAccounts.some((a) => a.id === accountId)) {
      return NextResponse.json({ error: "Not your account" }, { status: 403 });
    }

    // Ownership check: the post being boosted must belong to this user.
    const userPosts = await listAllPosts(profileId, 500);
    if (!userPosts.some((p) => p.id === postId)) {
      return NextResponse.json({ error: "Not your post" }, { status: 403 });
    }

    const ad = await boostPost({
      postId,
      accountId,
      adAccountId,
      name,
      goal,
      budget: { amount: budgetAmount, type: budgetType as "daily" | "lifetime" },
      currency: body.currency,
      startDate: body.startDate,
      endDate: body.endDate,
      linkUrl: body.linkUrl,
      callToAction: body.callToAction,
      targeting: body.targeting,
    });

    return NextResponse.json({ ad }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to boost post" },
      { status: 502 }
    );
  }
}
