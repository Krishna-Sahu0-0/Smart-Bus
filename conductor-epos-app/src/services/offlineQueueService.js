import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@smartbus/offline-transaction-queue';

export const QUEUE_OPERATION_TYPES = {
  TICKET: 'CREATE_TICKET',
  QUICK_COUNT: 'QUICK_PASS_COUNT',
  PASS_SCAN: 'SCAN_PASS',
};

function createQueueId() {
  return `QUEUE-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getQueuedTransactions() {
  const saved = await AsyncStorage.getItem(QUEUE_KEY);
  if (!saved) return [];
  try {
    const queue = JSON.parse(saved);
    return Array.isArray(queue) ? queue : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return queue;
}

export async function enqueueTransaction(operationType, payload) {
  const queue = await getQueuedTransactions();
  const item = {
    localQueueId: createQueueId(),
    operationType,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
    status: 'PENDING',
  };
  await saveQueue([...queue, item]);
  return item;
}

export async function removeQueuedTransaction(localQueueId) {
  const queue = await getQueuedTransactions();
  await saveQueue(queue.filter((item) => item.localQueueId !== localQueueId));
}

export async function recordQueueAttempt(localQueueId) {
  const queue = await getQueuedTransactions();
  await saveQueue(queue.map((item) => item.localQueueId === localQueueId
    ? { ...item, attempts: item.attempts + 1, status: 'PENDING' }
    : item));
}

export async function getPendingTransactionCount() {
  return (await getQueuedTransactions()).length;
}
