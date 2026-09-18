"use client";

import { useEffect, useState } from "react";

import { subscribeDietHistory } from "@/lib/firebase/diets";
import type { DietHistoryEntry } from "@/types/diet";

export function useDietHistory(profileId: string) {
  const [entries, setEntries] = useState<DietHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackedId, setTrackedId] = useState(profileId);

  if (trackedId !== profileId) {
    setTrackedId(profileId);
    setEntries([]);
    setLoading(true);
  }

  useEffect(() => {
    const unsubscribe = subscribeDietHistory(profileId, (data) => {
      setEntries(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [profileId]);

  return { entries, loading };
}
