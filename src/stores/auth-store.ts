import { apiRequest } from "@/lib/api";
import { moduleAccessStore } from "@/stores/module-access-store";

const AUTH_KEY = "workplatform-auth";

type AuthState = {
  isAuthenticated: boolean;
  userEmail: string | null;
  role: "admin" | "developer" | "user" | null;
  token: string | null;
  preferredLanguage: "en" | "es";
  name: string | null;
  department: string | null;
  title: string | null;
  mobile: string | null;
};

type AuthResponse = {
  token: string;
  user_email: string;
  role: "admin" | "developer" | "user";
  preferred_language: "en" | "es";
  name?: string | null;
  department?: string | null;
  title?: string | null;
  mobile?: string | null;
};

const loadState = (): AuthState => {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) {
    return {
      isAuthenticated: false,
      userEmail: null,
      role: null,
      token: null,
      preferredLanguage: "en",
      name: null,
      department: null,
      title: null,
      mobile: null,
    };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    return {
      isAuthenticated: Boolean(parsed.token),
      userEmail: parsed.userEmail ?? null,
      role: parsed.role ?? null,
      token: parsed.token ?? null,
      preferredLanguage: parsed.preferredLanguage === "es" ? "es" : "en",
      name: parsed.name ?? null,
      department: parsed.department ?? null,
      title: parsed.title ?? null,
      mobile: parsed.mobile ?? null,
    };
  } catch {
    return {
      isAuthenticated: false,
      userEmail: null,
      role: null,
      token: null,
      preferredLanguage: "en",
      name: null,
      department: null,
      title: null,
      mobile: null,
    };
  }
};

let state: AuthState = loadState();

const saveState = () => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
};

export const useAuthStore = {
  getState: () => state,
  login: async (email: string, password: string) => {
    const result = await apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    state = {
      isAuthenticated: true,
      userEmail: result.user_email,
      role: result.role,
      token: result.token,
      preferredLanguage: result.preferred_language,
      name: result.name ?? null,
      department: result.department ?? null,
      title: result.title ?? null,
      mobile: result.mobile ?? null,
    };
    saveState();
    await moduleAccessStore.refreshMine().catch(() => moduleAccessStore.resetToRoleDefaults(state.role));
    return true;
  },
  activate: async (token: string, newPassword: string) => {
    const result = await apiRequest<AuthResponse>("/api/auth/activate", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
    state = {
      isAuthenticated: true,
      userEmail: result.user_email,
      role: result.role,
      token: result.token,
      preferredLanguage: result.preferred_language,
      name: result.name ?? null,
      department: result.department ?? null,
      title: result.title ?? null,
      mobile: result.mobile ?? null,
    };
    saveState();
    await moduleAccessStore.refreshMine().catch(() => moduleAccessStore.resetToRoleDefaults(state.role));
    return true;
  },
  register: async (
    email: string,
    password: string,
    role: "admin" | "developer" | "user" = "user"
  ) => {
    const result = await apiRequest<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
    state = {
      isAuthenticated: true,
      userEmail: result.user_email,
      role: result.role,
      token: result.token,
      preferredLanguage: result.preferred_language,
      name: result.name ?? null,
      department: result.department ?? null,
      title: result.title ?? null,
      mobile: result.mobile ?? null,
    };
    saveState();
    await moduleAccessStore.refreshMine().catch(() => moduleAccessStore.resetToRoleDefaults(state.role));
    return true;
  },
  refreshMe: async () => {
    if (!state.token) return false;
    try {
      const me = await apiRequest<{
        user_email: string;
        role: "admin" | "developer" | "user";
        preferred_language: "en" | "es";
        name: string | null;
        department: string | null;
        title: string | null;
        mobile: string | null;
      }>("/api/auth/me");
      state = {
        ...state,
        isAuthenticated: true,
        userEmail: me.user_email,
        role: me.role,
        preferredLanguage: me.preferred_language,
        name: me.name ?? null,
        department: me.department ?? null,
        title: me.title ?? null,
        mobile: me.mobile ?? null,
      };
      saveState();
      await moduleAccessStore.refreshMine().catch(() => moduleAccessStore.resetToRoleDefaults(state.role));
      return true;
    } catch {
      state = {
        isAuthenticated: false,
        userEmail: null,
        role: null,
        token: null,
        preferredLanguage: "en",
        name: null,
        department: null,
        title: null,
        mobile: null,
      };
      localStorage.removeItem(AUTH_KEY);
      moduleAccessStore.clear();
      return false;
    }
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    await apiRequest<{ ok: boolean }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return true;
  },
  updateLanguage: async (preferredLanguage: "en" | "es") => {
    await apiRequest<{ ok: boolean; preferred_language: "en" | "es" }>("/api/account/preferences", {
      method: "PATCH",
      body: JSON.stringify({ preferredLanguage }),
    });
    state = { ...state, preferredLanguage };
    saveState();
    return true;
  },
  logout: () => {
    state = {
      isAuthenticated: false,
      userEmail: null,
      role: null,
      token: null,
      preferredLanguage: "en",
      name: null,
      department: null,
      title: null,
      mobile: null,
    };
    localStorage.removeItem(AUTH_KEY);
    moduleAccessStore.clear();
  },
};
