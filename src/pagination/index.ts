// Module principal
export { PaginationModule } from './pagination.module';
export type { PaginationModuleOptions } from './pagination.module';

// Services
export { PaginatorService } from './application/services/paginator.service';
export { PaginationUtils } from './application/utils/pagination.utils';
export { MemoryCacheService } from './infrastructure/cache/memory-cache.service';

// Interfaces
export type {
  NavigationLinks,
  PaginatedResult,
  PaginatedResultWithLinks,
  PaginationConfig,
  PaginationMeta,
} from './domain/interfaces/pagination.interface';

export type {
  CacheConfig,
  CacheEntry,
  CacheService,
} from './domain/interfaces/cache.interface';

export type {
  IPaginationUtils,
  IPaginator,
} from './domain/interfaces/paginator.interface';

// Exceptions
export {
  CacheException,
  InvalidPageSizeException,
  InvalidPaginationConfigException,
  PageNotFoundException,
  PaginationException,
} from './domain/exceptions/pagination.exceptions';
