import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "node_modules/react-i18next";
import { MainTabNavigator } from "./MainTabNavigator";
import { LoginScreen } from "../screens/LoginScreen";
import { NewDealScreen } from "../screens/NewDealScreen";
import { ClientDetailScreen } from "../screens/ClientDetailScreen";
import { CollectPaymentScreen } from "../screens/CollectPaymentScreen";
import { DealDetailScreen } from "../screens/DealDetailScreen";
import { useAuth } from "@/stores/auth";
import { setUnauthorizedHandler } from "@/lib/api";

export type RootStackParamList = {
  Login: { addAccount?: boolean } | undefined;
  MainTabs: undefined;
  NewDeal: { supermarketId?: string } | undefined;
  ClientDetail: { clientId: string };
  CollectPayment: {
    supermarketId: string;
    supermarketName?: string;
    dealId?: string;
  };
  DealDetail: { dealId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { t } = useTranslation();
  const hydrated = useAuth((s) => s.hydrated);
  const user = useAuth((s) => s.user);
  const hydrate = useAuth((s) => s.hydrate);
  const logoutAll = useAuth((s) => s.logoutAll);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logoutAll();
    });
    return () => setUnauthorizedHandler(null);
  }, [logoutAll]);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {!user ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NewDeal"
            component={NewDealScreen}
            options={{ headerShown: true, title: t("common.newDeal") }}
          />
          <Stack.Screen
            name="ClientDetail"
            component={ClientDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CollectPayment"
            component={CollectPaymentScreen}
            options={{ headerShown: true, title: t("common.collect") }}
          />
          <Stack.Screen
            name="DealDetail"
            component={DealDetailScreen}
            options={{ headerShown: true, title: t("common.receipt") }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
