/**
 * Simulated telemetry + control layer for the ESP32 dual-cylinder oxygen system.
 *
 * The shape of `SystemState` and `SystemCommand` mirrors what the ESP32 firmware
 * is expected to publish / accept, so swapping the simulator for a WebSocket /
 * MQTT / HTTP transport later only means replacing `useOxygenSystem`'s internals.
 */

export type ValveState = "OPEN" | "CLOSED";
export type ActiveCylinder = "C1" | "C2" | "NONE";
export type Mode = "AUTO" | "MANUAL";

export interface SystemConfig {
  fullWeight: number; // grams, reference weight of a full cylinder
  lowThresholdPct: number; // percent of fullWeight considered "low"
  tareOffset: number; // calibration: HX711 zero offset (raw counts)
  scaleFactor: number; // calibration: raw counts per gram
}

export interface SystemState {
  connected: boolean;
  mode: Mode;
  c1Weight: number;
  c2Weight: number;
  c1Valve: ValveState;
  c2Valve: ValveState;
  active: ActiveCylinder;
  bothLow: boolean;
  config: SystemConfig;
  lastUpdate: number;
}

export interface SamplePoint {
  t: number;
  c1: number;
  c2: number;
}

export interface EventEntry {
  id: string;
  t: number;
  kind: "CHANGEOVER" | "ALERT" | "CONTROL" | "SYSTEM";
  message: string;
}

export const DEFAULT_CONFIG: SystemConfig = {
  fullWeight: 1000,
  lowThresholdPct: 5,
  tareOffset: 8_388_608,
  scaleFactor: 420.5,
};

export const thresholdGrams = (c: SystemConfig) => (c.fullWeight * c.lowThresholdPct) / 100;

export const remainingPct = (w: number, c: SystemConfig) =>
  Math.max(0, Math.min(100, (w / c.fullWeight) * 100));

export type Level = "ok" | "warn" | "low";

export function levelOf(weight: number, c: SystemConfig): Level {
  const t = thresholdGrams(c);
  if (weight <= t) return "low";
  if (weight <= t * 3) return "warn";
  return "ok";
}

/** Pure implementation of the firmware's automatic changeover logic. */
export function applyAutoLogic(s: SystemState): {
  c1Valve: ValveState;
  c2Valve: ValveState;
  active: ActiveCylinder;
  bothLow: boolean;
} {
  const t = thresholdGrams(s.config);
  if (s.c1Weight > t) {
    return { c1Valve: "OPEN", c2Valve: "CLOSED", active: "C1", bothLow: false };
  }
  if (s.c2Weight > t) {
    return { c1Valve: "CLOSED", c2Valve: "OPEN", active: "C2", bothLow: false };
  }
  return { c1Valve: "CLOSED", c2Valve: "CLOSED", active: "NONE", bothLow: true };
}
