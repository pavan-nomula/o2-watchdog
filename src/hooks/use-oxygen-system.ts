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
    log("SYSTEM", "ESP32 link established — HX711 A/B streaming at 1 Hz");

    const id = setInterval(() => {
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
