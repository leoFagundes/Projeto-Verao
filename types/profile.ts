export type Theme = "padrao" | "verde" | "rosa" | "roxo" | "laranja" | "ciano";

export type Profile = {
  id: string;
  name: string;
  photoUrl: string | null;
  theme: Theme;
  /** Optional soft PIN gate on this profile — same client-side model as ADMIN_PASSCODE, not real auth. */
  password: string | null;
  /** When true, this profile can be picked as a target for "add this workout to another profile" while someone else performs it. */
  allowSharedWorkouts: boolean;
  createdAt: number;
};

export type ProfileInput = {
  name: string;
  photoUrl: string | null;
  theme: Theme;
  password: string | null;
  allowSharedWorkouts: boolean;
};
