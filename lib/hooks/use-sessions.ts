"use client";

import { useEffect, useState } from "react";

import { subscribeSessions } from "@/lib/firebase/sessions";
import type { WorkoutSession } from "@/types/session";

export function useSessions(profileId: string) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackedId, setTrackedId] = useState(profileId);

  if (trackedId !== profileId) {
    setTrackedId(profileId);
    setSessions([]);
    setLoading(true);
  }

  useEffect(() => {
    const unsubscribe = subscribeSessions(profileId, (data) => {
      setSessions(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [profileId]);

  return { sessions, loading };
}
