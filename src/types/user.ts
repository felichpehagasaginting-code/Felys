export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string | null;
  activeMode: "academic" | "finance";
  theme: "light" | "dark";
  createdAt: string;
  updatedAt: string;
}
