"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PLATFORMS } from "@/components/PlatformIcon";
import type { QueueSlot } from "@/lib/zernio";

interface CalPost {
  id: string;
  content: string;
  status: string;
  scheduledFor?: string;
  platforms: { platform: string; accountId: string }[];
}

interface CalendarData {
  posts: CalPost[];
  queueSlots: { id?: string; name?: string; slots?: QueueSlot[] }[];
  nextSlot: { scheduledFor?: string; timezone?: string } | null;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function localDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function timeLabel(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function weekStart(d: Date) {
  const out = new Date(d);
  const dow = (out.getDay() + 6) % 7; // Mon=0
  out.setDate(out.getDate() - dow);
  out.setHours(0, 0, 0, 0);
  return out;
}

export default function CalendarPanel() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/social/calendar");
      if (!res.ok) throw new Error("Failed to load calendar");
      setData(await res.json());
    } catch (err) {
      console.error(err);
      setError("Couldn't load your calendar right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + monthOffset);
    const year = base.getFullYear();
    const month = base.getMonth();
    const start = weekStart(base);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push(d);
    }
    return { year, month, cells };
  }, [monthOffset]);

  const postsByDate = useMemo(() => {
    const map = new Map<string, CalPost[]>();
    for (const p of data?.posts ?? []) {
      if (!p.scheduledFor) continue;
      const key = localDateKey(new Date(p.scheduledFor));
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [data]);

  const queueByWeekday = useMemo(() => {
    const set = new Set<number>();
    for (const q of data?.queueSlots ?? []) {
      for (const s of q.slots ?? []) set.add(s.dayOfWeek);
    }
    return set;
  }, [data]);

  async function reschedule(postId: string, target: Date) {
    setBusyKey(postId);
    setNotice(null);
    try {
      const existing = data?.posts.find((p) => p.id === postId);
      const keepTime = existing?.scheduledFor ? new Date(existing.scheduledFor) : null;
      const at = new Date(target);
      if (keepTime) {
        at.setHours(keepTime.getHours(), keepTime.getMinutes(), 0, 0);
      } else {
        at.setHours(9, 0, 0, 0);
      }
      const res = await fetch("/api/social/calendar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, scheduledFor: at.toISOString() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to reschedule");
      }
      setNotice(`Moved to ${localDateKey(at)} · ${timeLabel(at.toISOString())}.`);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to reschedule");
    } finally {
      setBusyKey(null);
      setDragId(null);
      setOverKey(null);
    }
  }

  async function cancelPost(postId: string) {
    setBusyKey(postId);
    setNotice(null);
    try {
      const res = await fetch("/api/social/schedules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      setNotice("Post cancelled.");
      await load();
    } catch {
      setNotice("Failed to cancel that post.");
    } finally {
      setBusyKey(null);
    }
  }

  const todayKey = localDateKey(new Date());
  const nextSlotLabel = data?.nextSlot?.scheduledFor
    ? new Date(data.nextSlot.scheduledFor).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthOffset((o) => o - 1)}
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm hover:bg-black/5"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold tracking-tight">
            {MONTHS[visible.month]} {visible.year}
          </h2>
          <button
            type="button"
            onClick={() => setMonthOffset((o) => o + 1)}
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm hover:bg-black/5"
          >
            →
          </button>
          {monthOffset !== 0 && (
            <button
              type="button"
              onClick={() => setMonthOffset(0)}
              className="text-sm text-accent hover:underline"
            >
              Today
            </button>
          )}
        </div>
        {notice && <p className="text-sm text-black/70">{notice}</p>}
      </div>

      {nextSlotLabel && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Next available queue slot: <strong>{nextSlotLabel}</strong>. Drop a post onto any day
          to reschedule it (it keeps its original time of day).
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="card text-sm text-black/50">Loading calendar…</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-black/10 bg-black/[0.02] text-center text-xs font-medium text-black/50">
            {DAY_LABELS.map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {visible.cells.map((day, i) => {
              const key = localDateKey(day);
              const inMonth = day.getMonth() === visible.month;
              const posts = postsByDate.get(key) ?? [];
              const isToday = key === todayKey;
              const hasSlot = queueByWeekday.has((day.getDay() + 6) % 7);
              return (
                <div
                  key={`${key}-${i}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverKey(key);
                  }}
                  onDragLeave={() => setOverKey((k) => (k === key ? null : k))}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/post-id");
                    if (id) reschedule(id, day);
                  }}
                  className={`min-h-24 border-b border-r border-black/5 p-1.5 transition-colors last:border-r-0 ${
                    inMonth ? "" : "bg-black/[0.02]"
                  } ${isToday ? "bg-accent/5" : ""} ${
                    overKey === key ? "bg-accent/10 ring-2 ring-accent/40" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isToday ? "bg-accent font-semibold text-white" : inMonth ? "text-black/70" : "text-black/30"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {hasSlot && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-green-500"
                        title="Queue slot configured for this weekday"
                      />
                    )}
                  </div>

                  <div className="mt-1 space-y-1">
                    {posts.map((p) => {
                      const iconColor = p.platforms[0]
                        ? PLATFORMS.find((x) => x.id === p.platforms[0].platform)?.color ?? "#475569"
                        : "#475569";
                      return (
                        <div
                          key={p.id}
                          draggable
                          onDragStart={(e) => {
                            setDragId(p.id);
                            e.dataTransfer.setData("text/post-id", p.id);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => {
                            setDragId(null);
                            setOverKey(null);
                          }}
                          className={`group cursor-grab rounded-md border border-black/10 bg-white px-1.5 py-1 text-[10px] leading-tight shadow-sm active:cursor-grabbing ${
                            dragId === p.id ? "opacity-50" : ""
                          }`}
                          title="Drag to another day to reschedule"
                        >
                          <div className="flex items-center gap-1">
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: iconColor }}
                            />
                            <span className="font-medium text-black/60">{timeLabel(p.scheduledFor)}</span>
                            {busyKey === p.id && <span className="text-black/40">…</span>}
                          </div>
                          <p className="line-clamp-2 text-black/70">{p.content}</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelPost(p.id);
                            }}
                            className="hidden text-red-600 group-hover:inline"
                            title="Cancel this scheduled post"
                          >
                            cancel
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
