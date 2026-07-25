import '@azure/core-asynciterator-polyfill';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { PowerSyncContext, PowerSyncDatabase } from '@powersync/react-native';
import { AppSchema } from './AppSchema';
import { Connector } from './PowerSyncConnector';

export const db = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: 'buyer_app.sqlite',
  },
});

const connector = new Connector();

export async function connectPowerSync(): Promise<void> {
  await db.connect(connector);
}

export async function disconnectPowerSync(): Promise<void> {
  await db.disconnect();
}

export const PowerSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initPowerSync = async () => {
      try {
        await db.init();
        // Connect when credentials are available (dev token or logged-in JWT).
        // fetchCredentials() returning null keeps sync idle until auth is ready.
        await db.connect(connector);
        if (!cancelled) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize PowerSync', error);
        // Still render the app — local SQLite may work even if sync fails.
        if (!cancelled) {
          setIsInitialized(true);
        }
      }
    };

    void initPowerSync();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isInitialized) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-4 font-medium text-gray-500">Initializing Database...</Text>
      </View>
    );
  }

  return <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>;
};
