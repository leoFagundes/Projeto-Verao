"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useId } from "react";

import { CHART_GRID } from "@/lib/chart-colors";

import { ChartTooltip } from "./chart-tooltip";

export function MeasurementChart({
  data,
  unit,
}: {
  data: { date: number; value: number }[];
  unit: string;
}) {
  const gradientId = `measurement-fill-${useId()}`;
  const points = data.map((point) => ({
    label: new Date(point.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    value: point.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={points} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={CHART_GRID} strokeDasharray="0" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#898781", fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <Tooltip content={<ChartTooltip suffix={unit ? ` ${unit}` : ""} />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--accent)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={{ r: 4, fill: "var(--accent)", strokeWidth: 2, stroke: "var(--surface)" }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
