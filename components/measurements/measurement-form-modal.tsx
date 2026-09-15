"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import { Modal } from "@/components/ui/modal";
import { createMeasurement, updateMeasurement } from "@/lib/firebase/measurements";
import { formatDateInput, parseDateInput } from "@/lib/utils";
import type { BodyMeasurement, BodyMeasurementInput } from "@/types/measurement";

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

  const [date, setDate] = useState(() => formatDateInput(measurement?.date ?? Date.now()));
  const [weightKg, setWeightKg] = useState(measurement?.weightKg?.toString() ?? "");
  const [heightCm, setHeightCm] = useState(measurement?.heightCm?.toString() ?? "");
  const [bodyFatPct, setBodyFatPct] = useState(measurement?.bodyFatPct?.toString() ?? "");
  const [muscleMassPct, setMuscleMassPct] = useState(measurement?.muscleMassPct?.toString() ?? "");
  const [waterPct, setWaterPct] = useState(measurement?.waterPct?.toString() ?? "");
  const [boneMassKg, setBoneMassKg] = useState(measurement?.boneMassKg?.toString() ?? "");
  const [visceralFat, setVisceralFat] = useState(measurement?.visceralFat?.toString() ?? "");
  const [bmrKcal, setBmrKcal] = useState(measurement?.bmrKcal?.toString() ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(measurement?.photoUrl ?? null);
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

  const hasAnyValue =
    [weightKg, heightCm, bodyFatPct, muscleMassPct, waterPct, boneMassKg, visceralFat, bmrKcal].some(
      (value) => value.trim() !== "",
    ) || photoUrl != null;

  function resetForm() {
    setWeightKg("");
    setHeightCm("");
    setBodyFatPct("");
    setMuscleMassPct("");
    setWaterPct("");
    setBoneMassKg("");
    setVisceralFat("");
    setBmrKcal("");
    setPhotoUrl(null);
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
        photoUrl,
        note: note.trim(),
      };

      if (isEdit && measurement) {
        await updateMeasurement(profileId, measurement.id, input, measurement.photoUrl);
        toast.success("Medidas atualizadas!");
      } else {
        await createMeasurement(profileId, input);
        toast.success("Medidas registradas!");
        resetForm();
      }
      onClose();
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

        <ImageUpload
          label="Foto de progresso (opcional)"
          value={photoUrl}
          onChange={setPhotoUrl}
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
              <Field label="Gordura corporal (%)">
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={bodyFatPct}
                  onChange={(event) => setBodyFatPct(event.target.value)}
                  placeholder="Opcional"
                />
              </Field>
              <Field label="Massa muscular (%)">
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={muscleMassPct}
                  onChange={(event) => setMuscleMassPct(event.target.value)}
                  placeholder="Opcional"
                />
              </Field>
              <Field label="Água corporal (%)">
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={waterPct}
                  onChange={(event) => setWaterPct(event.target.value)}
                  placeholder="Opcional"
                />
              </Field>
              <Field label="Massa óssea (kg)">
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={boneMassKg}
                  onChange={(event) => setBoneMassKg(event.target.value)}
                  placeholder="Opcional"
                />
              </Field>
              <Field label="Gordura visceral">
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={visceralFat}
                  onChange={(event) => setVisceralFat(event.target.value)}
                  placeholder="Opcional"
                />
              </Field>
              <Field label="Metabolismo basal (kcal)">
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
    </Modal>
  );
}
