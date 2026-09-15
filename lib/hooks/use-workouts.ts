"use client";

import { useEffect, useState } from "react";

import { subscribeWorkouts } from "@/lib/firebase/workouts";
import type { Workout } from "@/types/workout";

export function useWorkouts(profileId: string) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackedId, setTrackedId] = useState(profileId);

  if (trackedId !== profileId) {
    setTrackedId(profileId);
    setWorkouts([]);
    setLoading(true);
  }

  useEffect(() => {
    const unsubscribe = subscribeWorkouts(profileId, (data) => {
      setWorkouts(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [profileId]);

  return { workouts, loading };
}
