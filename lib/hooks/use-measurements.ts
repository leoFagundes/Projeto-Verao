"use client";

import { useEffect, useState } from "react";

import { subscribeMeasurements } from "@/lib/firebase/measurements";
import type { BodyMeasurement } from "@/types/measurement";

export function useMeasurements(profileId: string) {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackedId, setTrackedId] = useState(profileId);

  if (trackedId !== profileId) {
    setTrackedId(profileId);
    setMeasurements([]);
    setLoading(true);
  }

  useEffect(() => {
    const unsubscribe = subscribeMeasurements(profileId, (data) => {
      setMeasurements(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [profileId]);

  return { measurements, loading };
}
