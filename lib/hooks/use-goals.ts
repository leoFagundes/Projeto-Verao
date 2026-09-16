"use client";

import { useEffect, useState } from "react";

import { subscribeGoals } from "@/lib/firebase/goals";
import type { MeasurementGoal } from "@/types/measurement";

export function useGoals(profileId: string) {
  const [goals, setGoals] = useState<MeasurementGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackedId, setTrackedId] = useState(profileId);

  if (trackedId !== profileId) {
    setTrackedId(profileId);
    setGoals([]);
    setLoading(true);
  }

  useEffect(() => {
    const unsubscribe = subscribeGoals(profileId, (data) => {
      setGoals(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [profileId]);

  return { goals, loading };
}
