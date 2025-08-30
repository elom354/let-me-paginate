import { Injectable } from '@nestjs/common';
import type {
  CacheConfig,
  CacheEntry,
  CacheService,
} from '../../domain/interfaces/cache.interface';

/**
 * Implémentation en mémoire du service de cache
 * Utilise une stratégie LRU (Least Recently Used) pour l'éviction
 */
@Injectable()
export class MemoryCacheService implements CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;

  constructor(private readonly config: CacheConfig) {}

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Vérifier l'expiration
    if (Date.now() > entry.expiresAt) {
      await this.delete(key);
      return undefined;
    }

    // Mettre à jour l'ordre d'accès pour LRU
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

    // Vérifier la taille maximale du cache
    if (
      this.config.maxSize &&
      this.cache.size >= this.config.maxSize &&
      !this.cache.has(key)
    ) {
      await this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, entry);
    this.accessOrder.set(key, ++this.accessCounter);
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

    // Vérifier l'expiration
    if (Date.now() > entry.expiresAt) {
      await this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Supprime l'entrée la moins récemment utilisée
   */
  private async evictLeastRecentlyUsed(): Promise<void> {
    if (this.accessOrder.size === 0) {
      return;
    }

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

  /**
   * Nettoie les entrées expirées
   */
  async cleanupExpired(): Promise<number> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.delete(key);
    }

    return expiredKeys.length;
  }

  /**
   * Retourne des statistiques sur le cache
   */
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
      maxSize: this.config.maxSize,
      expiredEntries: expiredCount,
      hitRate:
        this.accessCounter > 0 ? this.cache.size / this.accessCounter : 0,
    };
  }
}
