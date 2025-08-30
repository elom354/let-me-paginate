import { Test, TestingModule } from '@nestjs/testing';
import { PaginatorService } from './paginator.service';
import { PaginationUtils } from '../utils/pagination.utils';
import { MemoryCacheService } from '../../infrastructure/cache/memory-cache.service';
import {
  InvalidPaginationConfigException,
  PageNotFoundException,
  InvalidPageSizeException,
} from '../../domain/exceptions/pagination.exceptions';

describe('PaginatorService', () => {
  let service: PaginatorService;
  let paginationUtils: PaginationUtils;
  let cacheService: MemoryCacheService;

  const sampleData = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    value: Math.random(),
  }));

  beforeEach(async () => {
    const cacheConfig = {
      defaultTtl: 5000,
      maxSize: 100,
      evictionStrategy: 'lru' as const,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginatorService,
        PaginationUtils,
        {
          provide: 'CACHE_SERVICE',
          useValue: new MemoryCacheService(cacheConfig),
        },
      ],
    }).compile();

    service = module.get<PaginatorService>(PaginatorService);
    paginationUtils = module.get<PaginationUtils>(PaginationUtils);
    cacheService = module.get('CACHE_SERVICE');
  });

  afterEach(async () => {
    await cacheService.clear();
  });

  describe('paginate', () => {
    it('should paginate data correctly', async () => {
      const config = {
        page: 1,
        pageSize: 10,
        enableCache: false,
      };

      const result = await service.paginate(sampleData, config);

      expect(result.data).toHaveLength(10);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.pageSize).toBe(10);
      expect(result.meta.totalItems).toBe(50);
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.hasPrevious).toBe(false);
      expect(result.meta.hasNext).toBe(true);
      expect(result.fromCache).toBe(false);
    });

    it('should return correct data for second page', async () => {
      const config = {
        page: 2,
        pageSize: 10,
        enableCache: false,
      };

      const result = await service.paginate(sampleData, config);

      expect(result.data).toHaveLength(10);
      expect(result.data[0].id).toBe(11);
      expect(result.meta.currentPage).toBe(2);
      expect(result.meta.hasPrevious).toBe(true);
      expect(result.meta.hasNext).toBe(true);
    });

    it('should handle last page correctly', async () => {
      const config = {
        page: 5,
        pageSize: 10,
        enableCache: false,
      };

      const result = await service.paginate(sampleData, config);

      expect(result.data).toHaveLength(10);
      expect(result.meta.currentPage).toBe(5);
      expect(result.meta.hasPrevious).toBe(true);
      expect(result.meta.hasNext).toBe(false);
    });

    it('should handle partial last page', async () => {
      const config = {
        page: 6,
        pageSize: 9,
        enableCache: false,
      };

      const result = await service.paginate(sampleData, config);

      expect(result.data).toHaveLength(5); // 50 - (5 * 9) = 5
      expect(result.meta.currentPage).toBe(6);
      expect(result.meta.hasNext).toBe(false);
    });

    it('should throw error for invalid page', async () => {
      const config = {
        page: 10,
        pageSize: 10,
        enableCache: false,
      };

      await expect(service.paginate(sampleData, config)).rejects.toThrow(
        PageNotFoundException,
      );
    });

    it('should handle empty data', async () => {
      const config = {
        page: 1,
        pageSize: 10,
        enableCache: false,
      };

      const result = await service.paginate([], config);

      expect(result.data).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.firstItemIndex).toBe(0);
      expect(result.meta.lastItemIndex).toBe(0);
    });
  });

  describe('cache functionality', () => {
    it('should cache results when enabled', async () => {
      const config = {
        page: 1,
        pageSize: 10,
        enableCache: true,
        cacheTtl: 5000,
      };

      // Premier appel - pas de cache
      const result1 = await service.paginate(sampleData, config);
      expect(result1.fromCache).toBe(false);

      // Deuxième appel - depuis le cache
      const result2 = await service.paginate(sampleData, config);
      expect(result2.fromCache).toBe(true);
      expect(result2.data).toEqual(result1.data);
    });

    it('should not use cache when disabled', async () => {
      const config = {
        page: 1,
        pageSize: 10,
        enableCache: false,
      };

      const result1 = await service.paginate(sampleData, config);
      const result2 = await service.paginate(sampleData, config);

      expect(result1.fromCache).toBe(false);
      expect(result2.fromCache).toBe(false);
    });
  });

  describe('paginateWithLinks', () => {
    it('should include navigation links', async () => {
      const config = {
        page: 2,
        pageSize: 10,
        enableCache: false,
      };

      const result = await service.paginateWithLinks(
        sampleData,
        config,
        'http://example.com/api/items',
      );

      expect(result.links).toBeDefined();
      expect(result.links.first).toContain('page=1');
      expect(result.links.previous).toContain('page=1');
      expect(result.links.next).toContain('page=3');
      expect(result.links.last).toContain('page=5');
    });

    it('should not include previous links on first page', async () => {
      const config = {
        page: 1,
        pageSize: 10,
        enableCache: false,
      };

      const result = await service.paginateWithLinks(
        sampleData,
        config,
        'http://example.com/api',
      );

      expect(result.links.first).toBeUndefined();
      expect(result.links.previous).toBeUndefined();
      expect(result.links.next).toBeDefined();
      expect(result.links.last).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should validate page number', () => {
      const config = {
        page: 0,
        pageSize: 10,
        enableCache: false,
      };

      expect(() => service.validateConfig(config)).toThrow(
        InvalidPaginationConfigException,
      );
    });

    it('should validate page size', () => {
      const config = {
        page: 1,
        pageSize: 0,
        enableCache: false,
      };

      expect(() => service.validateConfig(config)).toThrow(
        InvalidPageSizeException,
      );
    });

    it('should validate max page size', () => {
      const config = {
        page: 1,
        pageSize: 150,
        maxPageSize: 100,
        enableCache: false,
      };

      expect(() => service.validateConfig(config)).toThrow(
        InvalidPageSizeException,
      );
    });

    it('should validate cache TTL', () => {
      const config = {
        page: 1,
        pageSize: 10,
        enableCache: true,
        cacheTtl: -1,
      };

      expect(() => service.validateConfig(config)).toThrow(
        InvalidPaginationConfigException,
      );
    });
  });

  describe('utility methods', () => {
    it('should create config with defaults', () => {
      const config = service.createConfig({ page: 2 });

      expect(config.page).toBe(2);
      expect(config.pageSize).toBe(10);
      expect(config.enableCache).toBe(false);
    });

    it('should simple paginate', async () => {
      const result = await service.simplePaginate(sampleData, 2, 15);

      expect(result.meta.currentPage).toBe(2);
      expect(result.meta.pageSize).toBe(15);
      expect(result.data).toHaveLength(15);
    });

    it('should get all pages', async () => {
      const pages = await service.getAllPages(sampleData, 20);

      expect(pages).toHaveLength(3); // 50 items / 20 per page = 3 pages
      expect(pages[0].meta.currentPage).toBe(1);
      expect(pages[1].meta.currentPage).toBe(2);
      expect(pages[2].meta.currentPage).toBe(3);
      expect(pages[2].data).toHaveLength(10); // Last page has 10 items
    });
  });
});
