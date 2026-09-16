"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { setGoal } from "@/lib/firebase/goals";
import { MEASUREMENT_FIELDS, type BodyMeasurement, type MeasurementFieldKey } from "@/types/measurement";

export function GoalFormModal({
  open,
  onClose,
  profileId,
  measurements,
}: {
  open: boolean;
  onClose: () => void;
  profileId: string;
  measurements: BodyMeasurement[];
}) {
  const availableFields = MEASUREMENT_FIELDS.filter((field) =>
    measurements.some((m) => m[field.key] != null),
  );
  const [field, setField] = useState<MeasurementFieldKey>(availableFields[0]?.key ?? "weightKg");
  const [targetValue, setTargetValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fieldMeta = MEASUREMENT_FIELDS.find((f) => f.key === field);
  const latestEntry = [...measurements].sort((a, b) => b.date - a.date).find((m) => m[field] != null);
  const startValue = latestEntry ? (latestEntry[field] as number) : null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!targetValue.trim() || startValue == null || submitting) return;

    setSubmitting(true);
    try {
      await setGoal(profileId, { field, targetValue: Number(targetValue), startValue });
      toast.success("Meta definida!");
      setTargetValue("");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova meta">
      {availableFields.length === 0 ? (
        <p className="text-sm text-slate-400">
          Registre ao menos uma medida antes de criar uma meta — ela precisa de um ponto de partida.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Medida">
            <Select value={field} onChange={(event) => setField(event.target.value as MeasurementFieldKey)}>
              {availableFields.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>

          {startValue != null ? (
            <p className="text-sm text-slate-400">
              Valor atual:{" "}
              <span className="font-medium text-white">
                {startValue}
                {fieldMeta?.unit}
              </span>
            </p>
          ) : null}

          <Field label={`Meta${fieldMeta?.unit ? ` (${fieldMeta.unit})` : ""}`}>
            <Input
              type="number"
              step="0.1"
              value={targetValue}
              onChange={(event) => setTargetValue(event.target.value)}
              placeholder="Ex.: 75"
              required
              autoFocus
            />
          </Field>

          <Button type="submit" className="w-full" disabled={submitting || !targetValue.trim()}>
            {submitting ? "Salvando..." : "Definir meta"}
          </Button>
        </form>
      )}
    </Modal>
  );
}
