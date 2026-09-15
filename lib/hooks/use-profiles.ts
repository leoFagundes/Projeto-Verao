"use client";

import { useEffect, useState } from "react";

import { subscribeProfiles } from "@/lib/firebase/profiles";
import type { Profile } from "@/types/profile";

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeProfiles(
      (data) => {
        setProfiles(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { profiles, loading, error };
}
