import React, { type ReactNode } from "react";
import { View, Text } from "react-native";
import { cn } from "@/lib/utils";
import type { DealStatus } from "@/lib/types";

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
    <View className={cn("rounded-2xl border border-slate-200 bg-white p-5", className)}>
      {(title || icon) && (
        <View className="mb-4 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            {title ? (
              typeof title === "string" ? (
                <Text className="text-sm font-medium text-slate-500">{title}</Text>
              ) : (
                title
              )
            ) : null}
            {subtitle ? (
              typeof subtitle === "string" ? (
                <Text className="mt-1 text-xs text-slate-400">{subtitle}</Text>
              ) : (
                subtitle
              )
            ) : null}
          </View>
          {icon ? (
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
              {icon}
            </View>
          ) : null}
        </View>
      )}
      {children}
    </View>
  );
}

export function StatusPill({ status }: { status: DealStatus }) {
  const map = {
    PAID: "bg-emerald-50 border-emerald-200",
    PARTIAL: "bg-blue-50 border-blue-200",
    UNPAID: "bg-rose-50 border-rose-200",
  } as const;
  const textMap = {
    PAID: "text-emerald-700",
    PARTIAL: "text-blue-700",
    UNPAID: "text-rose-700",
  } as const;
  const labels = { PAID: "Payé", PARTIAL: "Partiel", UNPAID: "Impayé" };

  return (
    <View className={cn("rounded-full border px-2.5 py-0.5", map[status])}>
      <Text className={cn("text-xs font-medium", textMap[status])}>{labels[status]}</Text>
    </View>
  );
}
