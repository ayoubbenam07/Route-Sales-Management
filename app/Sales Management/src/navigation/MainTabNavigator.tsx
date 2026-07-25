import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTranslation } from "node_modules/react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutDashboard, Package, ReceiptText } from "lucide-react-native";
import { DashboardScreen } from "../screens/DashboardScreen";
import { ProductsScreen } from "../screens/ProductsScreen";
import { DealsScreen } from "../screens/DealsScreen";
import { SyncScreen } from "../screens/SyncScreen";
import { LanguageToggle } from "@/components/LanguageToggle";
import { AccountSwitcher } from "@/components/AccountSwitcher";

const Tab = createBottomTabNavigator();

function HeaderRight() {
  return (
    <View className="mr-2 flex-row items-center gap-2">
      <AccountSwitcher />
      <LanguageToggle />
    </View>
  );
}

export function MainTabNavigator() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabHeight = 56 + Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      key={i18n.language}
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#4f46e5",
        tabBarInactiveTintColor: "#64748b",
        headerTitleStyle: { fontWeight: "bold", color: "#0f172a" },
        headerRight: () => <HeaderRight />,
        tabBarStyle: {
          paddingTop: 4,
          height: tabHeight,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        sceneStyle: { backgroundColor: "#f8fafc" },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: t("nav.clients"),
          tabBarLabel: t("nav.dashboard"),
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: t("nav.products"),
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="MyDeals"
        component={DealsScreen}
        options={{
          title: t("nav.myDeals"),
          tabBarIcon: ({ color, size }) => <ReceiptText color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Sync"
        component={SyncScreen}
        options={{
          title: "Sync",
          tabBarIcon: ({ color, size }) => <ReceiptText color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
