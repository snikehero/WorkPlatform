import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        neutral: "border-border text-foreground",
        warning: "border-amber-300/40 bg-amber-400/10 text-amber-700 dark:text-amber-300",
        success: "border-emerald-300/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
        info: "border-sky-300/40 bg-sky-400/10 text-sky-700 dark:text-sky-300",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
