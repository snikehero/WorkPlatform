import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (title: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICON_BY_VARIANT = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
} as const;

const CLASS_BY_VARIANT = {
  success: "border-emerald-400/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  error: "border-rose-400/50 bg-rose-500/10 text-rose-700 dark:text-rose-200",
  info: "border-sky-400/50 bg-sky-500/10 text-sky-700 dark:text-sky-200",
} as const;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, variant: ToastVariant = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((current) => [...current.slice(-2), { id, title, variant }]);
      window.setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-2">
        {toasts.map((item) => {
          const Icon = ICON_BY_VARIANT[item.variant];
          return (
            <div
              key={item.id}
              role="status"
              aria-live="polite"
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-lg border px-3 py-2 text-sm shadow-lg backdrop-blur",
                CLASS_BY_VARIANT[item.variant]
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0" />
              <p className="flex-1">{item.title}</p>
              <button
                type="button"
                className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/5"
                aria-label="Dismiss notification"
                onClick={() => dismiss(item.id)}
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
