"use client";

import { useCallback, useEffect, useState } from "react";

export interface BestTimeSlot {
  day_of_week: number; // 0=Monday .. 6=Sunday
  hour: number; // UTC 0-23
  avg_engagement: number;
  post_count: number;
}

export interface BestTimeSlotPicked {
  dayOfWeek: number;
  hour: number;
  label: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

export function slotLabel(slot: { day_of_week: number; hour: number }): string {
  const date = new Date(Date.UTC(2026, 0, 5 + slot.day_of_week, slot.hour)); // 2026-01-05 is a Monday
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${DAYS[slot.day_of_week]} ${time}`;
}

interface Props {
  onPick?: (slot: BestTimeSlotPicked) => void;
  compact?: boolean;
}

export default function BestTimeCard({ onPick, compact = false }: Props) {
  const [slots, setSlots] = useState<BestTimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addonMissing, setAddonMissing] = useState(false);
  const [selected, setSelected] = useState<BestTimeSlot | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/social/analytics?tab=besttime", {
          cache: "no-store",
        });
        if (res.status === 403) {
          const body = await res.json().catch(() => ({}));
          if (active) {
            setError(
              body.code === "plan_capability_required"
                ? (body.error ?? "Best-time insights are a Pro feature.")
                : null
            );
            setAddonMissing(body.code !== "plan_capability_required");
          }
          return;
        }
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        if (active) setSlots(Array.isArray(data.slots) ? data.slots : []);
      } catch {
        if (active) setError("Couldn't load best-time data.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const max = slots.length ? Math.max(...slots.map((s) => s.avg_engagement || 0), 1) : 1;
  const byDay: (BestTimeSlot | undefined)[][] = DAYS.map(() => Array(24).fill(undefined));
  for (const s of slots) {
    if (s.day_of_week >= 0 && s.day_of_week < 7 && s.hour >= 0 && s.hour < 24) {
      byDay[s.day_of_week][s.hour] = s;
    }
  }

  const top = [...slots]
    .sort((a, b) => (b.avg_engagement || 0) - (a.avg_engagement || 0))
    .slice(0, 3);

  const pick = useCallback(
    (slot: BestTimeSlot) => {
      setSelected(slot);
      onPick?.({
        dayOfWeek: slot.day_of_week,
        hour: slot.hour,
        label: slotLabel(slot),
      });
    },
    [onPick]
  );

  if (addonMissing) {
    return (
      <div className="rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-300">
        Best-time insights need the Analytics add-on.
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-lg border border-dashed border-red-500/40 p-4 text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }
  if (loading) {
    return (
      <div className="animate-pulse rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-3 h-32 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }
  if (slots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        Not enough published posts yet to find your best posting times.
      </div>
    );
  }

  const cellColor = (v: number) => {
    const t = max > 0 ? v / max : 0;
    if (t <= 0) return "bg-gray-100 dark:bg-gray-800";
    if (t <= 0.33) return "bg-emerald-200 dark:bg-emerald-900/60";
    if (t <= 0.66) return "bg-emerald-400 dark:bg-emerald-700";
    return "bg-emerald-600 dark:bg-emerald-500";
  };

  return (
    <div>
      {!compact && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Best time to post
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Low</span>
            <div className="flex gap-0.5">
              {[0, 0.33, 0.66, 1].map((t) => (
                <span
                  key={t}
                  className={`h-2.5 w-2.5 rounded-sm ${
                    t === 0
                      ? "bg-gray-200 dark:bg-gray-700"
                      : t <= 0.33
                        ? "bg-emerald-200 dark:bg-emerald-900/60"
                        : t <= 0.66
                          ? "bg-emerald-400 dark:bg-emerald-700"
                          : "bg-emerald-600 dark:bg-emerald-500"
                  }`}
                />
              ))}
            </div>
            <span>High</span>
          </div>
        </div>
      )}

      {top.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {top.map((s, i) => (
            <button
              key={`${s.day_of_week}-${s.hour}`}
              type="button"
              onClick={() => pick(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                selected === s
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-gray-300 text-gray-600 hover:border-emerald-400 dark:border-gray-700 dark:text-gray-300"
              }`}
            >
              {i + 1}. {slotLabel(s)}
            </button>
          ))}
        </div>
      )}

      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: "2.5rem repeat(24, minmax(0, 1fr))" }}
      >
        {DAYS.map((day, d) => (
          <div key={day} className="contents">
            <div className="flex h-5 items-center text-[10px] font-medium text-gray-400 dark:text-gray-500">
              {day}
            </div>
            {HOURS.map((h) => {
              const slot = byDay[d][h];
              return (
                <button
                  key={`${day}-${h}`}
                  type="button"
                  title={slot ? `${slotLabel(slot)} · avg engagement ${slot.avg_engagement}` : `${day} ${h}:00 (UTC)`}
                  disabled={!slot}
                  onClick={() => slot && pick(slot)}
                  className={`h-5 rounded-[3px] ${cellColor(slot?.avg_engagement || 0)} ${
                    slot ? "cursor-pointer hover:ring-2 hover:ring-emerald-400" : "cursor-default"
                  } ${selected === slot ? "ring-2 ring-emerald-500" : ""}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {selected && onPick && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Picked: <span className="font-medium text-gray-800 dark:text-gray-200">{slotLabel(selected)}</span> —
          use it to auto-schedule a post.
        </p>
      )}
    </div>
  );
}
