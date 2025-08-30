import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  InvalidPageSizeException,
  InvalidPaginationConfigException,
  PageNotFoundException,
} from '../../domain/exceptions/pagination.exceptions';
import type { CacheService } from '../../domain/interfaces/cache.interface';
import type {
  PaginatedResult,
  PaginatedResultWithLinks,
  PaginationConfig,
  PaginationMeta,
} from '../../domain/interfaces/pagination.interface';
import type { IPaginator } from '../../domain/interfaces/paginator.interface';
import { PaginationUtils } from '../utils/pagination.utils';

/**
 * Service principal de pagination avec support du cache
 */
@Injectable()
export class PaginatorService implements IPaginator {
  private readonly DEFAULT_PAGE_SIZE = 10;
  private readonly DEFAULT_MAX_PAGE_SIZE = 100;
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly paginationUtils: PaginationUtils,
    @Optional()
    @Inject('CACHE_SERVICE')
    private readonly cacheService?: CacheService,
  ) {}

  async paginate<T>(
    data: T[],
    config: PaginationConfig,
  ): Promise<PaginatedResult<T>> {
    // Valider la configuration
    this.validateConfig(config);

    const { page, pageSize } = config;
    const totalItems = data.length;

    // Vérifier si le cache est activé et disponible
    if (config.enableCache && this.cacheService) {
      const cacheKey = this.generateCacheKey(data, config);
      const cachedResult =
        await this.cacheService.get<PaginatedResult<T>>(cacheKey);

      if (cachedResult) {
        return {
          ...cachedResult,
          fromCache: true,
        };
      }
    }

    // Calculer les métadonnées de pagination
    const totalPages = this.paginationUtils.calculateTotalPages(
      totalItems,
      pageSize,
    );

    // Vérifier que la page demandée existe
    if (totalPages > 0 && !this.paginationUtils.isValidPage(page, totalPages)) {
      throw new PageNotFoundException(page, totalPages);
    }

    const startIndex = this.paginationUtils.calculateStartIndex(page, pageSize);
    const endIndex = this.paginationUtils.calculateEndIndex(
      page,
      pageSize,
      totalItems,
    );

    // Extraire les données de la page
    const pageData = data.slice(startIndex, endIndex);

    // Créer les métadonnées
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

    // Mettre en cache le résultat si activé
    if (config.enableCache && this.cacheService) {
      const cacheKey = this.generateCacheKey(data, config);
      const ttl = config.cacheTtl || this.DEFAULT_CACHE_TTL;

      try {
        await this.cacheService.set(cacheKey, result, ttl);
      } catch (error) {
        // Log l'erreur mais ne pas faire échouer la pagination
        console.warn('Failed to cache pagination result:', error);
      }
    }

    return result;
  }

  async paginateWithLinks<T>(
    data: T[],
    config: PaginationConfig,
    baseUrl = '',
  ): Promise<PaginatedResultWithLinks<T>> {
    const paginatedResult = await this.paginate(data, config);

    const links = this.paginationUtils.generateNavigationLinks(
      config.page,
      paginatedResult.meta.totalPages,
      baseUrl,
      { pageSize: config.pageSize },
    );

    return {
      ...paginatedResult,
      links,
    };
  }

  validateConfig(config: PaginationConfig): void {
    if (!config) {
      throw new InvalidPaginationConfigException(
        'Pagination configuration is required',
      );
    }

    const { page, pageSize, maxPageSize } = config;

    // Valider le numéro de page
    if (!Number.isInteger(page) || page < 1) {
      throw new InvalidPaginationConfigException(
        'Page number must be a positive integer',
      );
    }

    // Valider la taille de page
    if (!Number.isInteger(pageSize) || pageSize < 1) {
      throw new InvalidPageSizeException(pageSize);
    }

    // Vérifier la taille maximale
    const maxSize = maxPageSize || this.DEFAULT_MAX_PAGE_SIZE;
    if (pageSize > maxSize) {
      throw new InvalidPageSizeException(pageSize, maxSize);
    }

    // Valider le TTL du cache si fourni
    if (
      config.cacheTtl !== undefined &&
      (config.cacheTtl < 0 || !Number.isInteger(config.cacheTtl))
    ) {
      throw new InvalidPaginationConfigException(
        'Cache TTL must be a non-negative integer',
      );
    }
  }

  generateCacheKey<T>(data: T[], config: PaginationConfig): string {
    return this.paginationUtils.generateCacheKey(data, {
      page: config.page,
      pageSize: config.pageSize,
      // Inclure d'autres propriétés pertinentes pour la clé de cache
    });
  }

  /**
   * Crée une configuration de pagination avec des valeurs par défaut
   */
  createConfig(overrides: Partial<PaginationConfig> = {}): PaginationConfig {
    return {
      page: 1,
      pageSize: this.DEFAULT_PAGE_SIZE,
      maxPageSize: this.DEFAULT_MAX_PAGE_SIZE,
      enableCache: false,
      cacheTtl: this.DEFAULT_CACHE_TTL,
      ...overrides,
    };
  }

  /**
   * Pagine avec une configuration simplifiée
   */
  async simplePaginate<T>(
    data: T[],
    page: number = 1,
    pageSize: number = this.DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResult<T>> {
    const config = this.createConfig({ page, pageSize });
    return this.paginate(data, config);
  }

  /**
   * Retourne toutes les pages disponibles
   */
  async getAllPages<T>(
    data: T[],
    pageSize: number = this.DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResult<T>[]> {
    const totalPages = this.paginationUtils.calculateTotalPages(
      data.length,
      pageSize,
    );
    const pages: PaginatedResult<T>[] = [];

    for (let page = 1; page <= totalPages; page++) {
      const config = this.createConfig({ page, pageSize });
      const result = await this.paginate(data, config);
      pages.push(result);
    }

    return pages;
  }
}
