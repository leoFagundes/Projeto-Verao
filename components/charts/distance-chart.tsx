"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { CHART_GRID } from "@/lib/chart-colors";

import { ChartTooltip } from "./chart-tooltip";

export function DistanceChart({ data }: { data: { label: string; km: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="distanceFill" x1="0" y1="0" x2="0" y2="1">
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
        <Tooltip content={<ChartTooltip suffix=" km" />} />
        <Area
          type="monotone"
          dataKey="km"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#distanceFill)"
          dot={{ r: 4, fill: "var(--accent)", strokeWidth: 2, stroke: "#05070d" }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
