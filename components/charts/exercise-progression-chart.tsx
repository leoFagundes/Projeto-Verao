"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { formatClock } from "@/lib/utils";

import { ChartTooltip } from "./chart-tooltip";

export function ExerciseProgressionChart({
  data,
  unit = "kg",
}: {
  data: { date: number; value: number }[];
  unit?: "kg" | "s";
}) {
  const points = data.map((point) => ({
    label: new Date(point.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    value: point.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={90}>
      <LineChart data={points} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#898781", fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <Tooltip
          content={
            <ChartTooltip
              formatValue={unit === "s" ? (value) => formatClock(value) : undefined}
              suffix={unit === "s" ? "" : " kg"}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
