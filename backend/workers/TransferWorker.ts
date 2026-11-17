import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { TransferProcessor } from '../services/TransferProcessor';

const redisUrl = process.env.REDIS_URL;
const isProduction = process.env.NODE_ENV === 'production';

if (redisUrl || isProduction) {
  try {
    const connection = new IORedis(redisUrl || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      connectTimeout: 500,
      retryStrategy: () => null, // Never retry in dev if it fails
    });

    connection.on('error', () => {
      // SILENT: prevent logging connection errors to stderr
    });

    const transferWorker = new Worker('transfer-processing', async (job: Job) => {
      await TransferProcessor.processTransfer(job.data);
    }, { connection });

    transferWorker.on('completed', (job) => {
      console.log(`[Worker] Job ${job.id} completed`);
    });

    transferWorker.on('failed', (job, err) => {
      console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
    });
  } catch (err) {
    // Ignore initialization errors
  }
}
