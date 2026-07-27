import React from "react";
import { View, Text } from "react-native";
import { WifiOff } from "lucide-react-native";
import { useIsOnline } from "@/lib/netInfo";

/**
 * A small banner shown at the top of screens when the device is offline.
 * Auto-hides when connectivity is restored.
 */
export function OfflineBanner() {
  const isOnline = useIsOnline();

  if (isOnline) return null;

  return (
    <View className="flex-row items-center justify-center gap-2 bg-amber-500 px-4 py-2">
      <WifiOff size={14} color="#fff" />
      <Text className="text-xs font-semibold text-white">
        Mode hors ligne — les données seront synchronisées automatiquement
      </Text>
    </View>
  );
}
