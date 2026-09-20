"use client";

import { Info } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { AchievementUnlockModal } from "@/components/achievements/achievement-unlock-modal";
import { MeasurementInfoModal } from "@/components/measurements/measurement-info-modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { type Achievement, detectNewlyUnlocked } from "@/lib/achievements";
import { createMeasurement, updateMeasurement } from "@/lib/firebase/measurements";
import { useMeasurements } from "@/lib/hooks/use-measurements";
import { useRuns } from "@/lib/hooks/use-runs";
import { useSessions } from "@/lib/hooks/use-sessions";
import { formatDateInput, parseDateInput } from "@/lib/utils";
import type { BodyMeasurement, BodyMeasurementInput, MeasurementFieldKey } from "@/types/measurement";

function InfoLabel({ text, onInfo }: { text: string; onInfo: () => void }) {
  return (
    <span className="flex items-center gap-1">
      {text}
      <button
        type="button"
        onClick={onInfo}
        className="text-slate-500 transition hover:text-[var(--accent)]"
        aria-label={`O que é ${text}?`}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function numOrNull(value: string) {
  return value.trim() === "" ? null : Number(value);
}

export function MeasurementFormModal({
  open,
  onClose,
  profileId,
  measurement,
}: {
  open: boolean;
  onClose: () => void;
  profileId: string;
  measurement?: BodyMeasurement | null;
}) {
  const isEdit = Boolean(measurement);
  const { sessions } = useSessions(profileId);
  const { runs } = useRuns(profileId);
  const { measurements } = useMeasurements(profileId);
  const [celebrating, setCelebrating] = useState<Achievement[]>([]);

  const [date, setDate] = useState(() => formatDateInput(measurement?.date ?? Date.now()));
  const [weightKg, setWeightKg] = useState(measurement?.weightKg?.toString() ?? "");
  const [heightCm, setHeightCm] = useState(measurement?.heightCm?.toString() ?? "");
  const [bodyFatPct, setBodyFatPct] = useState(measurement?.bodyFatPct?.toString() ?? "");
  const [muscleMassPct, setMuscleMassPct] = useState(measurement?.muscleMassPct?.toString() ?? "");
  const [waterPct, setWaterPct] = useState(measurement?.waterPct?.toString() ?? "");
  const [boneMassKg, setBoneMassKg] = useState(measurement?.boneMassKg?.toString() ?? "");
  const [visceralFat, setVisceralFat] = useState(measurement?.visceralFat?.toString() ?? "");
  const [bmrKcal, setBmrKcal] = useState(measurement?.bmrKcal?.toString() ?? "");
  const [photos, setPhotos] = useState<string[]>(measurement?.photos ?? []);
  const [note, setNote] = useState(measurement?.note ?? "");
  const [showMore, setShowMore] = useState(
    Boolean(
      measurement &&
        (measurement.bodyFatPct != null ||
          measurement.muscleMassPct != null ||
          measurement.waterPct != null ||
          measurement.boneMassKg != null ||
          measurement.visceralFat != null ||
          measurement.bmrKcal != null),
    ),
  );
  const [submitting, setSubmitting] = useState(false);
  const [infoField, setInfoField] = useState<MeasurementFieldKey | null>(null);

  const hasAnyValue =
    [weightKg, heightCm, bodyFatPct, muscleMassPct, waterPct, boneMassKg, visceralFat, bmrKcal].some(
      (value) => value.trim() !== "",
    ) || photos.length > 0;

  function resetForm() {
    setWeightKg("");
    setHeightCm("");
    setBodyFatPct("");
    setMuscleMassPct("");
    setWaterPct("");
    setBoneMassKg("");
    setVisceralFat("");
    setBmrKcal("");
    setPhotos([]);
    setNote("");
    setShowMore(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!hasAnyValue || submitting) return;

    setSubmitting(true);
    try {
      const input: BodyMeasurementInput = {
        date: parseDateInput(date),
        weightKg: numOrNull(weightKg),
        heightCm: numOrNull(heightCm),
        bodyFatPct: numOrNull(bodyFatPct),
        muscleMassPct: numOrNull(muscleMassPct),
        waterPct: numOrNull(waterPct),
        boneMassKg: numOrNull(boneMassKg),
        visceralFat: numOrNull(visceralFat),
        bmrKcal: numOrNull(bmrKcal),
        photos,
        note: note.trim(),
      };

      if (isEdit && measurement) {
        await updateMeasurement(profileId, measurement.id, input, measurement.photos);
        toast.success("Medidas atualizadas!");
        onClose();
      } else {
        const measurementInput: BodyMeasurement = { id: "pending", ...input, createdAt: Date.now() };
        const newlyUnlocked = detectNewlyUnlocked(
          { sessions, runs, measurements },
          { sessions, runs, measurements: [...measurements, measurementInput] },
        );

        await createMeasurement(profileId, input);
        toast.success("Medidas registradas!");
        resetForm();

        if (newlyUnlocked.length > 0) {
          setCelebrating(newlyUnlocked);
        } else {
          onClose();
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Editar medidas" : "Registrar medidas"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Data">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </Field>

        <MultiImageUpload
          label="Fotos de progresso (opcional, pode adicionar mais de uma)"
          values={photos}
          onChange={setPhotos}
          folder="progress-photos"
        />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso (kg)">
            <Input
              type="number"
              min={0}
              step="0.1"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              placeholder="Opcional"
              autoFocus
            />
          </Field>
          <Field label="Altura (cm)">
            <Input
              type="number"
              min={0}
              step="0.1"
              value={heightCm}
              onChange={(event) => setHeightCm(event.target.value)}
              placeholder="Opcional"
            />
          </Field>
        </div>

        <button
          type="button"
          onClick={() => setShowMore((current) => !current)}
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          {showMore ? "Ocultar detalhes de bioimpedância" : "+ Detalhes de bioimpedância (opcional)"}
        </button>

        {showMore ? (
          <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label={<InfoLabel text="Gordura corporal (%)" onInfo={() => setInfoField("bodyFatPct")} />}>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={bodyFatPct}
                  onChange={(event) => setBodyFatPct(event.target.value)}
                  placeholder="Opcional"
                />
              </Field>
              <Field label={<InfoLabel text="Massa muscular (%)" onInfo={() => setInfoField("muscleMassPct")} />}>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={muscleMassPct}
                  onChange={(event) => setMuscleMassPct(event.target.value)}
                  placeholder="Opcional"
                />
              </Field>
              <Field label={<InfoLabel text="Água corporal (%)" onInfo={() => setInfoField("waterPct")} />}>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={waterPct}
                  onChange={(event) => setWaterPct(event.target.value)}
                  placeholder="Opcional"
                />
              </Field>
              <Field label={<InfoLabel text="Massa óssea (kg)" onInfo={() => setInfoField("boneMassKg")} />}>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={boneMassKg}
                  onChange={(event) => setBoneMassKg(event.target.value)}
                  placeholder="Opcional"
                />
              </Field>
              <Field label={<InfoLabel text="Gordura visceral" onInfo={() => setInfoField("visceralFat")} />}>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={visceralFat}
                  onChange={(event) => setVisceralFat(event.target.value)}
                  placeholder="Opcional"
                />
              </Field>
              <Field label={<InfoLabel text="Metabolismo basal (kcal)" onInfo={() => setInfoField("bmrKcal")} />}>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={bmrKcal}
                  onChange={(event) => setBmrKcal(event.target.value)}
                  placeholder="Opcional"
                />
              </Field>
            </div>
          </div>
        ) : null}

        <Field label="Nota (opcional)">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Como foi a pesagem, condições, etc."
          />
        </Field>

        <Button type="submit" className="w-full" disabled={submitting || !hasAnyValue}>
          {submitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Registrar medidas"}
        </Button>
      </form>

      <AchievementUnlockModal
        achievements={celebrating}
        open={celebrating.length > 0}
        onClose={() => {
          setCelebrating([]);
          onClose();
        }}
      />

      <MeasurementInfoModal field={infoField} open={infoField !== null} onClose={() => setInfoField(null)} />
    </Modal>
  );
}
