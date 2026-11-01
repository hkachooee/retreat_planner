import { createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;

// Reuse one connection per server instance (and across dev hot reloads).
const globalForRedis = globalThis as unknown as { redis?: Promise<RedisClient> };

export function redis(): Promise<RedisClient> {
  if (!globalForRedis.redis) {
    const client = createClient({ url: process.env.REDIS_URL });
    client.on("error", (err) => console.error("redis error", err));
    globalForRedis.redis = client.connect().catch((err) => {
      globalForRedis.redis = undefined;
      throw err;
    });
  }
  return globalForRedis.redis;
}
