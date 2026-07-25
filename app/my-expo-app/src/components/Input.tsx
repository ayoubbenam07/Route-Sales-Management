import React from "react";
import { TextInput, Text, View, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

export function Input({
  label,
  error,
  className,
  ...props
}: TextInputProps & { label?: string; error?: string; className?: string }) {
  return (
    <View className="gap-1.5">
      {label ? <Text className="text-sm font-medium text-slate-700">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#94a3b8"
        className={cn(
          "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-800",
          className,
        )}
        {...props}
      />
      {error ? <Text className="text-xs text-rose-600">{error}</Text> : null}
    </View>
  );
}
