import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  PowerSyncCredentials,
  UpdateType,
} from '@powersync/react-native';
import { api, getToken, hydrateToken } from '@/lib/api';

/**
 * PowerSync Cloud instance URL.
 * Override with EXPO_PUBLIC_POWERSYNC_URL if needed.
 */
export const POWERSYNC_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_POWERSYNC_URL) ||
  'https://6a63612e2320c406bd5882c7.powersync.journeyapps.com';

type PendingDeal = {
  id: string;
  supermarketId?: string;
  totalAmount?: number;
  status?: string;
  buyerId?: string;
  createdAt?: string;
  items: Array<{
    id: string;
    productId?: string;
    quantity?: number;
    unitPrice?: number;
  }>;
};

function readEnv(name: string): string | undefined {
  if (typeof process === 'undefined') return undefined;
  return process.env?.[name]?.trim() || undefined;
}

/**
 * Backend connector: auth credentials for PowerSync + upload of local writes.
 * @see https://docs.powersync.com/client-sdks/reference/react-native-and-expo
 */
export class Connector implements PowerSyncBackendConnector {
  async fetchCredentials(): Promise<PowerSyncCredentials | null> {
    // Prefer a PowerSync development token while Client Auth is not wired
    // to your backend JWTs. Generate one in the PowerSync Dashboard → Client Auth.
    // https://docs.powersync.com/configuration/auth/development-tokens
    const devToken = readEnv('EXPO_PUBLIC_POWERSYNC_DEV_TOKEN');
    if (devToken) {
      return {
        endpoint: POWERSYNC_URL,
        token: devToken,
      };
    }

    const token = getToken() ?? (await hydrateToken());
    if (!token) {
      return null;
    }

    // Production path: reuse your app JWT only after PowerSync Client Auth
    // is configured for the same signing key, and tokens include a `sub` claim.
    // See https://docs.powersync.com/configuration/auth/custom
    return {
      endpoint: POWERSYNC_URL,
      token: token.replace(/^Bearer\s+/i, ''),
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) {
      return;
    }

    try {
      const dealsToUpload: Record<string, PendingDeal> = {};

      for (const op of transaction.crud) {
        const record = { ...(op.opData ?? {}), id: op.id } as Record<string, unknown> & {
          id: string;
        };

        switch (op.op) {
          case UpdateType.PUT:
          case UpdateType.PATCH: {
            if (op.table === 'deals') {
              dealsToUpload[op.id] = {
                ...dealsToUpload[op.id],
                ...(record as PendingDeal),
                id: op.id,
                items: dealsToUpload[op.id]?.items ?? [],
              };
            } else if (op.table === 'deal_items') {
              const dealId = op.opData?.dealId as string | undefined;
              if (!dealId) break;
              if (!dealsToUpload[dealId]) {
                dealsToUpload[dealId] = { id: dealId, items: [] };
              }
              dealsToUpload[dealId].items.push({
                id: op.id,
                productId: op.opData?.productId as string | undefined,
                quantity: op.opData?.quantity as number | undefined,
                unitPrice: op.opData?.unitPrice as number | undefined,
              });
            } else if (op.table === 'payments') {
              await api.post('/payment', {
                dealId: record.dealId,
                amount: record.amount,
                method: (record.method as string | undefined) ?? 'CASH',
              });
            }
            break;
          }
          case UpdateType.DELETE:
            // Wire DELETE handlers when your backend supports them for synced tables.
            break;
        }
      }

      for (const deal of Object.values(dealsToUpload)) {
        if (!deal.supermarketId || deal.items.length === 0) {
          continue;
        }
        await api.post('/deals', {
          supermarketId: deal.supermarketId,
          items: deal.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          initialPayment: 0,
        });
      }

      await transaction.complete();
    } catch (error) {
      console.error('PowerSync uploadData failed', error);
      // Re-throw so PowerSync retries after its backoff period.
      throw error;
    }
  }
}
