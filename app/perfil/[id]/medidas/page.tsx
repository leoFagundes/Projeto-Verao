"use client";

import { Calendar, Ruler, Scale, TrendingDown } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { MeasurementChart } from "@/components/charts/measurement-chart";
import { GoalCard } from "@/components/measurements/goal-card";
import { GoalFormModal } from "@/components/measurements/goal-form-modal";
import { MeasurementCard } from "@/components/measurements/measurement-card";
import { MeasurementCompareModal } from "@/components/measurements/measurement-compare-modal";
import { MeasurementDetailModal } from "@/components/measurements/measurement-detail-modal";
import { MeasurementFormModal } from "@/components/measurements/measurement-form-modal";
import { Button } from "@/components/ui/button";
import { Card, SectionLabel } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { StatTile } from "@/components/ui/stat-tile";
import { deleteMeasurement } from "@/lib/firebase/measurements";
import { useGoals } from "@/lib/hooks/use-goals";
import { useMeasurements } from "@/lib/hooks/use-measurements";
import { useProfile } from "@/lib/hooks/use-profile";
import { latestBmi, measurementSeries, measurementTrend } from "@/lib/stats";
import { cn, formatDateLong } from "@/lib/utils";
import { MEASUREMENT_FIELDS, type BodyMeasurement, type MeasurementFieldKey } from "@/types/measurement";

export default function MeasurementsPage() {
  const params = useParams<{ id: string }>();
  const { measurements, loading } = useMeasurements(params.id);
  const { goals } = useGoals(params.id);
  const { profile } = useProfile(params.id);

  const [formOpen, setFormOpen] = useState(false);
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [editing, setEditing] = useState<BodyMeasurement | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BodyMeasurement | null>(null);
  const [selectedField, setSelectedField] = useState<MeasurementFieldKey>("weightKg");
  const [viewingPhotosFor, setViewingPhotosFor] = useState<BodyMeasurement | null>(null);
  const [viewingDetail, setViewingDetail] = useState<BodyMeasurement | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const entriesWithPhotos = useMemo(
    () => [...measurements].filter((m) => m.photos.length > 0).sort((a, b) => a.date - b.date),
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
        <div className="flex shrink-0 gap-2">
          {measurements.length >= 2 ? (
            <Button variant="secondary" onClick={() => setCompareOpen(true)}>
              Comparar
            </Button>
          ) : null}
          <Button onClick={() => setFormOpen(true)}>+ Registrar</Button>
        </div>
      </div>

      {measurements.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Peso"
              value={weightTrend.latest ? `${weightTrend.latest.value} kg` : "—"}
              hint={weightTrend.delta != null ? `${weightTrend.delta > 0 ? "+" : ""}${weightTrend.delta}kg desde a última vez` : undefined}
              icon={<Scale className="h-4 w-4" style={{ color: "var(--accent)" }} />}
            />
            <StatTile
              label="IMC"
              value={bmi ?? "—"}
              hint={bmi != null ? "Peso e altura mais recentes" : "Registre peso e altura"}
              icon={<Ruler className="h-4 w-4" style={{ color: "var(--accent)" }} />}
            />
            <StatTile
              label="Gordura corporal"
              value={fatTrend.latest ? `${fatTrend.latest.value}%` : "—"}
              hint={fatTrend.delta != null ? `${fatTrend.delta > 0 ? "+" : ""}${fatTrend.delta}% desde a última vez` : undefined}
              icon={<TrendingDown className="h-4 w-4" style={{ color: "var(--accent)" }} />}
            />
            <StatTile
              label="Registros"
              value={measurements.length}
              icon={<Calendar className="h-4 w-4" style={{ color: "var(--accent)" }} />}
            />
          </div>

          <Card className="p-5">
            <SectionLabel>Registros</SectionLabel>
            <h3 className="mt-1 text-lg font-semibold text-white">Histórico de medidas</h3>
            <div className="mt-4 space-y-3">
              {measurements.map((measurement, index) => (
                <MeasurementCard
                  key={measurement.id}
                  measurement={measurement}
                  index={index}
                  onView={() => setViewingDetail(measurement)}
                  onEdit={() => setEditing(measurement)}
                  onDelete={() => setPendingDelete(measurement)}
                />
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <SectionLabel>Metas</SectionLabel>
                <h3 className="mt-1 text-lg font-semibold text-white">Objetivos em andamento</h3>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setGoalFormOpen(true)}>
                + Nova meta
              </Button>
            </div>
            <div className="mt-4">
              {goals.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Defina uma meta pra acompanhar o progresso — ex.: chegar a 75kg ou 15% de gordura corporal.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {goals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} measurements={measurements} profileId={params.id} />
                  ))}
                </div>
              )}
            </div>
          </Card>

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

          {entriesWithPhotos.length > 0 ? (
            <Card className="p-5">
              <SectionLabel>Fotos de progresso</SectionLabel>
              <h3 className="mt-1 text-lg font-semibold text-white">Linha do tempo</h3>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {entriesWithPhotos.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setViewingPhotosFor(entry)}
                    className="relative shrink-0 text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.photos[0]}
                      alt={`Foto de progresso — ${formatDateLong(entry.date)}`}
                      className="h-28 w-24 rounded-2xl border border-[var(--border)] object-cover transition hover:border-[var(--accent)]"
                    />
                    {entry.photos.length > 1 ? (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white">
                        +{entry.photos.length - 1}
                      </span>
                    ) : null}
                    <p className="mt-1 text-center text-[11px] text-slate-400">
                      {formatDateLong(entry.date).split(" de ").slice(0, 2).join(" ")}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-white/5" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-1/4 animate-pulse rounded bg-white/5" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : measurements.length === 0 ? (
        <EmptyState
          title="Nenhuma medida registrada"
          description="Registre peso, altura ou dados de bioimpedância — preencha só o que tiver, sem compromisso."
          action={<Button onClick={() => setFormOpen(true)}>Registrar medidas</Button>}
        />
      ) : null}

      <GoalFormModal
        open={goalFormOpen}
        onClose={() => setGoalFormOpen(false)}
        profileId={params.id}
        measurements={measurements}
      />

      <MeasurementFormModal open={formOpen} onClose={() => setFormOpen(false)} profileId={params.id} />
      <MeasurementFormModal
        key={editing?.id ?? "edit-measurement"}
        open={editing !== null}
        onClose={() => setEditing(null)}
        profileId={params.id}
        measurement={editing}
      />

      <ImageLightbox
        images={viewingPhotosFor?.photos ?? []}
        open={viewingPhotosFor !== null}
        onClose={() => setViewingPhotosFor(null)}
      />

      <MeasurementCompareModal open={compareOpen} onClose={() => setCompareOpen(false)} measurements={measurements} />

      <MeasurementDetailModal
        measurement={viewingDetail}
        profile={profile}
        open={viewingDetail !== null}
        onClose={() => setViewingDetail(null)}
      />

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
