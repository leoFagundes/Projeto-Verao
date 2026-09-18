"use client";

import { useEffect, useState } from "react";

import { subscribeDiets } from "@/lib/firebase/diets";
import type { Diet } from "@/types/diet";

export function useDiets(profileId: string) {
  const [diets, setDiets] = useState<Diet[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackedId, setTrackedId] = useState(profileId);

  if (trackedId !== profileId) {
    setTrackedId(profileId);
    setDiets([]);
    setLoading(true);
  }

  useEffect(() => {
    const unsubscribe = subscribeDiets(profileId, (data) => {
      setDiets(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [profileId]);

  return { diets, loading };
}
