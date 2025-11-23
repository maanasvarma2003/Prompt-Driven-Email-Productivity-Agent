// High-Performance In-Memory LRU Cache for AI Results
// Ensures 0ms latency for repeated queries or identical contexts.

class AI_Cache {
  private cache: Map<string, { data: unknown; timestamp: number }>;
  private maxSize: number;
  private ttl: number; // Time to live in ms

  constructor(maxSize = 1000, ttl = 1000 * 60 * 60 * 48) { // Advanced: 1000 items, 48 hours TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  generateKey(prefix: string, params: object): string {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  get(key: string): unknown | null {
    if (!this.cache.has(key)) return null;

    const item = this.cache.get(key)!;
    
    // Check Expiry
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU order
    this.cache.delete(key);
    this.cache.set(key, item);

    // console.log(`🚀 Cache Hit: ${key.substring(0, 50)}...`);
    return item.data;
  }

  set(key: string, data: unknown): void {
    // Evict oldest if full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }
}

export const aiCache = new AI_Cache();

