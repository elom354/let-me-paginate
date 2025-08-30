/**
 * Interface pour le système de cache
 */
export interface CacheService {
  /**
   * Récupère une valeur du cache
   * @param key Clé du cache
   * @returns La valeur cachée ou undefined si non trouvée/expirée
   */
  get<T>(key: string): Promise<T | undefined>;

  /**
   * Stocke une valeur dans le cache
   * @param key Clé du cache
   * @param value Valeur à cacher
   * @param ttl Durée de vie en millisecondes
   */
  set<T>(key: string, value: T, ttl: number): Promise<void>;

  /**
   * Supprime une entrée du cache
   * @param key Clé du cache
   */
  delete(key: string): Promise<void>;

  /**
   * Vide tout le cache
   */
  clear(): Promise<void>;

  /**
   * Vérifie si une clé existe dans le cache
   * @param key Clé du cache
   */
  has(key: string): Promise<boolean>;
}

/**
 * Entrée de cache avec métadonnées
 */
export interface CacheEntry<T> {
  /** Valeur cachée */
  value: T;
  /** Timestamp d'expiration */
  expiresAt: number;
  /** Timestamp de création */
  createdAt: number;
}

/**
 * Configuration du cache
 */
export interface CacheConfig {
  /** Durée de vie par défaut en millisecondes */
  defaultTtl: number;
  /** Taille maximale du cache */
  maxSize?: number;
  /** Stratégie d'éviction (LRU, FIFO, etc.) */
  evictionStrategy?: 'lru' | 'fifo' | 'lfu';
}
