import { PaginationUtils } from './pagination.utils';

describe('PaginationUtils', () => {
  let utils: PaginationUtils;

  beforeEach(() => {
    utils = new PaginationUtils();
  });

  describe('calculateTotalPages', () => {
    it('should calculate total pages correctly', () => {
      expect(utils.calculateTotalPages(100, 10)).toBe(10);
      expect(utils.calculateTotalPages(101, 10)).toBe(11);
      expect(utils.calculateTotalPages(99, 10)).toBe(10);
      expect(utils.calculateTotalPages(1, 10)).toBe(1);
    });

    it('should handle edge cases', () => {
      expect(utils.calculateTotalPages(0, 10)).toBe(0);
      expect(utils.calculateTotalPages(10, 0)).toBe(0);
      expect(utils.calculateTotalPages(-5, 10)).toBe(0);
    });
  });

  describe('calculateStartIndex', () => {
    it('should calculate start index correctly', () => {
      expect(utils.calculateStartIndex(1, 10)).toBe(0);
      expect(utils.calculateStartIndex(2, 10)).toBe(10);
      expect(utils.calculateStartIndex(3, 5)).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(utils.calculateStartIndex(0, 10)).toBe(0);
      expect(utils.calculateStartIndex(1, 0)).toBe(0);
      expect(utils.calculateStartIndex(-1, 10)).toBe(0);
    });
  });

  describe('calculateEndIndex', () => {
    it('should calculate end index correctly', () => {
      expect(utils.calculateEndIndex(1, 10, 100)).toBe(10);
      expect(utils.calculateEndIndex(2, 10, 100)).toBe(20);
      expect(utils.calculateEndIndex(10, 10, 95)).toBe(95); // Last page with fewer items
    });

    it('should not exceed total items', () => {
      expect(utils.calculateEndIndex(1, 10, 5)).toBe(5);
      expect(utils.calculateEndIndex(2, 10, 15)).toBe(15);
    });
  });

  describe('isValidPage', () => {
    it('should validate page numbers correctly', () => {
      expect(utils.isValidPage(1, 5)).toBe(true);
      expect(utils.isValidPage(5, 5)).toBe(true);
      expect(utils.isValidPage(3, 5)).toBe(true);
    });

    it('should reject invalid pages', () => {
      expect(utils.isValidPage(0, 5)).toBe(false);
      expect(utils.isValidPage(6, 5)).toBe(false);
      expect(utils.isValidPage(-1, 5)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(utils.isValidPage(1, 0)).toBe(false);
      expect(utils.isValidPage(1, -1)).toBe(false);
    });
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const data1 = [{ id: 1 }, { id: 2 }];
      const data2 = [{ id: 1 }, { id: 2 }];
      const config = { page: 1, pageSize: 10 };

      const key1 = utils.generateCacheKey(data1, config);
      const key2 = utils.generateCacheKey(data2, config);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^pagination:[a-z0-9]+:[a-z0-9]+$/);
    });

    it('should generate different keys for different data', () => {
      const data1 = [{ id: 1 }];
      const data2 = [{ id: 2 }];
      const config = { page: 1, pageSize: 10 };

      const key1 = utils.generateCacheKey(data1, config);
      const key2 = utils.generateCacheKey(data2, config);

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different configs', () => {
      const data = [{ id: 1 }];
      const config1 = { page: 1, pageSize: 10 };
      const config2 = { page: 2, pageSize: 10 };

      const key1 = utils.generateCacheKey(data, config1);
      const key2 = utils.generateCacheKey(data, config2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('validatePaginationParams', () => {
    it('should validate correct parameters', () => {
      expect(() => utils.validatePaginationParams(1, 10)).not.toThrow();
      expect(() => utils.validatePaginationParams(5, 20, 50)).not.toThrow();
    });

    it('should throw for invalid page numbers', () => {
      expect(() => utils.validatePaginationParams(0, 10)).toThrow(
        'Page number must be greater than 0',
      );
      expect(() => utils.validatePaginationParams(-1, 10)).toThrow(
        'Page number must be greater than 0',
      );
    });

    it('should throw for invalid page sizes', () => {
      expect(() => utils.validatePaginationParams(1, 0)).toThrow(
        'Page size must be greater than 0',
      );
      expect(() => utils.validatePaginationParams(1, -5)).toThrow(
        'Page size must be greater than 0',
      );
    });

    it('should throw when exceeding max page size', () => {
      expect(() => utils.validatePaginationParams(1, 150, 100)).toThrow(
        'Page size 150 exceeds maximum allowed size of 100',
      );
    });
  });

  describe('generateNavigationLinks', () => {
    it('should generate all links for middle page', () => {
      const links = utils.generateNavigationLinks(
        3,
        5,
        'http://example.com/api',
        { filter: 'test' },
      );

      expect(links.first).toContain('page=1');
      expect(links.previous).toContain('page=2');
      expect(links.next).toContain('page=4');
      expect(links.last).toContain('page=5');
      expect(links.first).toContain('filter=test');
    });

    it('should not include first/previous links for first page', () => {
      const links = utils.generateNavigationLinks(
        1,
        5,
        'http://example.com/api',
      );

      expect(links.first).toBeUndefined();
      expect(links.previous).toBeUndefined();
      expect(links.next).toContain('page=2');
      expect(links.last).toContain('page=5');
    });

    it('should not include next/last links for last page', () => {
      const links = utils.generateNavigationLinks(
        5,
        5,
        'http://example.com/api',
      );

      expect(links.first).toContain('page=1');
      expect(links.previous).toContain('page=4');
      expect(links.next).toBeUndefined();
      expect(links.last).toBeUndefined();
    });

    it('should handle single page', () => {
      const links = utils.generateNavigationLinks(
        1,
        1,
        'http://example.com/api',
      );

      expect(links.first).toBeUndefined();
      expect(links.previous).toBeUndefined();
      expect(links.next).toBeUndefined();
      expect(links.last).toBeUndefined();
    });
  });
});
