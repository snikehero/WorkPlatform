export type AppUser = {
  id: string;
  email: string;
  role: "admin" | "developer" | "user";
  preferredLanguage: "en" | "es";
  mustSetPassword?: boolean;
  createdAt: string;
};

export type AdminUserListResponse = {
  items: AppUser[];
  total: number;
  page: number;
  pageSize: number;
};
