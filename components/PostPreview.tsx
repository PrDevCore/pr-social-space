"use client";

import { useMemo, useState, useDeferredValue, memo } from "react";
import type { SocialAccount, SocialPlatform } from "@/lib/zernio";
import { PLATFORMS } from "./PlatformIcon";

const LIMITS: Partial<Record<SocialPlatform, number>> = {
  twitter: 280,
  threads: 500,
  bluesky: 300,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  tiktok: 2200,
  youtube: 5000,
  pinterest: 500,
};

function isImageUrl(url: string) {
  return /\.(jpe?g|png|gif|webp|avif|svg|bmp|ico)$/i.test(url);
}

function fmtDate() {
  return new Date().toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Avatar({
  account,
  size,
  ring,
}: {
  account: SocialAccount;
  size: number;
  ring?: boolean;
}) {
  const initials = (account.display_name ?? account.username ?? account.id)
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const base = `rounded-full object-cover ${ring ? "ring-2 ring-white" : ""}`;
  return account.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={account.avatar_url}
      alt=""
      style={{ width: size, height: size }}
      className={base}
    />
  ) : (
    <span
      style={{ width: size, height: size, fontSize: size / 2.4 }}
      className={`flex items-center justify-center font-semibold text-white ${base}`}
    >
      {initials}
    </span>
  );
}

/* ------------------------- Caption with highlights ------------------------ */

function Caption({
  text,
  boldPrefix,
  highlightHashtags,
}: {
  text: string;
  boldPrefix?: string;
  highlightHashtags?: boolean;
}) {
  const parts = useMemo(() => {
    if (!highlightHashtags) return [text];
    return text.split(/(\s+)/).map((tok, i) =>
      /^[#@]\w+/.test(tok) ? (
        <span key={i} className="font-semibold text-[#0a66c2]">
          {tok}
        </span>
      ) : (
        <span key={i}>{tok}</span>
      )
    );
  }, [text, highlightHashtags]);

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed">
      {boldPrefix && <span className="font-semibold">{boldPrefix} </span>}
      {parts}
    </p>
  );
}

/* --------------------------------- Media ---------------------------------- */

