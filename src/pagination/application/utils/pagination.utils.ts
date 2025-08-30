import { Injectable } from '@nestjs/common';
import { IPaginationUtils } from '../../domain/interfaces/paginator.interface';

/**
 * Utilitaires pour les calculs de pagination
 */
@Injectable()
export class PaginationUtils implements IPaginationUtils {
  calculateTotalPages(totalItems: number, pageSize: number): number {
    if (totalItems <= 0 || pageSize <= 0) {
      return 0;
    }
    return Math.ceil(totalItems / pageSize);
  }

  calculateStartIndex(page: number, pageSize: number): number {
    if (page <= 0 || pageSize <= 0) {
      return 0;
    }
    return (page - 1) * pageSize;
  }

  calculateEndIndex(
    page: number,
    pageSize: number,
    totalItems: number,
  ): number {
    const startIndex = this.calculateStartIndex(page, pageSize);
    const endIndex = startIndex + pageSize;
    return Math.min(endIndex, totalItems);
  }

  isValidPage(page: number, totalPages: number): boolean {
    return page >= 1 && page <= totalPages;
  }

  /**
   * Génère une clé de cache basée sur le hash des données et la configuration
   */
  generateCacheKey<T>(data: T[], config: any): string {
    const dataHash = this.hashArray(data);
    const configHash = this.hashObject(config);
    return `pagination:${dataHash}:${configHash}`;
  }

  /**
   * Génère un hash simple pour un tableau
   */
  private hashArray<T>(data: T[]): string {
    const str = JSON.stringify(data);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Génère un hash simple pour un objet
   */
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

  /**
   * Valide les paramètres de pagination
   */
  validatePaginationParams(
    page: number,
    pageSize: number,
    maxPageSize?: number,
  ): void {
    if (page < 1) {
      throw new Error('Page number must be greater than 0');
    }

    if (pageSize < 1) {
      throw new Error('Page size must be greater than 0');
    }

    if (maxPageSize && pageSize > maxPageSize) {
      throw new Error(
        `Page size ${pageSize} exceeds maximum allowed size of ${maxPageSize}`,
      );
    }
  }

  /**
   * Crée les liens de navigation
   */
  generateNavigationLinks(
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
