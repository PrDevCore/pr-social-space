"use client";

import { useCallback, useEffect, useState } from "react";
import { PLATFORMS } from "@/components/PlatformIcon";

/* ------------------------------ types ------------------------------ */

interface CommentSummary {
  id: string;
  platform: string;
  accountId: string;
  accountUsername?: string;
  content?: string;
  picture?: string | null;
  permalink?: string | null;
  createdTime?: string;
  commentCount: number;
  likeCount?: number;
}

interface Comment {
  id: string;
  message: string;
  createdTime?: string;
  from?: { id: string; name: string; username?: string; picture?: string | null; isOwner?: boolean };
  likeCount?: number;
  replyCount?: number;
  platform?: string;
  url?: string | null;
  canReply?: boolean;
  canLike?: boolean;
  canHide?: boolean;
  isHidden?: boolean;
  isLiked?: boolean;
}

interface Conversation {
  id: string;
  platform: string;
  accountId: string;
  accountUsername?: string;
  participantName?: string;
  lastMessage?: string;
  unreadCount?: number | null;
  url?: string | null;
}

interface Mention {
  id: string;
  platform: string;
  accountId: string;
  accountUsername?: string;
  text?: string;
  url?: string | null;
  authorName?: string | null;
  authorUsername?: string | null;
  authorAvatar?: string | null;
}

type Tab = "comments" | "dms" | "mentions";

function Badge({ platform }: { platform: string }) {
  const meta = PLATFORMS.find((p) => p.id === platform);
  return (
    <span
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
      style={{ backgroundColor: meta?.color ?? "#475569" }}
      title={meta?.label ?? platform}
    >
      {(meta?.label ?? platform).slice(0, 1).toUpperCase()}
    </span>
  );
}

