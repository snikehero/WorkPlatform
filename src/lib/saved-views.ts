import { useAuthStore } from "@/stores/auth-store";

const SAVED_VIEW_PREFIX = "workplatform-saved-view";

const buildKey = (viewId: string) => {
  const userEmail = useAuthStore.getState().userEmail ?? "anonymous";
  return `${SAVED_VIEW_PREFIX}:${userEmail}:${viewId}`;
};

export const loadSavedView = <T>(viewId: string, fallback: T): T => {
  const raw = localStorage.getItem(buildKey(viewId));
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const saveSavedView = (viewId: string, payload: unknown) => {
  localStorage.setItem(buildKey(viewId), JSON.stringify(payload));
};
