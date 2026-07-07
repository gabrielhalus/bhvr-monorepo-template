import { Redis } from "ioredis";

import { getRedisUrl } from "@/lib/redis";

let queueConnection: Redis | null | undefined;

/**
 * Shared connection for queue producers, or null when REDIS_URL is not
 * configured. Offline queueing is disabled so enqueue attempts fail fast
 * while Redis is down, letting producers fall back to inline execution.
 */
export function getQueueConnection(): Redis | null {
  if (queueConnection === undefined) {
    const redisUrl = getRedisUrl();
    if (redisUrl) {
      queueConnection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
      });
      queueConnection.on("error", (error) => {
        console.error(`[Queue] Redis connection error: ${error.message}`);
      });
    } else {
      queueConnection = null;
    }
  }
  return queueConnection;
}

/**
 * Dedicated connection for a BullMQ worker, or null when REDIS_URL is not
 * configured. Workers hold long-lived blocking commands, so each one gets
 * its own connection with the settings BullMQ requires.
 */
export function createWorkerConnection(): Redis | null {
  const redisUrl = getRedisUrl();
  if (!redisUrl) {
    return null;
  }

  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });
  connection.on("error", (error) => {
    console.error(`[Queue worker] Redis connection error: ${error.message}`);
  });

  return connection;
}
