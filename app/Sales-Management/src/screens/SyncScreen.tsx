import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { WifiOff, Wifi, CloudUpload, CloudDownload, Clock, RefreshCw } from "lucide-react-native";
import { Button } from "@/components/Button";
import { performFullSync, getPendingChangesCount, getLastSyncTime, type SyncResult } from "@/lib/offlineSync";
import { useIsOnline } from "@/lib/netInfo";
import { Alert } from "@/components/CustomAlert";

export function SyncScreen() {
  const { t } = useTranslation();
  const isOnline = useIsOnline();
  const [syncing, setSyncing] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const refreshStats = useCallback(() => {
    setPendingCount(getPendingChangesCount());
    setLastSync(getLastSyncTime());
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert("Hors ligne", "Impossible de synchroniser sans connexion internet.");
      return;
    }

    setSyncing(true);
    setLog([]);
    addLog("Démarrage de la synchronisation...");

    try {
      addLog(`${pendingCount} modification(s) locale(s) en attente`);
      addLog("Envoi des modifications locales...");

      const result: SyncResult = await performFullSync();

      // Log push results
      const pushTotal =
        result.pushed.supermarkets +
        result.pushed.products +
        result.pushed.deals +
        result.pushed.payments;
      if (pushTotal > 0) {
        addLog(`✓ ${pushTotal} élément(s) envoyé(s) au serveur`);
        if (result.pushed.supermarkets > 0)
          addLog(`  • ${result.pushed.supermarkets} client(s)`);
        if (result.pushed.products > 0)
          addLog(`  • ${result.pushed.products} produit(s)`);
        if (result.pushed.deals > 0)
          addLog(`  • ${result.pushed.deals} vente(s)`);
        if (result.pushed.payments > 0)
          addLog(`  • ${result.pushed.payments} paiement(s)`);
      } else {
        addLog("✓ Aucune modification locale à envoyer");
      }

      // Log pull results
      addLog("Téléchargement des données serveur...");
      const pullTotal =
        result.pulled.supermarkets +
        result.pulled.products +
        result.pulled.deals +
        result.pulled.payments;
      if (pullTotal > 0) {
        addLog(`✓ ${pullTotal} élément(s) reçu(s) du serveur`);
        if (result.pulled.supermarkets > 0)
          addLog(`  • ${result.pulled.supermarkets} client(s)`);
        if (result.pulled.products > 0)
          addLog(`  • ${result.pulled.products} produit(s)`);
        if (result.pulled.deals > 0)
          addLog(`  • ${result.pulled.deals} vente(s)`);
        if (result.pulled.payments > 0)
          addLog(`  • ${result.pulled.payments} paiement(s)`);
      } else {
        addLog("✓ Données locales à jour");
      }

      // Log errors
      if (result.errors.length > 0) {
        addLog(`⚠ ${result.errors.length} erreur(s):`);
        for (const err of result.errors) {
          addLog(`  ✗ ${err}`);
        }
      }

      addLog("Synchronisation terminée !");
      refreshStats();
      Alert.alert("Succès", "Synchronisation terminée");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      addLog(`Erreur globale: ${msg}`);
      Alert.alert("Erreur", "La synchronisation a échoué.");
    } finally {
      setSyncing(false);
    }
  };

  const formattedLastSync = lastSync
    ? new Date(lastSync).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Jamais";

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom", "left", "right"]}>
      <View className="p-4 flex-1">
        <Text className="text-2xl font-bold text-slate-900 mb-2">Synchronisation</Text>
        <Text className="text-slate-500 mb-4">
          Synchronisez vos données avec le serveur central.
        </Text>

        {/* Status Cards */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
            <View className="flex-row items-center gap-2 mb-2">
              {isOnline ? (
                <Wifi size={16} color="#22c55e" />
              ) : (
                <WifiOff size={16} color="#ef4444" />
              )}
              <Text className="text-xs font-medium text-slate-500">Connexion</Text>
            </View>
            <Text
              className={`text-sm font-bold ${isOnline ? "text-green-600" : "text-red-500"}`}
            >
              {isOnline ? "En ligne" : "Hors ligne"}
            </Text>
          </View>

          <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <CloudUpload size={16} color="#4f46e5" />
              <Text className="text-xs font-medium text-slate-500">En attente</Text>
            </View>
            <Text className="text-sm font-bold text-slate-900">
              {pendingCount} modification{pendingCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View className="rounded-2xl border border-slate-200 bg-white p-4 mb-4">
          <View className="flex-row items-center gap-2">
            <Clock size={16} color="#64748b" />
            <Text className="text-xs text-slate-500">Dernière synchronisation:</Text>
            <Text className="text-xs font-semibold text-slate-700">{formattedLastSync}</Text>
          </View>
        </View>

        <Button onPress={handleSync} loading={syncing} size="lg" disabled={!isOnline}>
          <RefreshCw size={16} color="#fff" />
          <Text className="font-semibold text-white ml-1">Lancer la synchronisation</Text>
        </Button>

        <View className="mt-4 flex-1 bg-slate-900 rounded-xl p-4">
          <Text className="text-white font-bold mb-2">Logs système :</Text>
          <ScrollView>
            {log.length === 0 ? (
              <Text className="text-slate-500 text-xs">Aucune synchronisation récente.</Text>
            ) : (
              log.map((l, i) => (
                <Text key={i} className="text-slate-300 text-xs mb-1">
                  &gt; {l}
                </Text>
              ))
            )}
            {syncing && <ActivityIndicator className="mt-4" color="#4f46e5" />}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
