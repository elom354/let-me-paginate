/**
 * Point d'entrée principal pour usage universel (tous projets JS/TS)
 */

// Export principal - Version core pour tous les projets
export { CorePaginator } from './pagination/core/paginator.core';
export type { ExtendedPaginationConfig } from './pagination/core/paginator.core';
export { SimpleCache } from './pagination/core/simple-cache';

// Interfaces communes
export type {
  NavigationLinks,
  PaginatedResult,
  PaginatedResultWithLinks,
  PaginationConfig,
  PaginationMeta,
} from './pagination/domain/interfaces/pagination.interface';

export type {
  CacheConfig,
  CacheEntry,
  CacheService,
} from './pagination/domain/interfaces/cache.interface';

// Exceptions
export {
  CacheException,
  InvalidPageSizeException,
  InvalidPaginationConfigException,
  PageNotFoundException,
  PaginationException,
} from './pagination/domain/exceptions/pagination.exceptions';

// Exports NestJS (optionnels - seulement si NestJS est disponible)
export { PaginatorService } from './pagination/application/services/paginator.service';
export { PaginationUtils } from './pagination/application/utils/pagination.utils';
export { MemoryCacheService } from './pagination/infrastructure/cache/memory-cache.service';
export { PaginationModule } from './pagination/pagination.module';
export type { PaginationModuleOptions } from './pagination/pagination.module';

// Export tout du dossier pagination pour rétrocompatibilité
export * from './pagination';

/**
 * Factory function pour créer rapidement un paginateur
 */
export function createPaginator(options?: {
  enableCache?: boolean;
  maxCacheSize?: number;
}) {
  const cache = options?.enableCache
    ? new (require('./pagination/core/simple-cache').SimpleCache)(
        options.maxCacheSize || 1000,
      )
    : undefined;

  return new (require('./pagination/core/paginator.core').CorePaginator)(cache);
}

/**
 * Fonction utilitaire pour pagination rapide
 */
export async function quickPaginate<T>(
  data: T[],
  page: number = 1,
  pageSize: number = 10,
  options?: {
    enableCache?: boolean;
    noPagination?: boolean;
    maxItemsBeforePagination?: number;
  },
) {
  const paginator = createPaginator({ enableCache: options?.enableCache });

  if (options?.noPagination) {
    return paginator.getAllData(data, options.enableCache);
  }

  if (options?.maxItemsBeforePagination) {
    return paginator.smartPaginate(
      data,
      options.maxItemsBeforePagination,
      pageSize,
      page,
    );
  }

  return paginator.simplePaginate(data, page, pageSize, options?.enableCache);
}
