import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { TransferProcessor } from '../services/TransferProcessor';

let transferQueue: Queue | null = null;
let useRedis = false;

const redisUrl = process.env.REDIS_URL;
const isProduction = process.env.NODE_ENV === 'production';

// Only attempt Redis if URL is provided or in production
if (redisUrl || isProduction) {
  const connection = new IORedis(redisUrl || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    connectTimeout: 500, // Very short timeout for dev
    retryStrategy: (times) => {
      // In dev, don't keep retrying if it fails once
      if (!isProduction && times > 1) return null;
      return Math.min(times * 100, 2000);
    }
  });

  // CRITICAL: Handle the 'error' event to prevent process crashes/spams
  connection.on('error', (err: any) => {
    // SILENT: hander is present, so it won't crash process
  });

  connection.on('connect', () => {
    console.log('[Queue] Connected to Redis.');
    useRedis = true;
  });

  try {
    transferQueue = new Queue('transfer-processing', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      }
    });
  } catch (err) {
    console.warn('[Queue] BullMQ initialization failed.');
    useRedis = false;
  }
}

export const queueTransaction = async (data: {
  senderId: string,
  receiverId: string,
  amount: number,
  type: string,
  reference: string,
  bank?: string,
  bankCode?: string
}) => {
  if (useRedis && transferQueue) {
    try {
      await transferQueue.add('process-transfer', data);
      console.log(`[Queue] Transaction ${data.reference} queued in Redis`);
    } catch (err) {
      console.error('[Queue] Redis add failed, processing in-memory');
      await TransferProcessor.processTransfer(data);
    }
  } else {
    // Immediate processing for environments without Redis
    console.log(`[Queue] Processing ${data.reference} (In-Memory)`);
    TransferProcessor.processTransfer(data).catch(err => {
      console.error('[Queue] In-memory transfer failed:', err);
    });
  }
};
