import Redis from "ioredis";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Message interface for Redis
interface RedisMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ----------------------
// Redis Client Singleton
// ----------------------
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT) || 15685,
  username: process.env.REDIS_USER || "default",
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    console.log(`Redis retry attempt ${times}`);
    return Math.min(times * 50, 2000);
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

// Connection event logging
redis.on("connect", () => console.log("🔌 Redis TCP connection established"));
redis.on("ready", () => console.log("✅ Redis client ready"));
redis.on("error", (err) => console.error("❌ Redis Client Error:", err));
redis.on("close", () => console.log("⚠️ Redis connection closed"));

// ----------------------
// Initialization Function
// ----------------------
export async function initializeRedis(): Promise<void> {
  if (redis.status === "ready") {
    console.log("ℹ️ Redis already initialized");
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Redis init timeout")),
      5000
    );

    redis.once("ready", () => {
      clearTimeout(timeout);
      console.log("🚀 Redis client initialized successfully");
      resolve();
    });

    redis.once("error", (err) => {
      clearTimeout(timeout);
      console.error("❌ Failed to initialize Redis client:", err);
      reject(err);
    });
  });
}

// ----------------------
// Cache Helpers
// ----------------------
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds = 3600
): Promise<void> {
  try {
    if (redis.status !== "ready")
      throw new Error("Redis client is not connected");

    const serializedValue = JSON.stringify(value);
    await redis.set(key, serializedValue, "EX", ttlSeconds);
    console.log(`📝 Cache set for key "${key}" (TTL: ${ttlSeconds}s)`);
  } catch (err) {
    console.error(`❌ Error setting cache for key "${key}":`, err);
    throw err;
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (redis.status !== "ready")
      throw new Error("Redis client is not connected");

    const value = await redis.get(key);
    if (value === null) {
      console.log(`⚡ Cache miss for key "${key}"`);
      return null;
    }

    const deserializedValue = JSON.parse(value) as T;
    console.log(`✅ Cache hit for key "${key}"`);
    return deserializedValue;
  } catch (err) {
    console.error(`❌ Error getting cache for key "${key}":`, err);
    throw err;
  }
}

// ----------------------
// Session Helpers
// ----------------------
export async function addMessage(
  sessionId: string,
  role: "system" | "user" | "assistant",
  content: string
): Promise<void> {
  console.log(`💬 Adding message to session ${sessionId}: role=${role}`);
  await redis.rpush(
    `form_session:${sessionId}`,
    JSON.stringify({ role, content })
  );
  await redis.expire(`form_session:${sessionId}`, 3600); // 1-hour TTL
}

export async function getMessages(sessionId: string): Promise<RedisMessage[]> {
  const messages = await redis.lrange(`form_session:${sessionId}`, 0, -1);
  console.log(
    `📥 Fetched ${messages.length} messages for session ${sessionId}`
  );
  return messages.map((msg) => JSON.parse(msg));
}

export async function clearSession(sessionId: string): Promise<void> {
  console.log(`🗑️ Clearing session ${sessionId}`);
  await redis.del(`form_session:${sessionId}`);
}

// Export singleton client
export default redis;
