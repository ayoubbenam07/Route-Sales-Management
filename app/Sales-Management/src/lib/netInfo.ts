import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { create } from 'zustand';

interface NetInfoStore {
  isOnline: boolean;
  isChecking: boolean;
  _setOnline: (online: boolean) => void;
}

export const useNetInfo = create<NetInfoStore>((set) => ({
  isOnline: true, // optimistic default
  isChecking: true,
  _setOnline: (online: boolean) => set({ isOnline: online, isChecking: false }),
}));

/** Convenience hook */
export function useIsOnline(): boolean {
  return useNetInfo((s) => s.isOnline);
}

/** Read online status outside React */
export function getIsOnline(): boolean {
  return useNetInfo.getState().isOnline;
}

let unsubscribe: (() => void) | null = null;
let onReconnectCallback: (() => void) | null = null;

/**
 * Start listening to connectivity changes.
 * @param onReconnect – called when transitioning from offline → online
 */
export function startNetInfoListener(onReconnect?: () => void) {
  if (unsubscribe) return; // already listening

  onReconnectCallback = onReconnect ?? null;

  unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const wasOnline = useNetInfo.getState().isOnline;
    const isNowOnline = !!(state.isConnected && state.isInternetReachable !== false);

    useNetInfo.getState()._setOnline(isNowOnline);

    // Trigger sync when going from offline → online
    if (!wasOnline && isNowOnline && onReconnectCallback) {
      onReconnectCallback();
    }
  });
}

export function stopNetInfoListener() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
