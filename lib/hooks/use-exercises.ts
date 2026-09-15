"use client";

import { useEffect, useState } from "react";

import { subscribeExercises } from "@/lib/firebase/exercises";
import type { ExerciseDef } from "@/types/exercise";

export function useExercises() {
  const [exercises, setExercises] = useState<ExerciseDef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeExercises((data) => {
      setExercises(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { exercises, loading };
}
