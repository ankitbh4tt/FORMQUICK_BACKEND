import Redis from 'ioredis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Message interface for Redis
interface RedisMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Initialize Redis client (singleton)
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis-15685.c14.us-east-1-2.ec2.redns.redis-cloud.com',
  port: Number(process.env.REDIS_PORT) || 15685,
  username: process.env.REDIS_USER || 'default',
  password: process.env.REDIS_PASSWORD || 'eoZmcUCyQSwlTEyuKfX6oVFj0EejpUe0',
  retryStrategy: (times) => {
    console.log(`Redis retry attempt ${times}`);
    return Math.min(times * 50, 2000);
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

// Connection event logging
redis.on('connect', () => console.log('Redis TCP connection established'));
redis.on('ready', () => console.log('Redis client ready'));
redis.on('error', (err) => console.error('Redis Client Error:', err));
redis.on('close', () => console.log('Redis connection closed'));

export async function initializeRedis(): Promise<void> {
  if (redis.status !== 'ready') {
    try {
      await redis.connect();
      console.log('Redis client initialized successfully');
    } catch (err) {
      console.error('Failed to initialize Redis client:', err);
      throw err;
    }
  }
}

// Set JSON cache with TTL
export async function setCache<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
  try {
    if (redis.status !== 'ready') throw new Error('Redis client is not connected');
    const serializedValue = JSON.stringify(value);
    await redis.set(key, serializedValue, 'EX', ttlSeconds);
    console.log(`Cache set for key "${key}" with TTL ${ttlSeconds}s`);
  } catch (err) {
    console.error(`Error setting cache for key "${key}":`, err);
    throw err;
  }
}

// Get JSON cache
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (redis.status !== 'ready') throw new Error('Redis client is not connected');
    const value = await redis.get(key);
    if (value === null) {
      console.log(`Cache miss for key "${key}"`);
      return null;
    }
    const deserializedValue = JSON.parse(value) as T;
    console.log(`Cache hit for key "${key}"`);
    return deserializedValue;
  } catch (err) {
    console.error(`Error getting cache for key "${key}":`, err);
    throw err;
  }
}

// Add message to session
export async function addMessage(sessionId: string, role: 'system' | 'user' | 'assistant', content: string): Promise<void> {
  try {
    const message: RedisMessage = { role, content };
    await redis.rpush(`form_session:${sessionId}`, JSON.stringify(message));
    await redis.expire(`form_session:${sessionId}`, 3600);
    console.log(`Message added to session "${sessionId}"`);
  } catch (err) {
    console.error(`Error adding message to session "${sessionId}":`, err);
    throw err;
  }
}

// Get session messages
export async function getMessages(sessionId: string): Promise<RedisMessage[]> {
  try {
    const messages = await redis.lrange(`form_session:${sessionId}`, 0, -1);
    return messages.map((msg) => {
      const parsed = JSON.parse(msg) as RedisMessage;
      if (!['system', 'user', 'assistant'].includes(parsed.role)) {
        throw new Error(`Invalid role in message: ${parsed.role}`);
      }
      return parsed;
    });
  } catch (err) {
    console.error(`Error getting messages for session "${sessionId}":`, err);
    throw err;
  }
}

// Clear session
export async function clearSession(sessionId: string): Promise<void> {
  try {
    await redis.del(`form_session:${sessionId}`);
    console.log(`Session "${sessionId}" cleared`);
  } catch (err) {
    console.error(`Error clearing session "${sessionId}":`, err);
    throw err;
  }
}

export default redis;