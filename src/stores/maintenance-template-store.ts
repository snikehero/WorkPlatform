type TemplateState = {
  file: File | null;
  name: string | null;
};

type Listener = (state: TemplateState) => void;

const STORAGE_KEY = "workplatform-maintenance-template";

type StoredTemplate = {
  name: string;
  type: string;
  data: string;
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const loadInitialState = (): TemplateState => {
  if (typeof window === "undefined") return { file: null, name: null };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { file: null, name: null };
  try {
    const parsed = JSON.parse(raw) as StoredTemplate;
    if (!parsed?.name || !parsed?.data) return { file: null, name: null };
    const bytes = base64ToBytes(parsed.data);
    const type = parsed.type || "application/octet-stream";
    const file = new File([bytes.buffer as ArrayBuffer], parsed.name, { type });
    return { file, name: parsed.name };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { file: null, name: null };
  }
};

let state: TemplateState = loadInitialState();

const listeners = new Set<Listener>();

const publish = () => {
  for (const listener of listeners) listener(state);
};

export const maintenanceTemplateStore = {
  getState: () => state,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  setTemplate: (file: File | null, name: string | null) => {
    state = { file, name };
    if (typeof window !== "undefined" && !file) {
      localStorage.removeItem(STORAGE_KEY);
    }
    publish();
  },
  setTemplateFromFile: async (file: File) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const payload: StoredTemplate = {
      name: file.name,
      type: file.type || "application/octet-stream",
      data: bytesToBase64(bytes),
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
    state = { file, name: file.name };
    publish();
  },
};
