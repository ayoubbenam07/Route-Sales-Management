import AsyncStorage from "@react-native-async-storage/async-storage";

const memory = new Map<string, string>();

export const cacheStore = {
  async getItem<T = string>(key: string): Promise<T | null> {
    if (memory.has(key)) return memory.get(key) as T;
    const value = await AsyncStorage.getItem(key);
    if (value != null) memory.set(key, value);
    return value as T | null;
  },
  async setItem(key: string, value: string): Promise<void> {
    memory.set(key, value);
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    memory.delete(key);
    await AsyncStorage.removeItem(key);
  },
  async keys(): Promise<string[]> {
    return AsyncStorage.getAllKeys();
  },
};

export const syncQueue = {
  async getItem<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(`queue:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async setItem(key: string, value: unknown): Promise<void> {
    await AsyncStorage.setItem(`queue:${key}`, JSON.stringify(value));
  },
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(`queue:${key}`);
  },
  async keys(): Promise<string[]> {
    const all = await AsyncStorage.getAllKeys();
    return all.filter((k) => k.startsWith("queue:")).map((k) => k.slice(6));
  },
};
