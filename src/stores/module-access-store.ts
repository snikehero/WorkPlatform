import { apiRequest } from "@/lib/api";
import { buildModuleAccessMap, DEFAULT_MODULE_ACCESS } from "@/lib/module-access";
import type { AppModule, AppRole, ModuleAccessMe, ModuleAccessMap } from "@/types/module-access";

const MODULE_ACCESS_KEY = "workplatform-module-access";
const AUTH_KEY = "workplatform-auth";

type ModuleAccessState = {
  role: AppRole | null;
  modules: ModuleAccessMap;
};

type Listener = (state: ModuleAccessState) => void;

const resolveRole = (): AppRole => {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return "user";
  try {
    const parsed = JSON.parse(raw) as Partial<{ role: AppRole }>;
    if (parsed.role === "admin" || parsed.role === "developer" || parsed.role === "user") return parsed.role;
  } catch {
    return "user";
  }
  return "user";
};

const loadState = (): ModuleAccessState => {
  const fallbackRole = resolveRole();
  const raw = localStorage.getItem(MODULE_ACCESS_KEY);
  if (!raw) {
    return { role: null, modules: DEFAULT_MODULE_ACCESS[fallbackRole] };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<{ role: AppRole; modules: Partial<Record<string, boolean>> }>;
    const parsedRole = parsed.role === "admin" || parsed.role === "developer" || parsed.role === "user" ? parsed.role : fallbackRole;
    return {
      role: parsedRole,
      modules: buildModuleAccessMap(parsedRole, parsed.modules),
    };
  } catch {
    return { role: null, modules: DEFAULT_MODULE_ACCESS[fallbackRole] };
  }
};

let state: ModuleAccessState = loadState();
const listeners = new Set<Listener>();

const save = () => {
  localStorage.setItem(MODULE_ACCESS_KEY, JSON.stringify(state));
};

const publish = () => {
  for (const listener of listeners) listener(state);
};

const setState = (next: ModuleAccessState) => {
  state = next;
  save();
  publish();
};

export const moduleAccessStore = {
  getState: () => state,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  canAccess: (module: AppModule) => Boolean(state.modules[module]),
  refreshMine: async () => {
    resolveRole();
    const data = await apiRequest<ModuleAccessMe>("/api/module-access/me");
    setState({
      role: data.role,
      modules: buildModuleAccessMap(data.role, data.modules),
    });
    return true;
  },
  resetToRoleDefaults: (role: AppRole | null) => {
    const effective = role ?? "user";
    setState({ role, modules: DEFAULT_MODULE_ACCESS[effective] });
  },
  clear: () => {
    localStorage.removeItem(MODULE_ACCESS_KEY);
    state = { role: null, modules: DEFAULT_MODULE_ACCESS.user };
    publish();
  },
};
