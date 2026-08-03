import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  ensureProfileForUser,
  getInboxPostComments,
  hideComment,
  likeComment,
  listInboxComments,
  listInboxConversations,
  listInboxMentions,
  privateReplyComment,
  replyToComment,
  replyToMention,
  sendDmMessage,
} from "@/lib/zernio";

/**
 * Unified smart inbox.
 *
 * GET  /api/social/inbox            -> { comments, conversations, mentions, hasInboxAccess }
 * GET  /api/social/inbox?postId=X&accountId=Y
 *                                   -> comments for a single post
 * POST /api/social/inbox            -> route an action by { action }:
 *       reply-comment | like-comment | hide-comment | private-reply |
 *       send-dm | reply-mention
 */

function isAddonError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err);
  return msg.includes("403") && /addon|add-on|required/i.test(msg);
}

function addonResponse() {
  return NextResponse.json(
    {
      error: "The Zernio inbox add-on isn't enabled for this account.",
      code: "inbox_addon_required",
      requiresAddon: true,
    },
    { status: 403 }
  );
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const postId = searchParams.get("postId");
  const accountId = searchParams.get("accountId");

  try {
    const profileId = await ensureProfileForUser(user.id);

    // Single-post comments view (drilled in from a comment summary).
    if (postId && accountId) {
      const data = await getInboxPostComments(postId, accountId);
      return NextResponse.json(data);
    }

    const [comments, conversations, mentions] = await Promise.all([
      listInboxComments(profileId),
      listInboxConversations(profileId),
      listInboxMentions(profileId),
    ]);

    return NextResponse.json({
      comments: comments.data ?? [],
      conversations: conversations.data ?? [],
      mentions: mentions.data ?? [],
      hasInboxAccess: true,
    });
  } catch (err) {
    console.error(err);
    if (isAddonError(err)) return addonResponse();
    return NextResponse.json(
      { error: "Failed to load inbox" },
      { status: 502 }
    );
  }
}

const ACTIONS = [
  "reply-comment",
  "like-comment",
  "hide-comment",
  "private-reply",
  "send-dm",
  "reply-mention",
] as const;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = body.action as string;
  if (!ACTIONS.includes(action as (typeof ACTIONS)[number])) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    await ensureProfileForUser(user.id);

    switch (action) {
      case "reply-comment": {
        if (!body.postId || !body.message) {
          return NextResponse.json({ error: "postId and message are required" }, { status: 400 });
        }
        const data = await replyToComment(String(body.postId), {
          accountId: String(body.accountId),
          message: String(body.message),
          commentId: body.commentId ? String(body.commentId) : undefined,
        });
        return NextResponse.json(data);
      }
      case "like-comment": {
        const data = await likeComment(
          String(body.postId),
          String(body.commentId),
          String(body.accountId)
        );
        return NextResponse.json(data);
      }
      case "hide-comment": {
        const data = await hideComment(
          String(body.postId),
          String(body.commentId),
          String(body.accountId)
        );
        return NextResponse.json(data);
      }
      case "private-reply": {
        const data = await privateReplyComment(String(body.postId), String(body.commentId), {
          accountId: String(body.accountId),
          message: String(body.message),
        });
        return NextResponse.json(data);
      }
      case "send-dm": {
        if (!body.conversationId || !body.message) {
          return NextResponse.json(
            { error: "conversationId and message are required" },
            { status: 400 }
          );
        }
        const data = await sendDmMessage(String(body.conversationId), {
          accountId: String(body.accountId),
          message: String(body.message),
        });
        return NextResponse.json(data);
      }
      case "reply-mention": {
        if (!body.mediaId || !body.message) {
          return NextResponse.json({ error: "mediaId and message are required" }, { status: 400 });
        }
        const data = await replyToMention({
          accountId: String(body.accountId),
          mediaId: String(body.mediaId),
          message: String(body.message),
        });
        return NextResponse.json(data);
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    console.error(err);
    if (isAddonError(err)) return addonResponse();
    return NextResponse.json(
      { error: `Failed to ${action}` },
      { status: 502 }
    );
  }
}
