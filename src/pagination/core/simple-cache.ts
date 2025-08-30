/**
 * Cache simple pour les projets non-NestJS
 */

import type {
  CacheEntry,
  CacheService,
} from '../domain/interfaces/cache.interface';

/**
 * Implémentation simple du cache pour usage universel
 */
export class SimpleCache implements CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      await this.delete(key);
      return undefined;
    }

    this.accessOrder.set(key, ++this.accessCounter);
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      value,
      expiresAt: now + ttl,
      createdAt: now,
    };

    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      await this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, entry);
    this.accessOrder.set(key, ++this.accessCounter);
    return Promise.resolve();
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    this.accessOrder.delete(key);
    return Promise.resolve();
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
    return Promise.resolve();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      await this.delete(key);
      return false;
    }

    return true;
  }

  private async evictLeastRecentlyUsed(): Promise<void> {
    if (this.accessOrder.size === 0) return;

    let lruKey: string | undefined;
    let lruAccess = Infinity;

    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < lruAccess) {
        lruAccess = accessTime;
        lruKey = key;
      }
    }

    if (lruKey) {
      await this.delete(lruKey);
    }
  }

  getStats() {
    const now = Date.now();
    let expiredCount = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expiredEntries: expiredCount,
    };
  }
}
