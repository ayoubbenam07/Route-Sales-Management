import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "ghost" | "destructive" | "secondary";
type Size = "default" | "sm" | "lg" | "icon";

const variantClass: Record<Variant, string> = {
  default: "bg-indigo-600",
  outline: "bg-white border border-slate-200",
  ghost: "bg-transparent",
  destructive: "bg-rose-600",
  secondary: "bg-slate-100",
};

const variantText: Record<Variant, string> = {
  default: "text-white",
  outline: "text-slate-800",
  ghost: "text-slate-700",
  destructive: "text-white",
  secondary: "text-slate-700",
};

const sizeClass: Record<Size, string> = {
  default: "px-4 py-3",
  sm: "px-3 py-2",
  lg: "px-5 py-4",
  icon: "p-2",
};

export function Button({
  children,
  onPress,
  disabled,
  loading,
  variant = "default",
  size = "default",
  className,
  textClassName,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  className?: string;
  textClassName?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        "flex-row items-center justify-center rounded-xl",
        variantClass[variant],
        sizeClass[size],
        (disabled || loading) && "opacity-60",
        className,
      )}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "ghost" || variant === "secondary" ? "#4f46e5" : "#fff"}
          className="mr-2"
        />
      ) : null}
      {typeof children === "string" ? (
        <Text className={cn("font-semibold", variantText[variant], textClassName)}>{children}</Text>
      ) : (
        <View className="flex-row items-center gap-2">{children}</View>
      )}
    </TouchableOpacity>
  );
}
