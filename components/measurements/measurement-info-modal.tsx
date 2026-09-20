"use client";

import { Modal } from "@/components/ui/modal";
import { MEASUREMENT_REFERENCE } from "@/lib/measurement-reference";
import { MEASUREMENT_FIELDS, type MeasurementFieldKey } from "@/types/measurement";

export function MeasurementInfoModal({
  field,
  open,
  onClose,
}: {
  field: MeasurementFieldKey | null;
  open: boolean;
  onClose: () => void;
}) {
  const meta = field ? MEASUREMENT_FIELDS.find((item) => item.key === field) : null;
  const reference = field ? MEASUREMENT_REFERENCE[field] : null;

  if (!meta || !reference) return null;

  return (
    <Modal open={open} onClose={onClose} title={meta.label}>
      <div className="space-y-4 text-sm">
        <p className="text-slate-300">{reference.what}</p>

        {reference.table ? (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full min-w-[420px] border-collapse text-left text-xs sm:text-sm">
              <thead className="bg-[var(--surface-2)]">
                <tr>
                  {reference.table.columns.map((column) => (
                    <th
                      key={column}
                      className="border-b border-[var(--border)] px-3 py-2 font-medium text-slate-300"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {reference.table.rows.map((row, index) => (
                  <tr key={index}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-2 text-slate-200">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {reference.notes.length > 0 ? (
          <ul className="list-disc space-y-1.5 pl-4 text-slate-400">
            {reference.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        ) : null}

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-slate-500">
          <p>{reference.source}</p>
          <p className="mt-1.5">
            Valores de referência gerais, não um diagnóstico — fatores individuais (genética, histórico de treino,
            saúde) importam muito, e a bioimpedância caseira tem margem de erro em relação a exames padrão-ouro.
            Para uma avaliação precisa, converse com um profissional de saúde.
          </p>
        </div>
      </div>
    </Modal>
  );
}
