import { Card } from "@/components/ui/card";
import { LevelBar, StatusPill } from "./StatusBits";
import { levelOf, remainingPct, thresholdGrams, type SystemState } from "@/lib/oxygen-system";
import { cn } from "@/lib/utils";
import { Cylinder } from "lucide-react";

export function CylinderCard({
  id,
  state,
  weight,
  valve,
}: {
  id: "C1" | "C2";
  state: SystemState;
  weight: number;
  valve: "OPEN" | "CLOSED";
}) {
  const level = levelOf(weight, state.config);
  const pct = remainingPct(weight, state.config);
  const isActive = state.active === id;

  return (
    <Card
      className={cn(
        "panel card-hover-glow relative gap-0 overflow-hidden p-5 transition-all duration-300",
        isActive && "active-cylinder-glow ring-1 ring-primary/80",
      )}
    >
      {isActive && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-400 to-primary animate-pulse" />}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md border border-border bg-secondary text-primary">
            <Cylinder className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Cylinder {id}</h2>
            <p className="label-caps">{isActive ? "Active supply" : "Standby"}</p>
          </div>
        </div>
        <StatusPill level={level} live={isActive}>
          {level === "low" ? "Low" : level === "warn" ? "Caution" : "Nominal"}
        </StatusPill>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="label-caps">Net weight</p>
          <p className="font-mono text-4xl font-semibold tabular-nums">
            {weight.toFixed(1)}
            <span className="ml-1 text-base text-muted-foreground">g</span>
          </p>
        </div>
        <div className="text-right">
          <p className="label-caps">Remaining</p>
          <p className="font-mono text-3xl font-semibold tabular-nums">{pct.toFixed(1)}%</p>
        </div>
      </div>

      <div className="mt-4">
        <LevelBar pct={pct} level={level} />
        <div className="mt-2 flex justify-between font-mono text-[0.7rem] text-muted-foreground">
          <span>0 g</span>
          <span>threshold {thresholdGrams(state.config).toFixed(0)} g</span>
          <span>{state.config.fullWeight} g</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-md border border-border bg-card px-3 py-2.5">
        <span className="label-caps">Servo valve</span>
        <StatusPill level={valve === "OPEN" ? "ok" : "low"}>{valve}</StatusPill>
      </div>
    </Card>
  );
}
