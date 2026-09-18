"use client";

import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { AchievementUnlockModal } from "@/components/achievements/achievement-unlock-modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { type Achievement, detectNewlyUnlocked } from "@/lib/achievements";
import { createRun, updateRun } from "@/lib/firebase/runs";
import { useMeasurements } from "@/lib/hooks/use-measurements";
import { useProfiles } from "@/lib/hooks/use-profiles";
import { useRuns } from "@/lib/hooks/use-runs";
import { useSessions } from "@/lib/hooks/use-sessions";
import { playSound } from "@/lib/sound";
import { cn, formatDateInput, formatPace, parseDateInput } from "@/lib/utils";
import { RUN_TYPES, type Run, type RunType } from "@/types/run";

export function RunFormModal({
  open,
  onClose,
  profileId,
  run,
}: {
  open: boolean;
  onClose: () => void;
  profileId: string;
  run?: Run | null;
}) {
  const isEdit = Boolean(run);
  const { sessions } = useSessions(profileId);
  const { runs } = useRuns(profileId);
  const { measurements } = useMeasurements(profileId);
  const { profiles } = useProfiles();
  const shareableProfiles = profiles.filter(
    (profile) => profile.id !== profileId && profile.allowSharedWorkouts,
  );
  const [celebrating, setCelebrating] = useState<Achievement[]>([]);
  const [shareWithProfileIds, setShareWithProfileIds] = useState<string[]>([]);

  function toggleShareProfile(targetProfileId: string) {
    setShareWithProfileIds((current) =>
      current.includes(targetProfileId)
        ? current.filter((id) => id !== targetProfileId)
        : [...current, targetProfileId],
    );
  }

  const [date, setDate] = useState(() => formatDateInput(run?.date ?? Date.now()));
  const [type, setType] = useState<RunType>(run?.type ?? "normal");
  const [distanceKm, setDistanceKm] = useState(run && run.type === "normal" ? String(run.distanceKm) : "");
  const [repCount, setRepCount] = useState(run?.repCount ? String(run.repCount) : "");
  const [repDistanceM, setRepDistanceM] = useState(run?.repDistanceM ? String(run.repDistanceM) : "");
  const [minutes, setMinutes] = useState(run ? String(Math.floor(run.durationMin)) : "");
  const [seconds, setSeconds] = useState(
    run ? String(Math.round((run.durationMin % 1) * 60)) : "",
  );
  const [note, setNote] = useState(run?.note ?? "");
  const [submitting, setSubmitting] = useState(false);

  const isTiro = type === "tiro";
  const durationMin = (Number(minutes) || 0) + (Number(seconds) || 0) / 60;
  const repTotalKm = ((Number(repCount) || 0) * (Number(repDistanceM) || 0)) / 1000;
  const distance = isTiro ? repTotalKm : Number(distanceKm) || 0;

  const pacePreview = useMemo(() => {
    if (isTiro || distance <= 0 || durationMin <= 0) return null;
    return formatPace((durationMin * 60) / distance);
  }, [isTiro, distance, durationMin]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (distance <= 0 || durationMin <= 0 || submitting) return;

    setSubmitting(true);
    try {
      const input = {
        date: parseDateInput(date),
        type,
        distanceKm: distance,
        durationMin,
        repCount: isTiro ? Number(repCount) || null : null,
        repDistanceM: isTiro ? Number(repDistanceM) || null : null,
        note: note.trim(),
      };

      if (isEdit && run) {
        await updateRun(profileId, run.id, input);
        toast.success("Corrida atualizada!");
        onClose();
      } else {
        const runInput: Run = {
          id: "pending",
          ...input,
          sharedByName: null,
          paceSecPerKm: 0,
          createdAt: Date.now(),
        };
        const newlyUnlocked = detectNewlyUnlocked(
          { sessions, runs, measurements },
          { sessions, runs: [...runs, runInput], measurements },
        );

        await createRun(profileId, input);
        toast.success("Corrida registrada!");

        if (shareWithProfileIds.length > 0) {
          const myName = profiles.find((profile) => profile.id === profileId)?.name ?? "Alguém";
          const sharedNames: string[] = [];
          for (const targetProfileId of shareWithProfileIds) {
            try {
              await createRun(targetProfileId, { ...input, sharedByName: myName });
              sharedNames.push(profiles.find((profile) => profile.id === targetProfileId)?.name ?? "outro perfil");
            } catch {
              // Best-effort — one failed share shouldn't block the others or the main save.
            }
          }
          if (sharedNames.length > 0) {
            toast.success(`Corrida também registrada para ${sharedNames.join(", ")}.`);
          }
        }

        setType("normal");
        setDistanceKm("");
        setRepCount("");
        setRepDistanceM("");
        setMinutes("");
        setSeconds("");
        setNote("");
        setShareWithProfileIds([]);

        if (newlyUnlocked.length > 0) {
          // The achievement modal already plays this sound — avoid stacking it twice.
          setCelebrating(newlyUnlocked);
        } else {
          playSound("/sounds/tada.mp3", 0.35);
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Editar corrida" : "Registrar corrida"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Data">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </Field>

        <div>
          <span className="mb-2 block text-sm text-slate-300">Tipo de corrida</span>
          <div className="grid grid-cols-2 gap-2">
            {RUN_TYPES.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setType(option.key)}
                className={cn(
                  "rounded-2xl border p-2.5 text-center text-xs font-medium transition",
                  type === option.key
                    ? "border-[var(--accent)] text-white"
                    : "border-[var(--border)] text-slate-400 hover:text-white",
                )}
                style={type === option.key ? { background: "var(--accent-soft)" } : undefined}
              >
                <option.icon className="mx-auto mb-1 h-4 w-4" />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isTiro ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Repetições">
              <Input
                type="number"
                min={1}
                value={repCount}
                onChange={(event) => setRepCount(event.target.value)}
                placeholder="Ex.: 10"
                required
              />
            </Field>
            <Field label="Distância por tiro (m)">
              <Input
                type="number"
                min={1}
                value={repDistanceM}
                onChange={(event) => setRepDistanceM(event.target.value)}
                placeholder="Ex.: 200"
                required
              />
            </Field>
          </div>
        ) : (
          <Field label="Distância (km)">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={distanceKm}
              onChange={(event) => setDistanceKm(event.target.value)}
              required
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Min">
            <Input
              type="number"
              min={0}
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              required
            />
          </Field>
          <Field label="Seg">
            <Input
              type="number"
              min={0}
              max={59}
              value={seconds}
              onChange={(event) => setSeconds(event.target.value)}
            />
          </Field>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-slate-300">
          {isTiro ? (
            <>
              Distância total:{" "}
              <span className="font-semibold text-white">
                {repTotalKm > 0 ? `${repTotalKm.toFixed(2)} km` : "—"}
              </span>
            </>
          ) : (
            <>
              Ritmo estimado: <span className="font-semibold text-white">{pacePreview ?? "--:--/km"}</span>
            </>
          )}
        </div>

        <Field label="Nota (opcional)">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Percurso, sensação, clima..."
          />
        </Field>

        {!isEdit && shareableProfiles.length > 0 ? (
          <div>
            <span className="mb-2 block text-sm text-slate-300">Compartilhar esta corrida com (opcional)</span>
            <div className="flex flex-wrap gap-2">
              {shareableProfiles.map((profile) => {
                const selected = shareWithProfileIds.includes(profile.id);
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => toggleShareProfile(profile.id)}
                    aria-pressed={selected}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      selected
                        ? "border-[var(--accent)] text-[var(--bg)]"
                        : "border-[var(--border)] text-slate-300 hover:border-[var(--accent)]",
                    )}
                    style={selected ? { background: "var(--accent)" } : undefined}
                  >
                    {profile.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Ao registrar, essa corrida também entra no histórico e nas estatísticas dos perfis marcados.
            </p>
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting || distance <= 0 || durationMin <= 0}>
          {submitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Registrar corrida"}
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
    </Modal>
  );
}
