export type AppRole = "admin" | "developer" | "user";

export type AppModule = "personal" | "work" | "tickets" | "assets" | "admin";

export type ModuleAccessMap = Record<AppModule, boolean>;

export type RoleModuleAccess = {
  role: AppRole;
  module: AppModule;
  enabled: boolean;
  updatedAt: string;
};

export type ModuleAccessMe = {
  role: AppRole;
  modules: ModuleAccessMap;
};
