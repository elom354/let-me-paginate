import { DynamicModule, Module, Provider } from '@nestjs/common';
import { PaginatorService } from './application/services/paginator.service';
import { PaginationUtils } from './application/utils/pagination.utils';
import { CacheConfig, CacheService } from './domain/interfaces/cache.interface';
import { MemoryCacheService } from './infrastructure/cache/memory-cache.service';

/**
 * Configuration du module de pagination
 */
export interface PaginationModuleOptions {
  /** Activer le cache par défaut */
  enableCache?: boolean;
  /** Configuration du cache */
  cacheConfig?: CacheConfig;
  /** Service de cache personnalisé */
  customCacheService?: Provider;
}

/**
 * Module de pagination avec architecture clean
 */
@Module({})
export class PaginationModule {
  /**
   * Configuration synchrone du module
   */
  static forRoot(options: PaginationModuleOptions = {}): DynamicModule {
    const cacheProviders: Provider[] = [];

    if (options.enableCache !== false) {
      // Configuration par défaut du cache
      const defaultCacheConfig: CacheConfig = {
        defaultTtl: 5 * 60 * 1000, // 5 minutes
        maxSize: 1000,
        evictionStrategy: 'lru',
        ...options.cacheConfig,
      };

      // Provider pour la configuration du cache
      cacheProviders.push({
        provide: 'CACHE_CONFIG',
        useValue: defaultCacheConfig,
      });

      // Provider pour le service de cache
      if (options.customCacheService) {
        cacheProviders.push(options.customCacheService);
      } else {
        cacheProviders.push({
          provide: 'CACHE_SERVICE',
          useFactory: (config: CacheConfig) => new MemoryCacheService(config),
          inject: ['CACHE_CONFIG'],
        });
      }
    }

    return {
      module: PaginationModule,
      providers: [PaginatorService, PaginationUtils, ...cacheProviders],
      exports: [PaginatorService, PaginationUtils],
      global: options.enableCache !== false,
    };
  }

  /**
   * Configuration asynchrone du module
   */
  static forRootAsync(options: {
    useFactory?: (
      ...args: any[]
    ) => Promise<PaginationModuleOptions> | PaginationModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: PaginationModule,
      providers: [
        {
          provide: 'PAGINATION_OPTIONS',
          useFactory: options.useFactory || (() => ({})),
          inject: options.inject || [],
        },
        {
          provide: PaginatorService,
          useFactory: async (
            paginationOptions: PaginationModuleOptions,
            utils: PaginationUtils,
          ) => {
            let cacheService: CacheService | undefined;

            if (paginationOptions.enableCache !== false) {
              const cacheConfig: CacheConfig = {
                defaultTtl: 5 * 60 * 1000,
                maxSize: 1000,
                evictionStrategy: 'lru',
                ...paginationOptions.cacheConfig,
              };

              cacheService = new MemoryCacheService(cacheConfig);
            }

            return new PaginatorService(utils, cacheService);
          },
          inject: ['PAGINATION_OPTIONS', PaginationUtils],
        },
        PaginationUtils,
      ],
      exports: [PaginatorService, PaginationUtils],
    };
  }

  /**
   * Module simple sans cache
   */
  static forFeature(): DynamicModule {
    return {
      module: PaginationModule,
      providers: [PaginatorService, PaginationUtils],
      exports: [PaginatorService, PaginationUtils],
    };
  }
}
