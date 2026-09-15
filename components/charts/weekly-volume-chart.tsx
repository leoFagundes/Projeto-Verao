"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { CHART_GRID } from "@/lib/chart-colors";

import { ChartTooltip } from "./chart-tooltip";

export function WeeklyVolumeChart({ data }: { data: { label: string; treinos: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke={CHART_GRID} strokeDasharray="0" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#898781", fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTooltip suffix=" treinos" />} />
        <Bar dataKey="treinos" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
