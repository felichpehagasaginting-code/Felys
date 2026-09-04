export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string | null;
  activeMode: "academic" | "finance";
  theme: "light" | "dark";
  /** P3: true bila user menyelesaikan/melewati wizard onboarding. */
  hasOnboarded?: boolean;
  createdAt: string;
  updatedAt: string;
}
