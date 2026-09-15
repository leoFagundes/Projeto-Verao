"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { MeasurementChart } from "@/components/charts/measurement-chart";
import { MeasurementCard } from "@/components/measurements/measurement-card";
import { MeasurementFormModal } from "@/components/measurements/measurement-form-modal";
import { Button } from "@/components/ui/button";
import { Card, SectionLabel } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { StatTile } from "@/components/ui/stat-tile";
import { deleteMeasurement } from "@/lib/firebase/measurements";
import { useMeasurements } from "@/lib/hooks/use-measurements";
import { latestBmi, measurementSeries, measurementTrend } from "@/lib/stats";
import { cn, formatDateLong } from "@/lib/utils";
import { MEASUREMENT_FIELDS, type BodyMeasurement, type MeasurementFieldKey } from "@/types/measurement";

export default function MeasurementsPage() {
  const params = useParams<{ id: string }>();
  const { measurements, loading } = useMeasurements(params.id);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BodyMeasurement | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BodyMeasurement | null>(null);
  const [selectedField, setSelectedField] = useState<MeasurementFieldKey>("weightKg");
  const [viewingPhoto, setViewingPhoto] = useState<BodyMeasurement | null>(null);

  const photos = useMemo(
    () =>
      [...measurements]
        .filter((m): m is BodyMeasurement & { photoUrl: string } => m.photoUrl != null)
        .sort((a, b) => a.date - b.date),
    [measurements],
  );

  const availableFields = useMemo(
    () => MEASUREMENT_FIELDS.filter((field) => measurements.some((m) => m[field.key] != null)),
    [measurements],
  );

  const activeField = availableFields.some((f) => f.key === selectedField)
    ? selectedField
    : (availableFields[0]?.key ?? "weightKg");

  const chartData = useMemo(
    () => measurementSeries(measurements, activeField),
    [measurements, activeField],
  );

  const weightTrend = measurementTrend(measurements, "weightKg");
  const fatTrend = measurementTrend(measurements, "bodyFatPct");
  const bmi = latestBmi(measurements);
  const fieldMeta = MEASUREMENT_FIELDS.find((f) => f.key === activeField);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Medidas</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Suas medidas corporais</h2>
        </div>
        <Button onClick={() => setFormOpen(true)}>+ Registrar</Button>
      </div>

      {measurements.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Peso"
              value={weightTrend.latest ? `${weightTrend.latest.value} kg` : "—"}
              hint={weightTrend.delta != null ? `${weightTrend.delta > 0 ? "+" : ""}${weightTrend.delta}kg desde a última vez` : undefined}
              icon="⚖️"
            />
            <StatTile
              label="IMC"
              value={bmi ?? "—"}
              hint={bmi != null ? "Peso e altura mais recentes" : "Registre peso e altura"}
              icon="📐"
            />
            <StatTile
              label="Gordura corporal"
              value={fatTrend.latest ? `${fatTrend.latest.value}%` : "—"}
              hint={fatTrend.delta != null ? `${fatTrend.delta > 0 ? "+" : ""}${fatTrend.delta}% desde a última vez` : undefined}
              icon="📉"
            />
            <StatTile label="Registros" value={measurements.length} icon="📅" />
          </div>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <SectionLabel>Evolução</SectionLabel>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {fieldMeta?.label ?? "Peso"} ao longo do tempo
                </h3>
              </div>
              {availableFields.length > 1 ? (
                <div className="flex flex-wrap gap-1.5">
                  {availableFields.map((field) => (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => setSelectedField(field.key)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition",
                        activeField === field.key
                          ? "text-slate-950"
                          : "border border-[var(--border)] text-slate-300 hover:text-white",
                      )}
                      style={
                        activeField === field.key
                          ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }
                          : undefined
                      }
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="mt-4">
              {chartData.length >= 2 ? (
                <MeasurementChart data={chartData} unit={fieldMeta?.unit ?? ""} />
              ) : (
                <div className="grid h-[180px] place-items-center text-sm text-slate-500">
                  Registre pelo menos duas medições para ver a evolução.
                </div>
              )}
            </div>
          </Card>

          {photos.length > 0 ? (
            <Card className="p-5">
              <SectionLabel>Fotos de progresso</SectionLabel>
              <h3 className="mt-1 text-lg font-semibold text-white">Linha do tempo</h3>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setViewingPhoto(photo)}
                    className="shrink-0 text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.photoUrl}
                      alt={`Foto de progresso — ${formatDateLong(photo.date)}`}
                      className="h-28 w-24 rounded-2xl border border-[var(--border)] object-cover transition hover:border-[var(--accent)]"
                    />
                    <p className="mt-1 text-center text-[11px] text-slate-400">
                      {formatDateLong(photo.date).split(" de ").slice(0, 2).join(" ")}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      ) : null}

      <div>
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-[24px] bg-white/5" />
            ))}
          </div>
        ) : measurements.length === 0 ? (
          <EmptyState
            title="Nenhuma medida registrada"
            description="Registre peso, altura ou dados de bioimpedância — preencha só o que tiver, sem compromisso."
            action={<Button onClick={() => setFormOpen(true)}>Registrar medidas</Button>}
          />
        ) : (
          <div className="space-y-3">
            {measurements.map((measurement, index) => (
              <MeasurementCard
                key={measurement.id}
                measurement={measurement}
                index={index}
                onEdit={() => setEditing(measurement)}
                onDelete={() => setPendingDelete(measurement)}
              />
            ))}
          </div>
        )}
      </div>

      <MeasurementFormModal open={formOpen} onClose={() => setFormOpen(false)} profileId={params.id} />
      <MeasurementFormModal
        key={editing?.id ?? "edit-measurement"}
        open={editing !== null}
        onClose={() => setEditing(null)}
        profileId={params.id}
        measurement={editing}
      />

      <Modal
        open={viewingPhoto !== null}
        onClose={() => setViewingPhoto(null)}
        title={viewingPhoto ? formatDateLong(viewingPhoto.date) : "Foto"}
      >
        {viewingPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={viewingPhoto.photoUrl ?? undefined}
            alt={`Foto de progresso — ${formatDateLong(viewingPhoto.date)}`}
            className="w-full rounded-2xl object-cover"
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remover registro"
        description="Esse registro de medidas será removido permanentemente."
        confirmLabel="Remover"
        danger
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteMeasurement(params.id, pendingDelete)
            .then(() => toast.success("Registro removido."))
            .catch(() => toast.error("Não foi possível remover."));
        }}
      />
    </div>
  );
}
