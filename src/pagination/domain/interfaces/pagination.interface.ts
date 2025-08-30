/**
 * Configuration pour la pagination
 */
export interface PaginationConfig {
  /** Nombre d'éléments par page */
  pageSize: number;
  /** Numéro de la page courante (commence à 1) */
  page: number;
  /** Taille maximale autorisée par page (optionnel) */
  maxPageSize?: number;
  /** Activer ou désactiver le cache */
  enableCache?: boolean;
  /** Durée de vie du cache en millisecondes */
  cacheTtl?: number;
}

/**
 * Métadonnées de pagination
 */
export interface PaginationMeta {
  /** Page courante */
  currentPage: number;
  /** Nombre d'éléments par page */
  pageSize: number;
  /** Nombre total d'éléments */
  totalItems: number;
  /** Nombre total de pages */
  totalPages: number;
  /** Y a-t-il une page précédente */
  hasPrevious: boolean;
  /** Y a-t-il une page suivante */
  hasNext: boolean;
  /** Index du premier élément de la page */
  firstItemIndex: number;
  /** Index du dernier élément de la page */
  lastItemIndex: number;
}

/**
 * Résultat paginé
 */
export interface PaginatedResult<T> {
  /** Données de la page courante */
  data: T[];
  /** Métadonnées de pagination */
  meta: PaginationMeta;
  /** Indique si les données proviennent du cache */
  fromCache?: boolean;
}

/**
 * Options pour la génération de liens de navigation
 */
export interface NavigationLinks {
  /** Lien vers la première page */
  first?: string;
  /** Lien vers la page précédente */
  previous?: string;
  /** Lien vers la page suivante */
  next?: string;
  /** Lien vers la dernière page */
  last?: string;
}

/**
 * Résultat paginé avec liens de navigation
 */
export interface PaginatedResultWithLinks<T> extends PaginatedResult<T> {
  /** Liens de navigation */
  links?: NavigationLinks;
}
