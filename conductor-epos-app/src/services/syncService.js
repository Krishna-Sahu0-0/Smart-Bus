import {
  getPendingTransactionCount,
  getQueuedTransactions,
  removeQueuedTransaction,
  recordQueueAttempt,
} from './offlineQueueService';

const listeners = new Set();
let apiService = null;
let syncRun = null;
let initialized = false;
let state = { status: 'SYNCED', pendingCount: 0, lastError: '' };

function publish(nextState = state, event = null) {
  state = nextState;
  listeners.forEach((listener) => listener(state, event));
}

async function refreshQueueState(status = state.status, lastError = state.lastError) {
  const pendingCount = await getPendingTransactionCount();
  publish({ status: pendingCount ? status : 'SYNCED', pendingCount, lastError });
}

async function execute(item) {
  if (item.operationType === 'CREATE_TICKET') return apiService.createTicket(item.payload);
  if (item.operationType === 'QUICK_PASS_COUNT') return apiService.createQuickPassCount(item.payload);
  if (item.operationType === 'SCAN_PASS') return apiService.scanPass(item.payload);
  throw new Error(`Unsupported queued operation: ${item.operationType}`);
}

export function configureSyncService(service) {
  apiService = service;
  initialized = true;
  refreshQueueState('PENDING SYNC');
}

export function subscribeToSync(listener) {
  listeners.add(listener);
  listener(state, null);
  refreshQueueState(state.status);
  return () => listeners.delete(listener);
}

export function getSyncState() {
  return state;
}

export function notifyQueueChanged() {
  refreshQueueState('PENDING SYNC');
}

export async function syncQueuedTransactions() {
  if (!initialized || !apiService) return state;
  if (syncRun) return syncRun;

  syncRun = (async () => {
    const queue = await getQueuedTransactions();
    if (!queue.length) {
      publish({ status: 'SYNCED', pendingCount: 0, lastError: '' });
      return state;
    }

    publish({ status: 'SYNCING', pendingCount: queue.length, lastError: '' });
    for (const item of queue) {
      try {
        const response = await execute(item);
        await removeQueuedTransaction(item.localQueueId);
        const pendingCount = await getPendingTransactionCount();
        publish({ status: pendingCount ? 'SYNCING' : 'SYNCED', pendingCount, lastError: '' }, { type: 'ITEM_SYNCED', item, response });
      } catch (error) {
        await recordQueueAttempt(item.localQueueId);
        await refreshQueueState(error.isNetworkError ? 'OFFLINE' : 'PENDING SYNC', error.message);
        break;
      }
    }
    return state;
  })();

  try {
    return await syncRun;
  } finally {
    syncRun = null;
  }
}

export async function notifyApiSuccess() {
  if (!initialized || syncRun) return;
  const pendingCount = await getPendingTransactionCount();
  if (pendingCount > 0) syncQueuedTransactions();
}
