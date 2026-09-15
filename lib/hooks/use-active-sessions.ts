"use client";

import { useEffect, useState } from "react";

import { subscribeActiveSessions } from "@/lib/firebase/active-sessions";
import type { ActiveSession } from "@/types/session";

export function useActiveSessions(profileId: string) {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackedId, setTrackedId] = useState(profileId);

  if (trackedId !== profileId) {
    setTrackedId(profileId);
    setActiveSessions([]);
    setLoading(true);
  }

  useEffect(() => {
    const unsubscribe = subscribeActiveSessions(profileId, (data) => {
      setActiveSessions(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [profileId]);

  return { activeSessions, loading };
}
