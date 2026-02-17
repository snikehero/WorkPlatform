export type AppUser = {
  id: string;
  email: string;
  role: "admin" | "developer" | "user";
  preferredLanguage: "en" | "es";
  createdAt: string;
};
