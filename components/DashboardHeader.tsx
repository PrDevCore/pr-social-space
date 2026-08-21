import StatusBadge, { type StatusTone } from "./StatusBadge";

/**
 * Top banner: personalized welcome + current date (server-side rendered) and
 * an account-health status pill. The sub-line reflects the same health logic
 * that drives the StatusBadge (see Dashboard.tsx).
 */
export default function DashboardHeader({
  name,
  status,
}: {
  name: string;
  status: StatusTone;
}) {
  const firstName = name.split(" ")[0];
  const optimized = status === "optimal";

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-lg font-extrabold tracking-tight text-black">Social Hub</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {firstName}, your accounts are{" "}
          {optimized ? (
            <span className="bg-gradient-to-r from-accent to-violet-500 bg-clip-text text-transparent">
              optimized
            </span>
          ) : (
            <span className="text-amber-500">actionable</span>
          )}
        </h1>
        <p className="mt-1 text-sm text-black/60">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
      <StatusBadge tone={status} />
    </div>
  );
}