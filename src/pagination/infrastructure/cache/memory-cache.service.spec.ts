import { MemoryCacheService } from './memory-cache.service';
import { CacheConfig } from '../../domain/interfaces/cache.interface';

describe('MemoryCacheService', () => {
  let service: MemoryCacheService;
  const config: CacheConfig = {
    defaultTtl: 1000,
    maxSize: 3,
    evictionStrategy: 'lru',
  };

  beforeEach(() => {
    service = new MemoryCacheService(config);
  });

  afterEach(async () => {
    await service.clear();
  });

  describe('basic operations', () => {
    it('should set and get values', async () => {
      await service.set('key1', 'value1', 5000);
      const result = await service.get('key1');

      expect(result).toBe('value1');
    });

    it('should return undefined for non-existent keys', async () => {
      const result = await service.get('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should check if key exists', async () => {
      await service.set('key1', 'value1', 5000);

      expect(await service.has('key1')).toBe(true);
      expect(await service.has('nonexistent')).toBe(false);
    });

    it('should delete keys', async () => {
      await service.set('key1', 'value1', 5000);
      await service.delete('key1');

      const result = await service.get('key1');
      expect(result).toBeUndefined();
    });

    it('should clear all keys', async () => {
      await service.set('key1', 'value1', 5000);
      await service.set('key2', 'value2', 5000);
      await service.clear();

      expect(await service.has('key1')).toBe(false);
      expect(await service.has('key2')).toBe(false);
    });
  });

  describe('expiration', () => {
    it('should expire keys after TTL', async () => {
      await service.set('key1', 'value1', 100); // 100ms TTL

      // Immediately should exist
      expect(await service.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(await service.get('key1')).toBeUndefined();
      expect(await service.has('key1')).toBe(false);
    });

    it('should cleanup expired entries', async () => {
      await service.set('key1', 'value1', 100);
      await service.set('key2', 'value2', 5000);

      // Wait for first key to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      const cleanedCount = await service.cleanupExpired();
      expect(cleanedCount).toBe(1);

      expect(await service.has('key1')).toBe(false);
      expect(await service.has('key2')).toBe(true);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used when max size exceeded', async () => {
      // Fill cache to max size
      await service.set('key1', 'value1', 5000);
      await service.set('key2', 'value2', 5000);
      await service.set('key3', 'value3', 5000);

      // Access key1 to make it more recently used
      await service.get('key1');

      // Add another key, should evict key2 (least recently used)
      await service.set('key4', 'value4', 5000);

      expect(await service.has('key1')).toBe(true); // Recently accessed
      expect(await service.has('key2')).toBe(false); // Should be evicted
      expect(await service.has('key3')).toBe(true); // Recently added
      expect(await service.has('key4')).toBe(true); // Just added
    });

    it('should update access order when getting values', async () => {
      await service.set('key1', 'value1', 5000);
      await service.set('key2', 'value2', 5000);
      await service.set('key3', 'value3', 5000);

      // Access key1 to make it most recently used
      await service.get('key1');

      // Add new key, should evict key2
      await service.set('key4', 'value4', 5000);

      expect(await service.has('key1')).toBe(true);
      expect(await service.has('key2')).toBe(false);
      expect(await service.has('key3')).toBe(true);
      expect(await service.has('key4')).toBe(true);
    });
  });

  describe('statistics', () => {
    it('should provide cache statistics', async () => {
      await service.set('key1', 'value1', 5000);
      await service.set('key2', 'value2', 100); // Will expire soon

      const stats = service.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      const statsAfterExpiry = service.getStats();
      expect(statsAfterExpiry.expiredEntries).toBe(1);
    });
  });

  describe('complex data types', () => {
    it('should handle objects', async () => {
      const obj = { name: 'test', value: 42, nested: { prop: 'value' } };
      await service.set('obj', obj, 5000);

      const result = await service.get('obj');
      expect(result).toEqual(obj);
    });

    it('should handle arrays', async () => {
      const arr = [1, 2, 3, { id: 1 }, { id: 2 }];
      await service.set('arr', arr, 5000);

      const result = await service.get('arr');
      expect(result).toEqual(arr);
    });
  });
});
