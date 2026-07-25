import { Alert } from "react-native";
import { AppState } from "react-native";
import { syncQueue } from "./storage";

interface QueuedRequest {
  id: string;
  url: string;
  payload: unknown;
  timestamp: number;
}

export async function queueRequest(url: string, payload: unknown): Promise<string> {
  const offlineId = `offline-${Date.now()}`;
  const queuedRequest: QueuedRequest = {
    id: offlineId,
    url,
    payload,
    timestamp: Date.now(),
  };
  await syncQueue.setItem(offlineId, queuedRequest);
  return offlineId;
}

export async function processSyncQueue() {
  const keys = await syncQueue.keys();
  if (keys.length === 0) return;

  const { apiPost } = await import("./api");

  let successCount = 0;
  let failureCount = 0;

  for (const key of keys) {
    const req = await syncQueue.getItem<QueuedRequest>(key);
    if (!req) continue;
    try {
      await apiPost(req.url, req.payload);
      await syncQueue.removeItem(key);
      successCount++;
    } catch (error) {
      console.error(`Failed to sync queued request ${key}`, error);
      failureCount++;
    }
  }

  if (successCount > 0) {
    Alert.alert("Sync", `${successCount} action(s) hors ligne synchronisée(s).`);
  }
  if (failureCount > 0 && successCount === 0) {
    // Stay quiet when still offline — avoid alert spam
  }
}

let started = false;

export function startOfflineSyncListener() {
  if (started) return;
  started = true;

  // Retry queued writes when app returns to foreground
  AppState.addEventListener("change", (state) => {
    if (state === "active") processSyncQueue();
  });

  // Periodic retry
  setInterval(() => {
    processSyncQueue();
  }, 20000);
}
