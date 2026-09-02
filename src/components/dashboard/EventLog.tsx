import { Card } from "@/components/ui/card";
import type { EventEntry } from "@/lib/oxygen-system";
import { cn } from "@/lib/utils";

const tone: Record<EventEntry["kind"], string> = {
  CHANGEOVER: "text-primary border-primary/40",
  ALERT: "text-danger border-danger/40",
  CONTROL: "text-warn border-warn/40",
  SYSTEM: "text-muted-foreground border-border",
};

export function EventLog({ events }: { events: EventEntry[] }) {
  return (
    <Card className="panel card-hover-glow gap-0 p-5">
      <h2 className="text-base font-semibold tracking-tight">Changeover &amp; event history</h2>
      <p className="label-caps">Most recent first</p>
      <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
        {events.length === 0 && (
          <li className="font-mono text-xs text-muted-foreground">No events recorded yet.</li>
        )}
        {events.map((e) => (
          <li
            key={e.id}
            className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2"
          >
            <span
              className={cn(
                "mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[0.6rem] tracking-widest",
                tone[e.kind],
              )}
            >
              {e.kind}
            </span>
            <span className="text-sm text-foreground/90">{e.message}</span>
            <time className="ml-auto shrink-0 font-mono text-[0.7rem] text-muted-foreground">
              {new Date(e.t).toLocaleTimeString()}
            </time>
          </li>
        ))}
      </ul>
    </Card>
  );
}
