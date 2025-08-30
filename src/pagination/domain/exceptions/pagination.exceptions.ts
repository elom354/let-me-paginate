/**
 * Exception de base pour les erreurs de pagination
 */
export abstract class PaginationException extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Exception levée quand la configuration de pagination est invalide
 */
export class InvalidPaginationConfigException extends PaginationException {
  constructor(message: string) {
    super(message, 'INVALID_PAGINATION_CONFIG');
  }
}

/**
 * Exception levée quand la page demandée n'existe pas
 */
export class PageNotFoundException extends PaginationException {
  constructor(page: number, totalPages: number) {
    super(
      `Page ${page} not found. Valid pages are 1 to ${totalPages}`,
      'PAGE_NOT_FOUND',
    );
  }
}

/**
 * Exception levée quand la taille de page est invalide
 */
export class InvalidPageSizeException extends PaginationException {
  constructor(pageSize: number, maxPageSize?: number) {
    const message = maxPageSize
      ? `Page size ${pageSize} exceeds maximum allowed size of ${maxPageSize}`
      : `Page size ${pageSize} must be greater than 0`;

    super(message, 'INVALID_PAGE_SIZE');
  }
}

/**
 * Exception levée lors d'erreurs de cache
 */
export class CacheException extends PaginationException {
  constructor(
    message: string,
    public readonly originalError?: Error,
  ) {
    super(message, 'CACHE_ERROR');
  }
}
