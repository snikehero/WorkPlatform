const AUTH_KEY = "workplatform-auth";
const DEMO_USER = { email: "admin", password: "12345" };

type AuthState = {
  isAuthenticated: boolean;
  userEmail: string | null;
};

const loadState = (): AuthState => {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return { isAuthenticated: false, userEmail: null };

  try {
    const parsed = JSON.parse(raw) as AuthState;
    return parsed;
  } catch {
    return { isAuthenticated: false, userEmail: null };
  }
};

let state: AuthState = loadState();

const saveState = () => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
};

export const useAuthStore = {
  getState: () => state,
  login: (email: string, password: string) => {
    const isDemoLogin =
      email === DEMO_USER.email && password === DEMO_USER.password;

    if (!isDemoLogin) return false;

    state = { isAuthenticated: true, userEmail: email };
    saveState();
    return true;
  },
  logout: () => {
    state = { isAuthenticated: false, userEmail: null };
    saveState();
  },
};
