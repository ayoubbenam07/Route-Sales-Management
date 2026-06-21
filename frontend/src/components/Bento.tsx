import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BentoCard({
  className,
  children,
  title,
  subtitle,
  icon,
}: {
  className?: string;
  children?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className={cn("surface-card p-6 transition-shadow hover:shadow-md", className)}>
      {(title || icon) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && (
              <div className="text-sm font-medium text-muted-foreground">{title}</div>
            )}
            {subtitle && (
              <div className="mt-1 text-xs text-muted-foreground/80">{subtitle}</div>
            )}
          </div>
          {icon && (
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
              {icon}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatusPill({ status }: { status: "PAID" | "PARTIAL" | "UNPAID" }) {
  const map = {
    PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    PARTIAL: "bg-blue-50 text-blue-700 ring-blue-200",
    UNPAID: "bg-rose-50 text-rose-700 ring-rose-200",
  } as const;
  const labels = { PAID: "Payé", PARTIAL: "Partiel", UNPAID: "Impayé" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        map[status],
      )}
    >
      {labels[status]}
    </span>
  );
}
