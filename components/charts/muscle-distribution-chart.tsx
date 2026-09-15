"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { MUSCLE_COLORS } from "@/lib/chart-colors";
import type { MuscleGroup } from "@/types/workout";

import { ChartTooltip } from "./chart-tooltip";

const MAX_SLICES = 5;

function colorFor(name: string) {
  return MUSCLE_COLORS[name as MuscleGroup] ?? MUSCLE_COLORS.Outro;
}

export function MuscleDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="grid h-[180px] place-items-center text-sm text-slate-500">
        Sem exercícios concluídos ainda.
      </div>
    );
  }

  const visible = data.slice(0, MAX_SLICES);
  const rest = data.slice(MAX_SLICES);
  const restTotal = rest.reduce((sum, item) => sum + item.value, 0);
  const slices = restTotal > 0 ? [...visible, { name: "Outros", value: restTotal }] : visible;
  const total = slices.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-[160px] w-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              stroke="var(--bg)"
              strokeWidth={2}
            >
              {slices.map((entry) => (
                <Cell key={entry.name} fill={colorFor(entry.name)} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-1">
        {slices.map((entry) => (
          <li key={entry.name} className="flex items-center justify-between gap-2 text-slate-300">
            <span className="flex items-center gap-2 truncate">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: colorFor(entry.name) }}
              />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="shrink-0 font-medium text-white">
              {Math.round((entry.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
