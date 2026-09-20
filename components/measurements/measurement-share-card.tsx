import { proxiedImageSrc } from "@/lib/proxied-image";
import { formatDateLong } from "@/lib/utils";
import { MEASUREMENT_FIELDS, type BodyMeasurement } from "@/types/measurement";
import type { Profile } from "@/types/profile";

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-2)] px-2 py-2.5 text-center">
      <p className="text-base font-bold text-white">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </div>
  );
}

export function MeasurementShareCard({ measurement, profile }: { measurement: BodyMeasurement; profile?: Profile | null }) {
  const rows = [
    ...(measurement.heightCm != null ? [{ label: "Altura", value: `${measurement.heightCm}cm` }] : []),
    ...MEASUREMENT_FIELDS.flatMap((field) => {
      const value = measurement[field.key];
      return value == null ? [] : [{ label: field.label, value: `${value}${field.unit}` }];
    }),
  ];
  const cover = measurement.photos[0] ?? null;

  return (
    <div className="w-[min(380px,calc(100vw-5rem))] overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--surface)]">
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }} />

      {cover ? (
        <div className="aspect-[4/3] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={proxiedImageSrc(cover)} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="p-5 sm:p-6">
        <p
          className="truncate text-[10px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: "var(--accent)" }}
        >
          Projeto Verão{profile ? ` · ${profile.name}` : ""}
        </p>
        <h2 className="mt-0.5 text-lg font-bold leading-tight text-white sm:text-xl">
          {formatDateLong(measurement.date)}
        </h2>
      </div>

      {rows.length > 0 ? (
        <div className="border-t border-[var(--border)] p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2">
            {rows.map((row) => (
              <StatBlock key={row.label} label={row.label} value={row.value} />
            ))}
          </div>

          {measurement.note ? <p className="mt-4 text-xs italic text-slate-400">&ldquo;{measurement.note}&rdquo;</p> : null}
        </div>
      ) : null}
    </div>
  );
}
