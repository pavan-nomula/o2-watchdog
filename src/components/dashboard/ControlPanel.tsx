import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { thresholdGrams, type SystemConfig, type SystemState } from "@/lib/oxygen-system";
import { cn } from "@/lib/utils";

interface Props {
  state: SystemState;
  onValve: (c: "C1" | "C2", v: "OPEN" | "CLOSED") => void;
  onMode: (m: "AUTO" | "MANUAL") => void;
  onConfig: (patch: Partial<SystemConfig>) => void;
  onRefill: (c: "C1" | "C2") => void;
}

export function ControlPanel({ state, onValve, onMode, onConfig, onRefill }: Props) {
  const manual = state.mode === "MANUAL";
  const [form, setForm] = useState({
    fullWeight: String(state.config.fullWeight),
    lowThresholdPct: String(state.config.lowThresholdPct),
    tareOffset: String(state.config.tareOffset),
    scaleFactor: String(state.config.scaleFactor),
  });

  useEffect(() => {
    setForm({
      fullWeight: String(state.config.fullWeight),
      lowThresholdPct: String(state.config.lowThresholdPct),
      tareOffset: String(state.config.tareOffset),
      scaleFactor: String(state.config.scaleFactor),
    });
  }, [state.config]);

  const commit = () => {
    const patch: Partial<SystemConfig> = {
      fullWeight: Number(form.fullWeight),
      lowThresholdPct: Number(form.lowThresholdPct),
      tareOffset: Number(form.tareOffset),
      scaleFactor: Number(form.scaleFactor),
    };
    if (
      !Number.isFinite(patch.fullWeight!) ||
      patch.fullWeight! <= 0 ||
      !Number.isFinite(patch.lowThresholdPct!) ||
      patch.lowThresholdPct! < 0 ||
      patch.lowThresholdPct! > 100
    ) {
      toast.error("Invalid parameters", { description: "Check full weight and threshold values." });
      return;
    }
    onConfig(patch);
    toast.success("Parameters pushed to ESP32");
  };

  return (
    <Card className="panel gap-0 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Control &amp; configuration</h2>
          <p className="label-caps">Authorized operators only</p>
        </div>
        <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
          <span
            className={cn(
              "font-mono text-[0.7rem] tracking-widest",
              !manual ? "text-primary" : "text-muted-foreground",
            )}
          >
            AUTO
          </span>
          <Switch
            checked={manual}
            onCheckedChange={(v) => onMode(v ? "MANUAL" : "AUTO")}
            aria-label="Toggle manual mode"
          />
          <span
            className={cn(
              "font-mono text-[0.7rem] tracking-widest",
              manual ? "text-warn" : "text-muted-foreground",
            )}
          >
            MANUAL
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {(["C1", "C2"] as const).map((c) => {
          const valve = c === "C1" ? state.c1Valve : state.c2Valve;
          return (
            <div key={c} className="rounded-md border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="label-caps">{c} valve</span>
                <span
                  className={cn(
                    "font-mono text-xs",
                    valve === "OPEN" ? "text-ok" : "text-muted-foreground",
                  )}
                >
                  {valve}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={valve === "OPEN" ? "default" : "secondary"}
                  disabled={!manual}
                  onClick={() => onValve(c, "OPEN")}
                >
                  Open
                </Button>
                <Button
                  size="sm"
                  variant={valve === "CLOSED" ? "destructive" : "secondary"}
                  disabled={!manual}
                  onClick={() => onValve(c, "CLOSED")}
                >
                  Close
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => onRefill(c)}
              >
                Mark {c} replaced (full)
              </Button>
            </div>
          );
        })}
      </div>

      {!manual && (
        <p className="mt-3 font-mono text-[0.7rem] tracking-wide text-muted-foreground">
          Valve buttons are locked while automatic changeover is in control.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field
          id="fullWeight"
          label="Full cylinder weight (g)"
          value={form.fullWeight}
          onChange={(v) => setForm((f) => ({ ...f, fullWeight: v }))}
        />
        <Field
          id="lowThresholdPct"
          label="Low threshold (%)"
          value={form.lowThresholdPct}
          onChange={(v) => setForm((f) => ({ ...f, lowThresholdPct: v }))}
          hint={`= ${thresholdGrams(state.config).toFixed(0)} g`}
        />
        <Field
          id="tareOffset"
          label="HX711 tare offset"
          value={form.tareOffset}
          onChange={(v) => setForm((f) => ({ ...f, tareOffset: v }))}
        />
        <Field
          id="scaleFactor"
          label="Calibration scale (counts/g)"
          value={form.scaleFactor}
          onChange={(v) => setForm((f) => ({ ...f, scaleFactor: v }))}
        />
      </div>

      <Button className="mt-5 w-full sm:w-auto sm:self-end" onClick={commit}>
        Apply parameters
      </Button>
    </Card>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="label-caps">
        {label} {hint && <span className="ml-1 normal-case text-primary">{hint}</span>}
      </Label>
      <Input
        id={id}
        inputMode="decimal"
        className="font-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
