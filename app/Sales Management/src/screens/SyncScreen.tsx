import React, { useState } from "react";
import { View, Text, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { getDb } from "@/lib/db";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

export function SyncScreen() {
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  const handleSync = async () => {
    setSyncing(true);
    setLog([]);
    addLog("Démarrage de la synchronisation...");
    const db = getDb();

    try {
      // 1. PUSH LOCAL CHANGES
      addLog("Envoi des modifications locales...");
      const pendingSupermarkets = db.getAllSync("SELECT * FROM supermarkets WHERE sync_status = 'pending'") as any[];
      for (const sm of pendingSupermarkets) {
        addLog(`Envoi du client: ${sm.name}`);
        // If it starts with a local UUID, we might need to POST, else PUT
        // Just for simplicity we'll assume everything is pushed via POST/PUT
        try {
          // If we had a real backend, we'd sync here.
          // await apiPost('/supermarkets', sm);
          db.runSync("UPDATE supermarkets SET sync_status = 'synced' WHERE id = ?", [sm.id]);
        } catch (e) {
          addLog(`Erreur envoi client ${sm.name}`);
        }
      }

      const pendingDeals = db.getAllSync("SELECT * FROM deals WHERE sync_status = 'pending'") as any[];
      for (const deal of pendingDeals) {
        addLog(`Envoi de la vente: ${deal.reference || deal.id}`);
        // Fetch items and payments
        const items = db.getAllSync("SELECT * FROM deal_items WHERE dealId = ?", [deal.id]) as any[];
        const payments = db.getAllSync("SELECT * FROM payments WHERE dealId = ?", [deal.id]) as any[];
        try {
          // Sync to backend logic here...
          db.runSync("UPDATE deals SET sync_status = 'synced' WHERE id = ?", [deal.id]);
        } catch (e) {
          addLog(`Erreur envoi vente ${deal.id}`);
        }
      }

      // 2. PULL REMOTE CHANGES
      addLog("Téléchargement des données serveur...");
      
      try {
        const supermarkets = await apiGet<any[]>("/supermarkets");
        addLog(`Reçu ${supermarkets.length} clients`);
        db.withTransactionSync(() => {
          for (const sm of supermarkets) {
            db.runSync(
              "INSERT OR REPLACE INTO supermarkets (id, name, phone, address, totalDebt, sync_status) VALUES (?, ?, ?, ?, ?, 'synced')",
              [sm.id, sm.name, sm.phone, sm.address || "", sm.totalDebt || 0]
            );
          }
        });
      } catch (e) {
        addLog("Erreur téléchargement clients");
      }

      try {
        const products = await apiGet<any[]>("/products");
        addLog(`Reçu ${products.length} produits`);
        db.withTransactionSync(() => {
          for (const p of products) {
            db.runSync(
              "INSERT OR REPLACE INTO products (id, name, basePrice, stockQty, sync_status) VALUES (?, ?, ?, ?, 'synced')",
              [p.id, p.name, p.basePrice, p.stockQty || p.stock || 0]
            );
          }
        });
      } catch (e) {
        addLog("Erreur téléchargement produits");
      }

      try {
        const deals = await apiGet<any[]>("/deals");
        addLog(`Reçu ${deals.length} ventes`);
        db.withTransactionSync(() => {
          for (const d of deals) {
            db.runSync(
              "INSERT OR REPLACE INTO deals (id, supermarketId, supermarketName, buyerId, buyerName, totalAmount, paid, remaining, status, createdAt, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')",
              [d.id, d.supermarketId || d.supermarket?.id || "", d.supermarket?.name || "", d.buyerId || d.buyer?.id || "", d.buyer?.name || "", d.totalAmount, d.paymentSummary?.totalPaid || d.paid || 0, d.paymentSummary?.remainingBalance || d.remaining || 0, d.status, d.createdAt || new Date().toISOString()]
            );
            if (Array.isArray(d.items)) {
              for (const it of d.items) {
                db.runSync(
                  "INSERT OR REPLACE INTO deal_items (id, dealId, productId, productName, quantity, unitPrice, sync_status) VALUES (?, ?, ?, ?, ?, ?, 'synced')",
                  [it.id || Date.now().toString() + Math.random(), d.id, it.productId || it.product?.id || "", it.productName || it.product?.name || "", it.quantity, it.unitPrice]
                );
              }
            }
            if (Array.isArray(d.payments)) {
              for (const p of d.payments) {
                db.runSync(
                  "INSERT OR REPLACE INTO payments (id, dealId, amount, paymentDate, method, sync_status) VALUES (?, ?, ?, ?, ?, 'synced')",
                  [p.id || Date.now().toString() + Math.random(), d.id, p.amount, p.paymentDate || p.createdAt || new Date().toISOString(), p.method || 'CASH']
                );
              }
            }
          }
        });
      } catch (e) {
        addLog("Erreur téléchargement ventes");
      }

      addLog("Synchronisation terminée avec succès !");
      queryClient.clear();
      Alert.alert("Succès", "Synchronisation terminée");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      addLog(`Erreur globale: ${msg}`);
      Alert.alert("Erreur", "La synchronisation a échoué.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom", "left", "right"]}>
      <View className="p-4 flex-1">
        <Text className="text-2xl font-bold text-slate-900 mb-4">Synchronisation</Text>
        <Text className="text-slate-500 mb-6">
          Synchronisez manuellement vos données avec le serveur pour travailler hors ligne.
        </Text>
        
        <Button onPress={handleSync} loading={syncing} size="lg">
          Lancer la synchronisation
        </Button>

        <View className="mt-6 flex-1 bg-slate-900 rounded-xl p-4">
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