function formatTime(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/* ------------------------------ component ------------------------------ */

export default function InboxPanel() {
  const [tab, setTab] = useState<Tab>("comments");
  const [loading, setLoading] = useState(true);
  const [addonMissing, setAddonMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [comments, setComments] = useState<CommentSummary[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);

  const [openPost, setOpenPost] = useState<string | null>(null);
  const [openPostAccount, setOpenPostAccount] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  const [replyFor, setReplyFor] = useState<Record<string, string>>({});
  const [replyingKey, setReplyingKey] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAddonMissing(false);
    try {
      const res = await fetch("/api/social/inbox");
      if (res.status === 403) {
        setAddonMissing(true);
        setComments([]);
        setConversations([]);
        setMentions([]);
        return;
      }
      if (!res.ok) throw new Error("Failed to load inbox");
      const data = await res.json();
      setComments(data.comments ?? []);
      setConversations(data.conversations ?? []);
      setMentions(data.mentions ?? []);
    } catch (err) {
      console.error(err);
      setError("Couldn't load your inbox right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openThread = useCallback(async (summary: CommentSummary) => {
    setOpenPost(summary.id);
    setOpenPostAccount(summary.accountId);
    setLoadingThread(true);
    setPostComments([]);
    try {
      const res = await fetch(
        `/api/social/inbox?postId=${encodeURIComponent(summary.id)}&accountId=${encodeURIComponent(summary.accountId)}`
      );
      if (!res.ok) throw new Error("failed to load comments");
      const data = await res.json();
      setPostComments(data.comments ?? []);
    } catch (err) {
      console.error(err);
      setPostComments([]);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  async function runAction(
    action: string,
    payload: Record<string, string>,
    key: string
  ) {
    setBusy(key);
    setNotice(null);
    try {
      const res = await fetch("/api/social/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Action ${action} failed`);
      }
      setNotice("Done.");
      // Refresh the open thread if we just interacted with comments.
      if (openPost && openPostAccount && /comment/.test(action)) {
        const r = await fetch(
          `/api/social/inbox?postId=${encodeURIComponent(openPost)}&accountId=${encodeURIComponent(openPostAccount)}`
        );
        if (r.ok) {
          const d = await r.json();
          setPostComments(d.comments ?? []);
        }
      }
      setReplyFor((prev) => ({ ...prev, [key]: "" }));
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  if (addonMissing) {
    return (
      <div className="card">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold tracking-tight">Inbox add-on required</h3>
          <p className="mt-2 text-sm text-black/60">
            Unified inbox (comments, DMs and mentions) is available on this Zernio account&apos;s
            add-on plans. Enable it in your Zernio dashboard and come back — your other tools keep
            working in the meantime.
          </p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "comments", label: "Comments", count: comments.length },
    { id: "dms", label: "DMs", count: conversations.length },
    { id: "mentions", label: "Mentions", count: mentions.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-black/10 bg-white p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === t.id ? "bg-ink text-white" : "text-black/60 hover:bg-black/5"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 text-[11px] ${
                  tab === t.id ? "bg-white/20 text-white" : "bg-accent/10 text-accent"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
        {notice && <p className="text-sm text-green-700">{notice}</p>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="card text-sm text-black/50">Loading inbox…</div>
      ) : tab === "comments" ? (
        <div className="card">
          {comments.length === 0 ? (
            <p className="py-6 text-center text-sm text-black/50">
              No comments yet. Posts with activity will show up here.
            </p>
          ) : (
            <ul className="divide-y divide-black/5">
              {comments.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex items-start gap-3">
                    <Badge platform={c.platform} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">
                          {c.content ? (
                            <span className="line-clamp-2">{c.content}</span>
                          ) : (
                            <span className="text-black/50">Untitled post</span>
                          )}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-black/50">
                        {c.accountUsername ?? c.platform} · {formatTime(c.createdTime)} ·{" "}
                        {c.commentCount} comment{c.commentCount === 1 ? "" : "s"}
                        {typeof c.likeCount === "number" ? ` · ${c.likeCount} likes` : ""}
                      </p>
                      {c.permalink && (
                        <a
                          href={c.permalink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-accent hover:underline"
                        >
                          View on {c.platform} →
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openPost === c.id ? setOpenPost(null) : openThread(c)
                      }
                      className="shrink-0 rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium hover:bg-black/5"
                    >
                      {openPost === c.id ? "Close" : "Open thread"}
                    </button>
                  </div>

                  {openPost === c.id && (
                    <div className="mt-3 space-y-2 rounded-xl bg-black/[0.02] p-3">
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const msg = replyFor["post"] ?? "";
                          if (!msg.trim()) return;
                          runAction(
                            "reply-comment",
                            { postId: c.id, accountId: c.accountId, message: msg },
                            "post"
                          );
                        }}
                      >
                        <input
                          value={replyFor["post"] ?? ""}
                          onChange={(e) =>
                            setReplyFor((p) => ({ ...p, ["post"]: e.target.value }))
                          }
                          placeholder="Reply to this post…"
                          className="w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-accent"
                        />
                        <button
                          type="submit"
                          disabled={busy === "post" || !(replyFor["post"] ?? "").trim()}
                          className="btn-primary !px-3 !py-1.5 text-xs"
                        >
                          {busy === "post" ? "Sending…" : "Reply"}
                        </button>
                      </form>

                      {loadingThread ? (
                        <p className="text-sm text-black/50">Loading comments…</p>
                      ) : postComments.length === 0 ? (
                        <p className="text-sm text-black/50">No comments on this post yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {postComments.map((comment) => {
                            const key = comment.id;
                            return (
                              <li
                                key={key}
                                className="rounded-lg border border-black/10 bg-white p-3"
                              >
                                <div className="flex items-start gap-2.5">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5 text-[11px] font-semibold text-black/60">
                                    {(comment.from?.name ?? "?").slice(0, 1).toUpperCase()}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium">
                                        {comment.from?.name ?? "Unknown"}
                                      </p>
                                      <span className="text-xs text-black/40">
                                        {formatTime(comment.createdTime)}
                                      </span>
                                    </div>
                                    <p className="mt-0.5 text-sm text-black/70">
                                      {comment.message}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      {comment.canLike !== false && (
                                        <button
                                          type="button"
                                          disabled={busy === `${key}-like`}
                                          onClick={() =>
                                            runAction(
                                              "like-comment",
                                              { postId: c.id, commentId: key, accountId: c.accountId },
                                              `${key}-like`
                                            )
                                          }
                                          className="rounded-full border border-black/10 px-2 py-0.5 text-xs font-medium hover:bg-black/5 disabled:opacity-50"
                                        >
                                          {comment.isLiked ? "❤️ Liked" : "♡ Like"}
                                        </button>
                                      )}
                                      {comment.canHide !== false && (
                                        <button
                                          type="button"
                                          disabled={busy === `${key}-hide`}
                                          onClick={() =>
                                            runAction(
                                              "hide-comment",
                                              { postId: c.id, commentId: key, accountId: c.accountId },
                                              `${key}-hide`
                                            )
                                          }
                                          className="rounded-full border border-black/10 px-2 py-0.5 text-xs font-medium hover:bg-black/5 disabled:opacity-50"
                                        >
                                          {comment.isHidden ? "Hidden" : "Hide"}
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setReplyFor((p) => ({
                                            ...p,
                                            [key]: p[key] ?? "",
                                          }))
                                        }
                                        className="rounded-full border border-black/10 px-2 py-0.5 text-xs font-medium hover:bg-black/5"
                                      >
                                        Reply
                                      </button>
                                    </div>
                                    {replyFor[key] !== undefined && (
                                      <form
                                        className="mt-2 flex gap-2"
                                        onSubmit={(e) => {
                                          e.preventDefault();
                                          const msg = replyFor[key] ?? "";
                                          if (!msg.trim()) return;
                                          runAction(
                                            "reply-comment",
                                            {
                                              postId: c.id,
                                              commentId: key,
                                              accountId: c.accountId,
                                              message: msg,
                                            },
                                            `${key}-reply`
                                          );
                                        }}
                                      >
                                        <input
                                          value={replyFor[key]}
                                          onChange={(e) =>
                                            setReplyFor((p) => ({ ...p, [key]: e.target.value }))
                                          }
                                          placeholder="Write a reply…"
                                          className="w-full rounded-lg border border-black/10 bg-paper px-3 py-1.5 text-sm outline-none focus:border-accent"
                                        />
                                        <button
                                          type="submit"
                                          disabled={busy === `${key}-reply` || !replyFor[key].trim()}
                                          className="btn-primary !px-3 !py-1.5 text-xs"
                                        >
                                          {busy === `${key}-reply` ? "…" : "Reply"}
                                        </button>
                                      </form>
                                    )}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : tab === "dms" ? (
        <div className="card">
          {conversations.length === 0 ? (
            <p className="py-6 text-center text-sm text-black/50">
              No conversations yet. DMs from your connected messaging accounts will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-black/5">
              {conversations.map((conv) => {
                const key = conv.id;
                return (
                  <li key={key} className="py-3">
                    <div className="flex items-start gap-3">
                      <Badge platform={conv.platform} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">
                            {conv.participantName ?? conv.accountUsername ?? "Participant"}
                          </p>
                          {conv.unreadCount ? (
                            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">
                              {conv.unreadCount} unread
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-sm text-black/50">{conv.lastMessage}</p>
                      </div>
                    </div>
                    <form
                      className="mt-2 flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const msg = replyFor[key] ?? "";
                        if (!msg.trim()) return;
                        runAction(
                          "send-dm",
                          { conversationId: key, accountId: conv.accountId, message: msg },
                          `${key}-dm`
                        );
                      }}
                    >
                      <input
                        value={replyFor[key] ?? ""}
                        onChange={(e) => setReplyFor((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder="Send a message…"
                        className="w-full rounded-lg border border-black/10 bg-paper px-3 py-1.5 text-sm outline-none focus:border-accent"
                      />
                      <button
                        type="submit"
                        disabled={busy === `${key}-dm` || !(replyFor[key] ?? "").trim()}
                        className="btn-primary !px-3 !py-1.5 text-xs"
                      >
                        {busy === `${key}-dm` ? "…" : "Send"}
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="card">
          {mentions.length === 0 ? (
            <p className="py-6 text-center text-sm text-black/50">
              No mentions yet. Mentions of your connected accounts will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-black/5">
              {mentions.map((m) => (
                <li key={m.id} className="flex items-start gap-3 py-3">
                  <Badge platform={m.platform} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {m.authorName ?? m.authorUsername ?? "Someone"}
                    </p>
                    <p className="mt-0.5 text-sm text-black/70">{m.text}</p>
                    {m.url && (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-accent hover:underline"
                      >
                        View source →
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-black/40">
            Mentions are delivered via platform webhooks and currently cover LinkedIn.
          </p>
        </div>
      )}
    </div>
  );
}
