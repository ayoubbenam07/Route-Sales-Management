import "react-native-get-random-values";
import "./global.css";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { queryClient } from "./src/lib/queryClient";
import { initI18n } from "./src/lib/i18n";
import { startOfflineSyncListener } from "./src/lib/offlineSync";
import { hydrateToken } from "./src/lib/api";
import { PowerSyncProvider } from "./src/db/PowerSyncProvider";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initI18n();
      await hydrateToken();
      startOfflineSyncListener();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PowerSyncProvider>
          <NavigationContainer>
            <RootNavigator />
            <StatusBar style="dark" />
          </NavigationContainer>
        </PowerSyncProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
