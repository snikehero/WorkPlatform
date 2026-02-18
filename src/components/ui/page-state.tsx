import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const LoadingState = ({ label = "Loading..." }: { label?: string }) => (
  <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <LoaderCircle className="size-4 animate-spin" />
      <span>{label}</span>
    </div>
  </div>
);

export const EmptyState = ({ label = "No items found." }: { label?: string }) => (
  <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
    <Inbox className="mr-2 size-4" />
    <span>{label}</span>
  </div>
);

export const ErrorState = ({ label, onRetry }: { label: string; onRetry?: () => void }) => (
  <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border border-rose-300/40 bg-rose-500/5 p-6 text-center">
    <p className="flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
      <AlertCircle className="size-4" />
      {label}
    </p>
    {onRetry ? (
      <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
        Retry
      </Button>
    ) : null}
  </div>
);
