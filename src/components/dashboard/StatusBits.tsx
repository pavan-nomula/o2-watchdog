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
  const tone = level === "ok" ? "bg-ok" : level === "warn" ? "bg-warn" : "bg-danger";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", tone)}
        style={{ width: `${Math.max(2, pct)}%` }}
      />
    </div>
  );
}
