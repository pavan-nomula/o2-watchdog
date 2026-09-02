import { Card } from "@/components/ui/card";
import type { SamplePoint, SystemState } from "@/lib/oxygen-system";
import { thresholdGrams } from "@/lib/oxygen-system";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const fmt = (t: number) =>
  new Date(t).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });

export function WeightChart({ history, state }: { history: SamplePoint[]; state: SystemState }) {
  return (
    <Card className="panel card-hover-glow gap-0 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Real-time weight trend</h2>
          <p className="label-caps">HX711 · 1 Hz · last {history.length} samples</p>
        </div>
        <div className="flex items-center gap-4 font-mono text-[0.7rem] tracking-widest uppercase">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[var(--chart-1)]" />C1
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[var(--chart-2)]" />C2
          </span>
        </div>
      </div>

      <div className="mt-5 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="t"
              tickFormatter={fmt}
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={[0, state.config.fullWeight]}
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(v) => fmt(Number(v))}
              formatter={(v: number, n: string) => [`${v} g`, n.toUpperCase()]}
            />
            <ReferenceLine
              y={thresholdGrams(state.config)}
              stroke="var(--danger)"
              strokeDasharray="4 4"
              label={{ value: "LOW", fill: "var(--danger)", fontSize: 10, position: "right" }}
            />
            <Area
              type="monotone"
              dataKey="c1"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#g1)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="c2"
              stroke="var(--chart-2)"
              strokeWidth={2}
              fill="url(#g2)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
