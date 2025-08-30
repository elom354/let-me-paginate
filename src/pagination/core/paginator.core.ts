/**
 * Version core du paginateur - utilisable dans tous les projets JS/TS
 * Sans dépendances NestJS
 */

import {
  InvalidPageSizeException,
  InvalidPaginationConfigException,
  PageNotFoundException,
} from '../domain/exceptions/pagination.exceptions';
import type { CacheService } from '../domain/interfaces/cache.interface';
import type {
  PaginatedResult,
  PaginatedResultWithLinks,
  PaginationConfig,
  PaginationMeta,
} from '../domain/interfaces/pagination.interface';

/**
 * Configuration étendue pour gérer le cas "pas de pagination"
 */
export interface ExtendedPaginationConfig
  extends Omit<PaginationConfig, 'page' | 'pageSize'> {
  /** Numéro de page (optionnel si noPagination = true) */
  page?: number;
  /** Taille de page (optionnel si noPagination = true) */
  pageSize?: number;
  /** Désactiver complètement la pagination et retourner toutes les données */
  noPagination?: boolean;
}

/**
 * Paginateur core - utilisable partout
 */
export class CorePaginator {
  private readonly DEFAULT_PAGE_SIZE = 10;
  private readonly DEFAULT_MAX_PAGE_SIZE = 100;
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly cacheService?: CacheService) {}

  /**
   * Pagine des données avec support du mode "toutes les données"
   */
  async paginate<T>(
    data: T[],
    config: ExtendedPaginationConfig,
  ): Promise<PaginatedResult<T>> {
    // Si noPagination est activé, retourner toutes les données
    if (config.noPagination) {
      return this.returnAllData(data, config);
    }

    // Configuration normale avec pagination
    const normalizedConfig = this.normalizeConfig(config);

    // Valider avant de normaliser pour détecter les erreurs
    if (config.pageSize !== undefined && config.pageSize <= 0) {
      throw new InvalidPageSizeException(config.pageSize);
    }
    if (config.page !== undefined && config.page <= 0) {
      throw new InvalidPaginationConfigException(
        'Page number must be a positive integer',
      );
    }

    return this.paginateNormal(data, normalizedConfig);
  }

  /**
   * Pagine avec liens de navigation
   */
  async paginateWithLinks<T>(
    data: T[],
    config: ExtendedPaginationConfig,
    baseUrl = '',
  ): Promise<PaginatedResultWithLinks<T>> {
    const paginatedResult = await this.paginate(data, config);

    // Pas de liens si pas de pagination
    if (config.noPagination) {
      return { ...paginatedResult, links: undefined };
    }

    const normalizedConfig = this.normalizeConfig(config);
    const links = this.generateNavigationLinks(
      normalizedConfig.page,
      paginatedResult.meta.totalPages,
      baseUrl,
      { pageSize: normalizedConfig.pageSize },
    );

    return { ...paginatedResult, links };
  }

  /**
   * Pagination simple avec paramètres directs
   */
  async simplePaginate<T>(
    data: T[],
    page: number = 1,
    pageSize: number = this.DEFAULT_PAGE_SIZE,
    enableCache = false,
  ): Promise<PaginatedResult<T>> {
    const config: ExtendedPaginationConfig = {
      page,
      pageSize,
      enableCache,
      noPagination: false,
    };
    return this.paginate(data, config);
  }

  /**
   * Retourne toutes les données sans pagination
   */
  async getAllData<T>(
    data: T[],
    enableCache = false,
    cacheTtl?: number,
  ): Promise<PaginatedResult<T>> {
    const config: ExtendedPaginationConfig = {
      noPagination: true,
      enableCache,
      cacheTtl,
    };
    return this.paginate(data, config);
  }

  /**
   * Retourne toutes les données sans pagination (version synchrone)
   */
  getAllDataSync<T>(data: T[]): PaginatedResult<T> {
    return {
      data,
      meta: {
        currentPage: 1,
        pageSize: data.length,
        totalItems: data.length,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
        firstItemIndex: data.length > 0 ? 1 : 0,
        lastItemIndex: data.length,
      },
      fromCache: false,
    };
  }

  /**
   * Détermine automatiquement s'il faut paginer ou non
   */
  async smartPaginate<T>(
    data: T[],
    maxItemsBeforePagination = 100,
    pageSize = this.DEFAULT_PAGE_SIZE,
    page = 1,
  ): Promise<PaginatedResult<T>> {
    const config: ExtendedPaginationConfig = {
      noPagination: data.length <= maxItemsBeforePagination,
      page,
      pageSize,
      enableCache: false,
    };
    return this.paginate(data, config);
  }

  private async returnAllData<T>(
    data: T[],
    config: ExtendedPaginationConfig,
  ): Promise<PaginatedResult<T>> {
    // Vérifier le cache si activé
    if (config.enableCache && this.cacheService) {
      const cacheKey = this.generateCacheKey(data, { noPagination: true });
      const cachedResult =
        await this.cacheService.get<PaginatedResult<T>>(cacheKey);

      if (cachedResult) {
        return { ...cachedResult, fromCache: true };
      }
    }

    const result: PaginatedResult<T> = {
      data,
      meta: {
        currentPage: 1,
        pageSize: data.length,
        totalItems: data.length,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
        firstItemIndex: data.length > 0 ? 1 : 0,
        lastItemIndex: data.length,
      },
      fromCache: false,
    };

    // Mettre en cache si activé
    if (config.enableCache && this.cacheService) {
      const cacheKey = this.generateCacheKey(data, { noPagination: true });
      const ttl = config.cacheTtl || this.DEFAULT_CACHE_TTL;

      try {
        await this.cacheService.set(cacheKey, result, ttl);
      } catch (error) {
        console.warn('Failed to cache all data result:', error);
      }
    }

    return result;
  }

  private async paginateNormal<T>(
    data: T[],
    config: PaginationConfig,
  ): Promise<PaginatedResult<T>> {
    this.validateConfig(config);

    const { page, pageSize } = config;
    const totalItems = data.length;

    // Vérifier le cache
    if (config.enableCache && this.cacheService) {
      const cacheKey = this.generateCacheKey(data, config);
      const cachedResult =
        await this.cacheService.get<PaginatedResult<T>>(cacheKey);

      if (cachedResult) {
        return { ...cachedResult, fromCache: true };
      }
    }

    const totalPages = this.calculateTotalPages(totalItems, pageSize);

    if (totalPages > 0 && !this.isValidPage(page, totalPages)) {
      throw new PageNotFoundException(page, totalPages);
    }

    const startIndex = this.calculateStartIndex(page, pageSize);
    const endIndex = this.calculateEndIndex(page, pageSize, totalItems);
    const pageData = data.slice(startIndex, endIndex);

    const meta: PaginationMeta = {
      currentPage: page,
      pageSize,
      totalItems,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
      firstItemIndex: totalItems > 0 ? startIndex + 1 : 0,
      lastItemIndex: totalItems > 0 ? endIndex : 0,
    };

    const result: PaginatedResult<T> = {
      data: pageData,
      meta,
      fromCache: false,
    };

    // Cache
    if (config.enableCache && this.cacheService) {
      const cacheKey = this.generateCacheKey(data, config);
      const ttl = config.cacheTtl || this.DEFAULT_CACHE_TTL;

      try {
        await this.cacheService.set(cacheKey, result, ttl);
      } catch (error) {
        console.warn('Failed to cache pagination result:', error);
      }
    }

    return result;
  }

  private normalizeConfig(config: ExtendedPaginationConfig): PaginationConfig {
    return {
      page: config.page || 1,
      pageSize: config.pageSize || this.DEFAULT_PAGE_SIZE,
      maxPageSize: config.maxPageSize,
      enableCache: config.enableCache,
      cacheTtl: config.cacheTtl,
    };
  }

  private validateConfig(config: PaginationConfig): void {
    if (!config) {
      throw new InvalidPaginationConfigException(
        'Pagination configuration is required',
      );
    }

    const { page, pageSize, maxPageSize } = config;

    if (!Number.isInteger(page) || page < 1) {
      throw new InvalidPaginationConfigException(
        'Page number must be a positive integer',
      );
    }

    if (!Number.isInteger(pageSize) || pageSize < 1) {
      throw new InvalidPageSizeException(pageSize);
    }

    const maxSize = maxPageSize || this.DEFAULT_MAX_PAGE_SIZE;
    if (pageSize > maxSize) {
      throw new InvalidPageSizeException(pageSize, maxSize);
    }

    if (
      config.cacheTtl !== undefined &&
      (config.cacheTtl < 0 || !Number.isInteger(config.cacheTtl))
    ) {
      throw new InvalidPaginationConfigException(
        'Cache TTL must be a non-negative integer',
      );
    }
  }

  private calculateTotalPages(totalItems: number, pageSize: number): number {
    if (totalItems <= 0 || pageSize <= 0) return 0;
    return Math.ceil(totalItems / pageSize);
  }

  private calculateStartIndex(page: number, pageSize: number): number {
    if (page <= 0 || pageSize <= 0) return 0;
    return (page - 1) * pageSize;
  }

  private calculateEndIndex(
    page: number,
    pageSize: number,
    totalItems: number,
  ): number {
    const startIndex = this.calculateStartIndex(page, pageSize);
    const endIndex = startIndex + pageSize;
    return Math.min(endIndex, totalItems);
  }

  private isValidPage(page: number, totalPages: number): boolean {
    return page >= 1 && page <= totalPages;
  }

  private generateCacheKey<T>(data: T[], config: any): string {
    const dataHash = this.hashArray(data);
    const configHash = this.hashObject(config);
    return `pagination:${dataHash}:${configHash}`;
  }

  private hashArray<T>(data: T[]): string {
    const str = JSON.stringify(data);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }

  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }

  private generateNavigationLinks(
    currentPage: number,
    totalPages: number,
    baseUrl: string,
    queryParams: Record<string, any> = {},
  ): any {
    const createUrl = (page: number) => {
      const params = new URLSearchParams({
        ...queryParams,
        page: page.toString(),
      });
      return `${baseUrl}?${params.toString()}`;
    };

    const links: any = {};

    if (currentPage > 1) {
      links.first = createUrl(1);
      links.previous = createUrl(currentPage - 1);
    }

    if (currentPage < totalPages) {
      links.next = createUrl(currentPage + 1);
      links.last = createUrl(totalPages);
    }

    return links;
  }
}
