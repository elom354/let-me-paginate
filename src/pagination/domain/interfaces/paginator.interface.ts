import type {
  PaginatedResult,
  PaginatedResultWithLinks,
  PaginationConfig,
} from './pagination.interface';

/**
 * Interface principale du paginateur
 */
export interface IPaginator {
  /**
   * Pagine un tableau d'éléments
   * @param data Tableau d'éléments à paginer
   * @param config Configuration de pagination
   * @returns Résultat paginé
   */
  paginate<T>(data: T[], config: PaginationConfig): Promise<PaginatedResult<T>>;

  /**
   * Pagine un tableau d'éléments avec des liens de navigation
   * @param data Tableau d'éléments à paginer
   * @param config Configuration de pagination
   * @param baseUrl URL de base pour générer les liens
   * @returns Résultat paginé avec liens
   */
  paginateWithLinks<T>(
    data: T[],
    config: PaginationConfig,
    baseUrl?: string,
  ): Promise<PaginatedResultWithLinks<T>>;

  /**
   * Valide la configuration de pagination
   * @param config Configuration à valider
   * @throws Error si la configuration est invalide
   */
  validateConfig(config: PaginationConfig): void;

  /**
   * Génère une clé de cache unique pour les données et la configuration
   * @param data Données à paginer
   * @param config Configuration de pagination
   * @returns Clé de cache unique
   */
  generateCacheKey<T>(data: T[], config: PaginationConfig): string;
}

/**
 * Interface pour les utilitaires de pagination
 */
export interface IPaginationUtils {
  /**
   * Calcule le nombre total de pages
   * @param totalItems Nombre total d'éléments
   * @param pageSize Taille de page
   * @returns Nombre total de pages
   */
  calculateTotalPages(totalItems: number, pageSize: number): number;

  /**
   * Calcule l'index de début pour une page
   * @param page Numéro de page (commence à 1)
   * @param pageSize Taille de page
   * @returns Index de début
   */
  calculateStartIndex(page: number, pageSize: number): number;

  /**
   * Calcule l'index de fin pour une page
   * @param page Numéro de page
   * @param pageSize Taille de page
   * @param totalItems Nombre total d'éléments
   * @returns Index de fin
   */
  calculateEndIndex(page: number, pageSize: number, totalItems: number): number;

  /**
   * Vérifie si une page existe
   * @param page Numéro de page
   * @param totalPages Nombre total de pages
   * @returns true si la page existe
   */
  isValidPage(page: number, totalPages: number): boolean;
}
