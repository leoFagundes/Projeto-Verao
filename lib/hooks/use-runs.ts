"use client";

import { useEffect, useState } from "react";

import { subscribeRuns } from "@/lib/firebase/runs";
import type { Run } from "@/types/run";

export function useRuns(profileId: string) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackedId, setTrackedId] = useState(profileId);

  if (trackedId !== profileId) {
    setTrackedId(profileId);
    setRuns([]);
    setLoading(true);
  }

  useEffect(() => {
    const unsubscribe = subscribeRuns(profileId, (data) => {
      setRuns(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [profileId]);

  return { runs, loading };
}
