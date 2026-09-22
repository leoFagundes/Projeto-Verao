export type Theme = "padrao" | "verde" | "rosa" | "roxo" | "laranja" | "ciano";

export type LinkedAuthProvider = "password" | "google";

/** A real, verifiable identity (email+password or Google) linked to this
 * profile purely for recovery — independent of the device-wide anonymous
 * session the app itself authenticates with, and never required to use the
 * app day to day. */
export type LinkedAuth = {
  provider: LinkedAuthProvider;
  email: string;
};

export type Profile = {
  id: string;
  name: string;
  photoUrl: string | null;
  theme: Theme;
  /** Optional soft PIN gate on this profile — same client-side model as ADMIN_PASSCODE, not real auth. */
  password: string | null;
  /** When true, this profile can be picked as a target for "add this workout to another profile" while someone else performs it. */
  allowSharedWorkouts: boolean;
  linkedAuth: LinkedAuth | null;
  createdAt: number;
};

export type ProfileInput = {
  name: string;
  photoUrl: string | null;
  theme: Theme;
  password: string | null;
  allowSharedWorkouts: boolean;
};
