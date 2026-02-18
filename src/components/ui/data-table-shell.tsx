import type { ReactNode } from "react";

export const DataTableShell = ({
  children,
  minWidthClass = "min-w-[900px]",
}: {
  children: ReactNode;
  minWidthClass?: string;
}) => (
  <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
    <table className={`w-full ${minWidthClass} text-left text-sm`}>{children}</table>
  </div>
);
