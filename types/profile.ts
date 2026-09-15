export type Theme = "padrao" | "verde" | "rosa";

export type Profile = {
  id: string;
  name: string;
  photoUrl: string | null;
  theme: Theme;
  createdAt: number;
};

export type ProfileInput = {
  name: string;
  photoUrl: string | null;
  theme: Theme;
};
