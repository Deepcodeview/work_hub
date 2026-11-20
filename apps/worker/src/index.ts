import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';

export function createSystemWorker(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  return new Worker(
    'system-tasks',
    async (job: Job) => {
      console.log(`Processing job ${job.id} of type ${job.name}`);
      return { status: 'completed', processedAt: new Date().toISOString() };
    },
    { connection }
  );
}

async function start() {
  console.log('WorkHub Background Worker starting...');
  const worker = createSystemWorker();
  console.log('WorkHub Background Worker initialized on queue: system-tasks');
}

if (require.main === module) {
  start();
}
