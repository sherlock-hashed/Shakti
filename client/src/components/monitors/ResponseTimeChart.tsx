import { CartesianGrid, Line, LineChart, ReferenceDot, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Check } from "@/api/monitorApi";

const config = {
  responseTimeMs: { label: "Response time (ms)", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ResponseTimeChart({ checks }: { checks: Check[] }) {
  const data = checks.map((c) => ({
    t: new Date(c.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    responseTimeMs: c.responseTimeMs,
    isUp: c.isUp,
  }));

  const downPoints = data
    .map((d, i) => ({ ...d, i }))
    .filter((d) => !d.isUp);

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <LineChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="t" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} unit="ms" />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Line
          type="monotone"
          dataKey="responseTimeMs"
          stroke="var(--color-responseTimeMs)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        {downPoints.map((d) => (
          <ReferenceDot
            key={d.i}
            x={d.t}
            y={d.responseTimeMs}
            r={5}
            fill="var(--destructive)"
            stroke="var(--background)"
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}