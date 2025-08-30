import {
  InvalidPageSizeException,
  InvalidPaginationConfigException,
  PageNotFoundException,
} from '../domain/exceptions/pagination.exceptions';
import { CorePaginator, ExtendedPaginationConfig } from './paginator.core';
import { SimpleCache } from './simple-cache';

describe('CorePaginator', () => {
  let paginator: CorePaginator;
  let cache: SimpleCache;

  const sampleData = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    value: Math.random(),
  }));

  beforeEach(() => {
    cache = new SimpleCache(50);
    paginator = new CorePaginator(cache);
  });

  afterEach(async () => {
    await cache.clear();
  });

  describe('paginate with noPagination', () => {
    it('should return all data when noPagination is true', async () => {
      const config: ExtendedPaginationConfig = {
        noPagination: true,
        enableCache: false,
      };

      const result = await paginator.paginate(sampleData, config);

      expect(result.data).toHaveLength(100);
      expect(result.meta.totalItems).toBe(100);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.pageSize).toBe(100);
      expect(result.meta.hasPrevious).toBe(false);
      expect(result.meta.hasNext).toBe(false);
    });

    it('should cache all data when noPagination and cache enabled', async () => {
      const config: ExtendedPaginationConfig = {
        noPagination: true,
        enableCache: true,
        cacheTtl: 5000,
      };

      // Premier appel
      const result1 = await paginator.paginate(sampleData, config);
      expect(result1.fromCache).toBe(false);

      // Deuxième appel
      const result2 = await paginator.paginate(sampleData, config);
      expect(result2.fromCache).toBe(true);
      expect(result2.data).toEqual(result1.data);
    });
  });

  describe('normal pagination', () => {
    it('should paginate normally when noPagination is false', async () => {
      const config: ExtendedPaginationConfig = {
        page: 2,
        pageSize: 15,
        noPagination: false,
        enableCache: false,
      };

      const result = await paginator.paginate(sampleData, config);

      expect(result.data).toHaveLength(15);
      expect(result.meta.currentPage).toBe(2);
      expect(result.meta.pageSize).toBe(15);
      expect(result.meta.totalItems).toBe(100);
      expect(result.meta.totalPages).toBe(7);
      expect(result.meta.hasPrevious).toBe(true);
      expect(result.meta.hasNext).toBe(true);
    });

    it('should use default values when page/pageSize not provided', async () => {
      const config: ExtendedPaginationConfig = {
        noPagination: false,
        enableCache: false,
      };

      const result = await paginator.paginate(sampleData, config);

      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.pageSize).toBe(10);
    });
  });

  describe('paginateWithLinks', () => {
    it('should not include links when noPagination is true', async () => {
      const config: ExtendedPaginationConfig = {
        noPagination: true,
      };

      const result = await paginator.paginateWithLinks(
        sampleData,
        config,
        'http://example.com/api',
      );

      expect(result.links).toBeUndefined();
    });

    it('should include links when paginating normally', async () => {
      const config: ExtendedPaginationConfig = {
        page: 3,
        pageSize: 20,
        noPagination: false,
      };

      const result = await paginator.paginateWithLinks(
        sampleData,
        config,
        'http://example.com/api',
      );

      expect(result.links).toBeDefined();
      expect(result.links.first).toContain('page=1');
      expect(result.links.previous).toContain('page=2');
      expect(result.links.next).toContain('page=4');
      expect(result.links.last).toContain('page=5');
    });
  });

  describe('getAllData', () => {
    it('should return all data', async () => {
      const result = await paginator.getAllData(sampleData);

      expect(result.data).toHaveLength(100);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.pageSize).toBe(100);
    });

    it('should cache when enabled', async () => {
      const result1 = await paginator.getAllData(sampleData, true, 5000);
      expect(result1.fromCache).toBe(false);

      const result2 = await paginator.getAllData(sampleData, true, 5000);
      expect(result2.fromCache).toBe(true);
    });
  });

  describe('getAllDataSync', () => {
    it('should return all data synchronously', () => {
      const result = paginator.getAllDataSync(sampleData);

      expect(result.data).toHaveLength(100);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.pageSize).toBe(100);
      expect(result.fromCache).toBe(false);
    });

    it('should handle empty data', () => {
      const result = paginator.getAllDataSync([]);

      expect(result.data).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.firstItemIndex).toBe(0);
      expect(result.meta.lastItemIndex).toBe(0);
    });
  });

  describe('smartPaginate', () => {
    it('should not paginate when data size is below threshold', async () => {
      const smallData = sampleData.slice(0, 30);
      const result = await paginator.smartPaginate(smallData, 50, 10, 1);

      expect(result.data).toHaveLength(30);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.pageSize).toBe(30);
    });

    it('should paginate when data size exceeds threshold', async () => {
      const result = await paginator.smartPaginate(sampleData, 50, 20, 2);

      expect(result.data).toHaveLength(20);
      expect(result.meta.currentPage).toBe(2);
      expect(result.meta.totalPages).toBe(5);
    });
  });

  describe('simplePaginate', () => {
    it('should paginate with default values', async () => {
      const result = await paginator.simplePaginate(sampleData);

      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.pageSize).toBe(10);
      expect(result.data).toHaveLength(10);
    });

    it('should paginate with custom values', async () => {
      const result = await paginator.simplePaginate(sampleData, 3, 25, true);

      expect(result.meta.currentPage).toBe(3);
      expect(result.meta.pageSize).toBe(25);
      expect(result.data).toHaveLength(25);
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid page in normal pagination', async () => {
      const config: ExtendedPaginationConfig = {
        page: 999,
        pageSize: 10,
        noPagination: false,
      };

      await expect(paginator.paginate(sampleData, config)).rejects.toThrow(
        PageNotFoundException,
      );
    });

    it('should throw error for invalid page size', async () => {
      const config: ExtendedPaginationConfig = {
        page: 1,
        pageSize: 0,
        noPagination: false,
      };

      await expect(paginator.paginate(sampleData, config)).rejects.toThrow(
        InvalidPageSizeException,
      );
    });

    it('should throw error for exceeding max page size', async () => {
      const config: ExtendedPaginationConfig = {
        page: 1,
        pageSize: 200,
        maxPageSize: 100,
        noPagination: false,
      };

      await expect(paginator.paginate(sampleData, config)).rejects.toThrow(
        InvalidPageSizeException,
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty data with pagination', async () => {
      const config: ExtendedPaginationConfig = {
        page: 1,
        pageSize: 10,
        noPagination: false,
      };

      const result = await paginator.paginate([], config);

      expect(result.data).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should handle empty data with noPagination', async () => {
      const config: ExtendedPaginationConfig = {
        noPagination: true,
      };

      const result = await paginator.paginate([], config);

      expect(result.data).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