function MediaBlock({
  mediaUrls,
  aspect,
  rounded,
}: {
  mediaUrls: string[];
  aspect: string;
  rounded?: boolean;
}) {
  const first = mediaUrls[0];
  const isImage = first ? isImageUrl(first) : false;
  const radius = rounded === false ? "" : "rounded-xl";

  if (!first) return null;

  return (
    <div className={`relative overflow-hidden bg-black/5 ${radius}`}>
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={first}
          alt=""
          style={{ aspectRatio: aspect }}
          className="w-full object-cover"
        />
      ) : (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          src={first}
          controls
          style={{ aspectRatio: aspect }}
          className="w-full bg-black object-contain"
        />
      )}
      {mediaUrls.length > 1 && (
        <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1">
          {mediaUrls.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full ${
                i === 0 ? "w-4 bg-white" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
      {mediaUrls.length > 1 && (
        <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
          1/{mediaUrls.length}
        </span>
      )}
    </div>
  );
}

/* ---------------------------- Platform previews --------------------------- */

function InstagramPreview({
  caption,
  mediaUrls,
  account,
}: {
  caption: string;
  mediaUrls: string[];
  account: SocialAccount;
}) {
  return (
    <div className="border border-black/10 bg-white">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Avatar account={account} size={30} />
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold">
          {account.display_name ?? account.username ?? "Account"}
        </p>
        <button className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-white">
          Follow
        </button>
      </div>
      <MediaBlock mediaUrls={mediaUrls} aspect="4 / 5" />
      <div className="space-y-2 px-3 py-2.5">
        <div className="flex items-center gap-4 text-[22px]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </div>
        <p className="text-[13px] font-medium">
          {mediaUrls.length + 7}.{String((mediaUrls.length * 3) % 10).padStart(1, "0")}K likes
        </p>
        <Caption text={caption || "Your caption will appear here."} boldPrefix={`${account.username ?? "you"}`} />
        <p className="text-[11px] uppercase text-black/40">{fmtDate()}</p>
      </div>
    </div>
  );
}

function TwitterPreview({
  caption,
  mediaUrls,
  account,
}: {
  caption: string;
  mediaUrls: string[];
  account: SocialAccount;
}) {
  return (
    <div className="border border-black/10 bg-white">
      <div className="flex items-start gap-3 p-3.5">
        <Avatar account={account} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-[15px] font-bold">
              {account.display_name ?? account.username ?? "Account"}
            </span>
            <svg className="h-4 w-4 shrink-0 fill-sky-500" viewBox="0 0 24 24">
              <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67 2.88 13.43 2 12 2s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81S3.53 7.27 3.99 8.66C2.88 9.33 2 10.57 2 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z" />
            </svg>
            <span className="truncate text-sm text-black/50">
              @{account.username ?? "user"}
            </span>
            <span className="text-sm text-black/40">· {fmtDate()}</span>
          </div>
          <div className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">
            {caption || "Your post text will appear here."}
          </div>
          {mediaUrls.length > 0 && (
            <div className="mt-3">
              <MediaBlock mediaUrls={mediaUrls} aspect="16 / 9" />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-8 border-t border-black/5 px-4 py-2.5 text-[13px] text-black/50">
        <span className="flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {mediaUrls.length * 2}
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {caption.length * 3}
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {mediaUrls.length * 12}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {caption.length * 2}K
        </span>
      </div>
    </div>
  );
}

function FacebookPreview({
  caption,
  mediaUrls,
  account,
}: {
  caption: string;
  mediaUrls: string[];
  account: SocialAccount;
}) {
  return (
    <div className="border border-black/10 bg-white">
      <div className="flex items-center gap-2.5 p-3">
        <Avatar account={account} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">
            {account.display_name ?? account.username ?? "Account"}
          </p>
          <p className="text-xs text-black/50">Just now · 🌐</p>
        </div>
        <svg className="h-5 w-5 text-black/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      </div>
      <p className="whitespace-pre-wrap px-3 pb-3 text-[15px] leading-relaxed">
        {caption || "Your post text will appear here."}
      </p>
      <MediaBlock mediaUrls={mediaUrls} aspect="16 / 9" />
      <div className="flex items-center justify-between px-4 py-2 text-[13px] text-black/50">
        <span>👍 {mediaUrls.length * 4}</span>
        <span>{mediaUrls.length * 2} comments · {mediaUrls.length} shares</span>
      </div>
      <div className="grid grid-cols-3 gap-1 border-t border-black/10 px-2 py-1.5 text-[13px] font-medium text-black/60">
        <button className="flex items-center justify-center gap-1.5 rounded-md py-1.5 hover:bg-black/5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          Like
        </button>
        <button className="flex items-center justify-center gap-1.5 rounded-md py-1.5 hover:bg-black/5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comment
        </button>
        <button className="flex items-center justify-center gap-1.5 rounded-md py-1.5 hover:bg-black/5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
      </div>
    </div>
  );
}

function LinkedInPreview({
  caption,
  mediaUrls,
  account,
}: {
  caption: string;
  mediaUrls: string[];
  account: SocialAccount;
}) {
  return (
    <div className="border border-black/10 bg-white">
      <div className="flex items-center gap-3 p-3.5">
        <Avatar account={account} size={48} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">
            {account.display_name ?? account.username ?? "Account"}
          </p>
          <p className="truncate text-xs text-black/50">1st · Just now · 🌐</p>
        </div>
        <svg className="h-5 w-5 text-black/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      </div>
      <div className="px-3.5 pb-3 text-sm leading-relaxed">
        <Caption text={caption || "Your post text will appear here."} highlightHashtags />
      </div>
      <MediaBlock mediaUrls={mediaUrls} aspect="16 / 9" />
      <div className="flex items-center gap-6 border-t border-black/10 px-4 py-2 text-[13px] text-black/50">
        <span className="flex items-center gap-1.5">
          <span className="flex -space-x-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[8px] text-white">👍</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">❤</span>
          </span>
          {mediaUrls.length * 8}
        </span>
        <span>{mediaUrls.length * 3} comments</span>
        <span>{mediaUrls.length} reposts</span>
      </div>
      <div className="grid grid-cols-3 gap-1 border-t border-black/10 px-2 py-1.5 text-[13px] font-medium text-black/60">
        <button className="flex items-center justify-center gap-1.5 rounded-md py-1.5 hover:bg-black/5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          Like
        </button>
        <button className="flex items-center justify-center gap-1.5 rounded-md py-1.5 hover:bg-black/5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comment
        </button>
        <button className="flex items-center justify-center gap-1.5 rounded-md py-1.5 hover:bg-black/5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Repost
        </button>
      </div>
    </div>
  );
}

function YouTubePreview({
  caption,
  mediaUrls,
  account,
}: {
  caption: string;
  mediaUrls: string[];
  account: SocialAccount;
}) {
  const title = caption.split("\n")[0] || "Your video title will appear here.";
  return (
    <div className="border border-black/10 bg-white">
      <div className="relative overflow-hidden bg-black/5">
        {mediaUrls.length > 0 ? (
          <div className="relative">
            <MediaBlock mediaUrls={mediaUrls} aspect="16 / 9" rounded={false} />
            <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
              0:0{Math.max(1, mediaUrls.length)} / {mediaUrls.length}:0{mediaUrls.length}
            </span>
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-black/5">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white">
              <svg className="ml-0.5 h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </div>
        )}
      </div>
      <div className="flex items-start gap-3 p-3">
        <Avatar account={account} size={36} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[14px] font-medium leading-snug">{title}</p>
          <p className="mt-0.5 text-xs text-black/50">
            {account.display_name ?? account.username ?? "Channel"} · 1.2K views · {fmtDate()}
          </p>
        </div>
      </div>
    </div>
  );
}

function TikTokPreview({
  caption,
  mediaUrls,
  account,
}: {
  caption: string;
  mediaUrls: string[];
  account: SocialAccount;
}) {
  return (
    <div className="flex gap-3 border border-black/10 bg-white p-3">
      <div className="w-[200px] shrink-0 overflow-hidden rounded-xl bg-black/5">
        {mediaUrls.length > 0 ? (
          <div className="relative">
            <MediaBlock mediaUrls={mediaUrls} aspect="9 / 16" rounded={false} />
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Playing
            </span>
          </div>
        ) : (
          <div className="flex aspect-[9/16] items-center justify-center text-xs text-black/40">
            No video
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5">
          <Avatar account={account} size={30} />
          <p className="truncate text-[13px] font-semibold">
            @{account.username ?? "user"}
          </p>
        </div>
        <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-[13px] leading-relaxed">
          {caption || "Your caption will appear here."}
        </p>
        <div className="mt-auto flex flex-col gap-2.5 pt-3 text-black/60">
          {[
            ["M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", `${caption.length * 2}`],
            ["M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", `${caption.length}`],
            ["M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z", `${mediaUrls.length * 6}`],
            ["M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125", `${mediaUrls.length * 3}`],
          ].map(([d, count], i) => (
            <div key={i} className="flex items-center gap-2">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={d} />
              </svg>
              <span className="text-xs">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GenericPreview({
  caption,
  mediaUrls,
  account,
}: {
  caption: string;
  mediaUrls: string[];
  account: SocialAccount;
}) {
  const meta = PLATFORMS.find((p) => p.id === account.platform);
  return (
    <div className="border border-black/10 bg-white">
      <div className="flex items-center gap-3 p-3.5">
        <Avatar account={account} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">
            {account.display_name ?? account.username ?? "Account"}
          </p>
          <p className="text-xs text-black/50">
            {meta?.label ?? account.platform} · Just now
          </p>
        </div>
      </div>
      <p className="whitespace-pre-wrap px-3.5 pb-3 text-sm leading-relaxed">
        {caption || "Your post text will appear here."}
      </p>
      {mediaUrls.length > 0 && (
        <MediaBlock mediaUrls={mediaUrls} aspect="16 / 9" />
      )}
    </div>
  );
}

/* ------------------------------- Main panel ------------------------------- */

export default function PostPreview({
  caption,
  mediaUrls,
  accounts,
  scheduleAt,
}: {
  caption: string;
  mediaUrls: string[];
  accounts: SocialAccount[];
  scheduleAt: string;
}) {
  const platforms = accounts
    .map((a) => a.platform)
    .filter((v, i, arr) => arr.indexOf(v) === i);
  const [active, setActive] = useState<SocialPlatform | null>(
    accounts[0]?.platform ?? null
  );
  const current = accounts.find((a) => a.platform === active) ?? accounts[0];

  const deferredCaption = useDeferredValue(caption);

  const limit = active ? LIMITS[active] : undefined;
  const overLimit = typeof limit === "number" && deferredCaption.length > limit;
  const within = deferredCaption.length > 0 && !overLimit && deferredCaption.trim().length > 0;

  if (accounts.length === 0) {
    return (
      <div className="card space-y-2">
        <p className="text-sm font-medium">Live preview</p>
        <p className="text-sm text-black/50">
          Select at least one account to preview your post.
        </p>
      </div>
    );
  }

  const render =
    active === "instagram" ? (
      <InstagramPreview caption={deferredCaption} mediaUrls={mediaUrls} account={current} />
    ) : active === "twitter" ? (
      <TwitterPreview caption={deferredCaption} mediaUrls={mediaUrls} account={current} />
    ) : active === "facebook" ? (
      <FacebookPreview caption={deferredCaption} mediaUrls={mediaUrls} account={current} />
    ) : active === "linkedin" ? (
      <LinkedInPreview caption={deferredCaption} mediaUrls={mediaUrls} account={current} />
    ) : active === "youtube" ? (
      <YouTubePreview caption={deferredCaption} mediaUrls={mediaUrls} account={current} />
    ) : active === "tiktok" ? (
      <TikTokPreview caption={deferredCaption} mediaUrls={mediaUrls} account={current} />
    ) : (
      <GenericPreview caption={deferredCaption} mediaUrls={mediaUrls} account={current} />
    );

  return (
    <div className="space-y-3 lg:sticky lg:top-6 lg:self-start">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Live preview</p>
{typeof limit === "number" && (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              overLimit
                ? "bg-red-50 text-red-600"
                : within
                ? "bg-green-50 text-green-700"
                : "bg-black/5 text-black/50"
            }`}
          >
            {deferredCaption.length}/{limit}
          </span>
        )}
      </div>

      <div role="tablist" className="flex flex-wrap gap-1 rounded-xl border border-black/10 bg-white p-1">
        {platforms.map((p) => {
          const meta = PLATFORMS.find((x) => x.id === p);
          const count = accounts.filter((a) => a.platform === p).length;
          return (
            <button
              key={p}
              role="tab"
              onClick={() => setActive(p)}
              aria-selected={active === p}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                active === p
                  ? "bg-ink text-white"
                  : "text-black/60 hover:bg-black/5"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: meta?.color }}
              />
              {meta?.label ?? p}
              {count > 1 && <span className="opacity-70">×{count}</span>}
            </button>
          );
        })}
      </div>

      {overLimit && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          Over the {LIMITS[active!]} character limit for this platform.
        </p>
      )}

      {scheduleAt && (
        <p className="rounded-lg bg-black/5 px-3 py-2 text-xs text-black/60">
          Scheduled for{" "}
          {new Date(scheduleAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      )}

      {render}
    </div>
  );
}
