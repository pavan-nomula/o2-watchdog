import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyAutoLogic,
  DEFAULT_CONFIG,
  thresholdGrams,
  type EventEntry,
  type SamplePoint,
  type SystemConfig,
  type SystemState,
  type ValveState,
} from "@/lib/oxygen-system";

const TICK_MS = 1000;
const MAX_POINTS = 120;
const DRAW_RATE = 3.2; // grams consumed per tick from the active cylinder

function initialState(): SystemState {
  return {
    connected: true,
    mode: "AUTO",
    c1Weight: 240,
    c2Weight: 1000,
    c1Valve: "OPEN",
    c2Valve: "CLOSED",
    active: "C1",
    bothLow: false,
    config: { ...DEFAULT_CONFIG },
    lastUpdate: 0,
  };
}

let eventSeq = 0;
const mkEvent = (kind: EventEntry["kind"], message: string, t: number): EventEntry => ({
  id: `${t}-${eventSeq++}`,
  kind,
  message,
  t,
});

export function useOxygenSystem() {
  const [state, setState] = useState<SystemState>(initialState);
  const [history, setHistory] = useState<SamplePoint[]>([]);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const started = useRef(false);

  const log = useCallback((kind: EventEntry["kind"], message: string) => {
    setEvents((prev) => [mkEvent(kind, message, Date.now()), ...prev].slice(0, 60));
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    log("SYSTEM", "ESP32 telemetry link initialized — listening on /api/telemetry");

    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/telemetry");
        if (res.ok) {
          const data = (await res.json()) as {
            isRealHardware?: boolean;
            c1Weight?: number;
            c2Weight?: number;
            c1Valve?: "OPEN" | "CLOSED";
            c2Valve?: "OPEN" | "CLOSED";
            active?: "C1" | "C2" | "NONE";
          };
          if (data && data.isRealHardware) {
            setState((prev) => {
              const c1 = Number(data.c1Weight ?? prev.c1Weight);
              const c2 = Number(data.c2Weight ?? prev.c2Weight);
              const c1Valve = data.c1Valve === "OPEN" ? "OPEN" : "CLOSED";
              const c2Valve = data.c2Valve === "OPEN" ? "OPEN" : "CLOSED";
              const active = data.active === "C1" ? "C1" : data.active === "C2" ? "C2" : "NONE";
              const t = thresholdGrams(prev.config);
              const bothLow = c1 <= t && c2 <= t;

              if (active !== prev.active) {
                log("CHANGEOVER", `ESP32 Hardware Changeover: active cylinder is now ${active}`);
              }

              setHistory((h) =>
                [...h, { t: Date.now(), c1: +c1.toFixed(1), c2: +c2.toFixed(1) }].slice(-MAX_POINTS),
              );

              return {
                ...prev,
                connected: true,
                c1Weight: c1,
                c2Weight: c2,
                c1Valve,
                c2Valve,
                active,
                bothLow,
                lastUpdate: Date.now(),
              };
            });
            return;
          }
        }
      } catch {
        // Fallback to simulation if server API is unreachable
      }

      // Default simulation loop if no real hardware is connected
      setState((prev) => {
        if (!prev.connected) return prev;
        const t = thresholdGrams(prev.config);
        const noise = () => (Math.random() - 0.5) * 0.6;

        let c1 = prev.c1Weight;
        let c2 = prev.c2Weight;
        if (prev.c1Valve === "OPEN") c1 = Math.max(0, c1 - DRAW_RATE);
        if (prev.c2Valve === "OPEN") c2 = Math.max(0, c2 - DRAW_RATE);
        c1 = Math.max(0, c1 + noise());
        c2 = Math.max(0, c2 + noise());

        let next: SystemState = { ...prev, c1Weight: c1, c2Weight: c2, lastUpdate: Date.now() };

        if (prev.mode === "AUTO") {
          const out = applyAutoLogic(next);
          if (out.active !== prev.active) {
            if (out.bothLow) {
              log("ALERT", "BOTH CYLINDERS LOW — all valves closed, supply interrupted");
            } else {
              log(
                "CHANGEOVER",
                `Automatic changeover ${prev.active} → ${out.active} (${prev.active === "C1" ? c1.toFixed(0) : c2.toFixed(0)} g ≤ ${t.toFixed(0)} g)`,
              );
            }
          }
          next = { ...next, ...out };
        } else {
          next.bothLow = c1 <= t && c2 <= t;
        }

        setHistory((h) =>
          [...h, { t: next.lastUpdate, c1: +c1.toFixed(1), c2: +c2.toFixed(1) }].slice(-MAX_POINTS),
        );
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [log]);

  const setValve = useCallback(
    (cyl: "C1" | "C2", value: ValveState) => {
      setState((prev) => {
        if (prev.mode !== "MANUAL") return prev;
        return cyl === "C1"
          ? { ...prev, c1Valve: value, active: value === "OPEN" ? "C1" : prev.active }
          : { ...prev, c2Valve: value, active: value === "OPEN" ? "C2" : prev.active };
      });
      log("CONTROL", `Manual command: ${cyl} valve ${value}`);
    },
    [log],
  );

  const setMode = useCallback(
    (mode: SystemState["mode"]) => {
      setState((prev) => (prev.mode === mode ? prev : { ...prev, mode }));
      log("CONTROL", `Operating mode set to ${mode}`);
    },
    [log],
  );

  const updateConfig = useCallback(
    (patch: Partial<SystemConfig>) => {
      setState((prev) => ({ ...prev, config: { ...prev.config, ...patch } }));
      log(
        "CONTROL",
        `Parameters updated: ${Object.entries(patch)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ")}`,
      );
    },
    [log],
  );

  const refillCylinder = useCallback(
    (cyl: "C1" | "C2") => {
      setState((prev) =>
        cyl === "C1"
          ? { ...prev, c1Weight: prev.config.fullWeight }
          : { ...prev, c2Weight: prev.config.fullWeight },
      );
      log("SYSTEM", `${cyl} replaced with a full cylinder`);
    },
    [log],
  );

  const toggleConnection = useCallback(() => {
    setState((prev) => {
      log("SYSTEM", prev.connected ? "ESP32 link lost" : "ESP32 link restored");
      return { ...prev, connected: !prev.connected };
    });
  }, [log]);

  return {
    state,
    history,
    events,
    setValve,
    setMode,
    updateConfig,
    refillCylinder,
    toggleConnection,
  };
}
