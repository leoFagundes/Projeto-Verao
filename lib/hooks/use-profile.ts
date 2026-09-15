"use client";

import { useMemo } from "react";

import { useProfiles } from "./use-profiles";

export function useProfile(profileId: string) {
  const { profiles, loading, error } = useProfiles();

  const profile = useMemo(
    () => profiles.find((item) => item.id === profileId) ?? null,
    [profiles, profileId],
  );

  return { profile, loading, error };
}
