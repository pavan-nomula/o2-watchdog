import { cn } from "@/lib/utils";
import type { Level } from "@/lib/oxygen-system";

const levelClasses: Record<Level, string> = {
  ok: "text-ok border-ok/40 bg-ok/10",
  warn: "text-warn border-warn/40 bg-warn/10",
  low: "text-danger border-danger/40 bg-danger/10",
};

export function StatusPill({
  level,
  children,
  live = false,
  className,
}: {
  level: Level;
  children: React.ReactNode;
  live?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[0.7rem] tracking-widest uppercase",
        levelClasses[level],
        className,
      )}
    >
      <span
        className={cn("size-2 rounded-full bg-current", live && "live-dot")}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

export function LevelBar({ pct, level }: { pct: number; level: Level }) {
  const tone =
    level === "ok"
      ? "bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
      : level === "warn"
      ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
      : "bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.6)]";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/80 p-0.5 border border-border/40">
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", tone)}
        style={{ width: `${Math.max(2, pct)}%` }}
      />
    </div>
  );
}
