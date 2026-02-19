import type { AppModule, AppRole, ModuleAccessMap } from "@/types/module-access";

export const MODULES: AppModule[] = ["personal", "work", "tickets", "assets", "admin"];

export const DEFAULT_MODULE_ACCESS: Record<AppRole, ModuleAccessMap> = {
  admin: {
    personal: true,
    work: true,
    tickets: true,
    assets: true,
    admin: true,
  },
  developer: {
    personal: true,
    work: true,
    tickets: true,
    assets: true,
    admin: false,
  },
  user: {
    personal: true,
    work: true,
    tickets: true,
    assets: false,
    admin: false,
  },
};

export const buildModuleAccessMap = (role: AppRole, partial?: Partial<Record<string, boolean>>): ModuleAccessMap => {
  const defaults = DEFAULT_MODULE_ACCESS[role];
  return {
    personal: typeof partial?.personal === "boolean" ? partial.personal : defaults.personal,
    work: typeof partial?.work === "boolean" ? partial.work : defaults.work,
    tickets: typeof partial?.tickets === "boolean" ? partial.tickets : defaults.tickets,
    assets: typeof partial?.assets === "boolean" ? partial.assets : defaults.assets,
    admin: typeof partial?.admin === "boolean" ? partial.admin : defaults.admin,
  };
};

export const getDefaultLandingPath = (role: AppRole | null, modules: ModuleAccessMap): string => {
  if (!role) return "/login";
  if (modules.personal) return "/dashboard";
  if (modules.tickets) return role === "admin" || role === "developer" ? "/tickets/open" : "/tickets/create";
  if (modules.work) return "/notifications";
  if (modules.assets && (role === "admin" || role === "developer")) return "/assets/dashboard";
  if (modules.admin && role === "admin") return "/admin";
  return "/account";
};
