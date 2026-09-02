import { createFileRoute } from "@tanstack/react-router";
import { Activity, AlertTriangle, Radio, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { useOxygenSystem } from "@/hooks/use-oxygen-system";
import { CylinderCard } from "@/components/dashboard/CylinderCard";
import { WeightChart } from "@/components/dashboard/WeightChart";
import { ControlPanel } from "@/components/dashboard/ControlPanel";
import { EventLog } from "@/components/dashboard/EventLog";
import { StatusPill } from "@/components/dashboard/StatusBits";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SparkleGrid } from "@/components/dashboard/SparkleGrid";
import { levelOf, thresholdGrams } from "@/lib/oxygen-system";

const TITLE = "Nirvana Technologies — O2 Dual Cylinder Watchdog";
const DESC =
  "Real-time ESP32 + HX711 dashboard for dual oxygen cylinder weight monitoring, valve status and automatic changeover control.";
const OG_IMAGE = "https://nirvana-innovations-technologies.onrender.com/nirvana-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:secure_url", content: OG_IMAGE },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1024" },
      { property: "og:image:height", content: "388" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: OG_IMAGE },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state, history, events, setValve, setMode, updateConfig, refillCylinder, toggleConnection } =
    useOxygenSystem();

  const c1Level = levelOf(state.c1Weight, state.config);
  const c2Level = levelOf(state.c2Weight, state.config);
  const alerts = [
    state.bothLow && "BOTH CYLINDERS LOW — oxygen supply interrupted",
    !state.bothLow && c1Level === "low" && "C1 below low-level threshold",
    !state.bothLow && c2Level === "low" && "C2 below low-level threshold",
    !state.connected && "ESP32 telemetry link lost — values are stale",
  ].filter(Boolean) as string[];

  return (
    <>
      <SparkleGrid />
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="panel card-hover-glow flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <img
            src="/nirvana-logo.png"
            alt="Nirvana Innovations & Technologies"
            className="h-12 max-w-[200px] sm:h-14 sm:max-w-[240px] object-contain mix-blend-screen"
          />
          <div className="h-10 w-[1px] bg-border hidden sm:block" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Dual Oxygen Cylinder Console
            </h1>
            <p className="label-caps">Nirvana Innovations & Technologies · ESP32 · HX711</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill level={state.connected ? "ok" : "low"} live={state.connected}>
            {state.connected ? (
              <>
                <Wifi className="size-3.5" aria-hidden="true" /> Online
              </>
            ) : (
              <>
                <WifiOff className="size-3.5" aria-hidden="true" /> Offline
              </>
            )}
          </StatusPill>
          <StatusPill level={state.mode === "AUTO" ? "ok" : "warn"}>{state.mode} mode</StatusPill>
          <Button variant="outline" size="sm" onClick={toggleConnection}>
            <Radio className="size-4" aria-hidden="true" />
            Simulate link
          </Button>
        </div>
      </header>

      {alerts.length > 0 && (
        <div className="mt-4 space-y-2" role="alert">
          {alerts.map((a) => (
            <div
              key={a}
              className="flex items-center gap-3 rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              {a}
            </div>
          ))}
        </div>
      )}

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <CylinderCard id="C1" state={state} weight={state.c1Weight} valve={state.c1Valve} />
        <CylinderCard id="C2" state={state} weight={state.c2Weight} valve={state.c2Valve} />

        <Card className="panel card-hover-glow gap-0 p-5">
          <h2 className="text-base font-semibold tracking-tight">Supply status</h2>
          <p className="label-caps">Line pressure source</p>

          <div className="mt-6 grid place-items-center rounded-lg border border-border bg-card py-7">
            <span className="label-caps">Active cylinder</span>
            <span
              className={`mt-1 font-mono text-5xl font-bold ${
                state.active === "NONE" ? "text-danger" : "text-primary"
              }`}
            >
              {state.active === "NONE" ? "—" : state.active}
            </span>
            <span className="mt-2 text-xs text-muted-foreground">
              {state.active === "NONE" ? "No supply available" : "Delivering oxygen"}
            </span>
          </div>

          <dl className="mt-5 space-y-2.5 font-mono text-xs">
            <Row label="Low threshold" value={`${state.config.lowThresholdPct}% · ${thresholdGrams(state.config).toFixed(0)} g`} />
            <Row label="Full reference" value={`${state.config.fullWeight} g`} />
            <Row label="Changeovers" value={String(events.filter((e) => e.kind === "CHANGEOVER").length)} />
            <Row
              label="Last update"
              value={state.lastUpdate ? new Date(state.lastUpdate).toLocaleTimeString() : "—"}
            />
          </dl>

          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-ok" aria-hidden="true" />
            Failsafe: both valves close when both cylinders are low.
          </p>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeightChart history={history} state={state} />
        </div>
        <EventLog events={events} />
      </section>

      <section className="mt-4">
        <ControlPanel
          state={state}
          onValve={setValve}
          onMode={setMode}
          onConfig={updateConfig}
          onRefill={refillCylinder}
        />
      </section>

      <footer className="mt-8 border-t border-border/40 pt-6 pb-6 text-center">
        <div className="flex flex-col items-center justify-center gap-2">
          <img
            src="/nirvana-logo.png"
            alt="Nirvana Innovations & Technologies"
            className="h-10 opacity-90 object-contain mix-blend-screen"
          />
          <p className="font-mono text-[0.7rem] tracking-widest text-muted-foreground uppercase">
            Nirvana Innovations and Technologies · Telemetry simulated locally · Ready for ESP32 integration
          </p>
        </div>
      </footer>
    </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
