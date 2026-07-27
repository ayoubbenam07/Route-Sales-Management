import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken, hydrateToken, setToken } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { setDbUser } from "@/lib/db";
import { pullRemoteData } from "@/lib/offlineSync";

export type Role = "ADMIN" | "BUYER";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
}

export interface Account {
  user: User;
  token: string;
}

export const USER_KEY = "rs-auth-user";
export const ACCOUNTS_KEY = "rs-auth-accounts";

export function dashboardRouteForRole(role: Role): "MainTabs" {
  return "MainTabs";
}

async function readUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

async function readAccounts(): Promise<Account[]> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    return [];
  }
}

interface AuthState {
  user: User | null;
  accounts: Account[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (user: User) => Promise<void>;
  switchAccount: (userId: string) => Promise<void>;
  removeAccount: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  accounts: [],
  hydrated: false,
  hydrate: async () => {
    const u = await readUser();
    const accs = await readAccounts();
    await hydrateToken();
    const token = getToken();

    if (u && accs.length === 0 && token) {
      accs.push({ user: u, token });
      await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accs));
    }

    if (u) {
      setDbUser(u.id);
    }

    set({ user: u, accounts: accs, hydrated: true });
  },
  login: async (user) => {
    const token = getToken();
    let updatedAccounts = get().accounts;
    if (token) {
      const existing = updatedAccounts.findIndex((a) => a.user.id === user.id);
      const newAcc = { user, token };
      if (existing >= 0) {
        updatedAccounts = [...updatedAccounts];
        updatedAccounts[existing] = newAcc;
      } else {
        updatedAccounts = [...updatedAccounts, newAcc];
      }
    }

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
    setDbUser(user.id);
    queryClient.resetQueries();
    pullRemoteData().catch(console.error);
    set({ user, accounts: updatedAccounts, hydrated: true });
  },
  switchAccount: async (userId) => {
    const account = get().accounts.find((a) => a.user.id === userId);
    if (!account) return;

    await setToken(account.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(account.user));
    setDbUser(account.user.id);
    set({ user: account.user });
    queryClient.resetQueries();
    pullRemoteData().catch(console.error);
  },
  removeAccount: async (userId) => {
    const updatedAccounts = get().accounts.filter((a) => a.user.id !== userId);
    const currentUser = get().user;

    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));

    if (currentUser?.id === userId) {
      if (updatedAccounts.length > 0) {
        await get().switchAccount(updatedAccounts[0].user.id);
      } else {
        await get().logoutAll();
      }
    } else {
      set({ accounts: updatedAccounts });
    }
  },
  logout: async () => {
    const currentUser = get().user;
    if (currentUser) {
      await get().removeAccount(currentUser.id);
    } else {
      await get().logoutAll();
    }
  },
  logoutAll: async () => {
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(ACCOUNTS_KEY);
    await setToken(null);
    setDbUser(null);
    queryClient.clear();
    set({ user: null, accounts: [] });
  },
}));
