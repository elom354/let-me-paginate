/**
 * Exemples d'utilisation universelle du package let-me-paginate
 * Compatible avec tous les projets JavaScript/TypeScript
 */

// Import pour utilisation universelle
import {
  CorePaginator,
  createPaginator,
  quickPaginate,
  SimpleCache,
} from '../index';

// Données d'exemple
const users = Array.from({ length: 250 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  active: Math.random() > 0.3,
}));

/**
 * Exemple 1: Utilisation la plus simple
 */
async function exempleSimple() {
  console.log('\n=== Exemple Simple ===');

  // Pagination rapide sans configuration
  const result = await quickPaginate(users, 1, 10);

  console.log(`Page ${result.meta.currentPage}/${result.meta.totalPages}`);
  console.log(`${result.data.length} utilisateurs sur cette page`);
  console.log(`Total: ${result.meta.totalItems} utilisateurs`);
}

/**
 * Exemple 2: Toutes les données sans pagination
 */
async function exempleRoutesDonnees() {
  console.log('\n=== Toutes les Données (Sans Pagination) ===');

  // Option 1: Via quickPaginate
  const result1 = await quickPaginate(users, 1, 10, { noPagination: true });

  console.log(`Toutes les données: ${result1.data.length} éléments`);
  console.log(`Pages: ${result1.meta.totalPages} (toujours 1 sans pagination)`);

  // Option 2: Via le paginateur
  const paginator = createPaginator();
  const result2 = await paginator.getAllData(users);

  console.log(`Même résultat: ${result2.data.length} éléments`);
}

/**
 * Exemple 3: Pagination intelligente
 */
async function exemplePaginationIntelligente() {
  console.log('\n=== Pagination Intelligente ===');

  const petitDataset = users.slice(0, 50);
  const grosDataset = users;

  // Si <= 50 éléments, pas de pagination
  const result1 = await quickPaginate(petitDataset, 1, 10, {
    maxItemsBeforePagination: 50,
  });

  // Si > 50 éléments, pagination automatique
  const result2 = await quickPaginate(grosDataset, 1, 10, {
    maxItemsBeforePagination: 50,
  });

  console.log(`Petit dataset (${petitDataset.length} items):`);
  console.log(`  - Pagination: ${result1.meta.totalPages > 1 ? 'Oui' : 'Non'}`);
  console.log(`  - Données retournées: ${result1.data.length}`);

  console.log(`Gros dataset (${grosDataset.length} items):`);
  console.log(`  - Pagination: ${result2.meta.totalPages > 1 ? 'Oui' : 'Non'}`);
  console.log(`  - Données retournées: ${result2.data.length}`);
}

/**
 * Exemple 4: Avec cache
 */
async function exempleAvecCache() {
  console.log('\n=== Avec Cache ===');

  const paginator = createPaginator({ enableCache: true, maxCacheSize: 100 });

  // Premier appel
  console.time('Premier appel');
  const result1 = await paginator.simplePaginate(users, 2, 20, true);
  console.timeEnd('Premier appel');
  console.log(`Depuis le cache: ${result1.fromCache}`);

  // Deuxième appel (depuis le cache)
  console.time('Deuxième appel');
  const result2 = await paginator.simplePaginate(users, 2, 20, true);
  console.timeEnd('Deuxième appel');
  console.log(`Depuis le cache: ${result2.fromCache}`);
}

/**
 * Exemple 5: Configuration avancée
 */
async function exempleAvance() {
  console.log('\n=== Configuration Avancée ===');

  const cache = new SimpleCache(500);
  const paginator = new CorePaginator(cache);

  // Utilisateurs actifs seulement
  const activeUsers = users.filter((u) => u.active);

  const config = {
    page: 3,
    pageSize: 15,
    enableCache: true,
    cacheTtl: 2 * 60 * 1000, // 2 minutes
    noPagination: false,
  };

  const result = await paginator.paginate(activeUsers, config);

  console.log(`Utilisateurs actifs: ${activeUsers.length}/${users.length}`);
  console.log(`Page ${result.meta.currentPage}/${result.meta.totalPages}`);
  console.log(`Éléments sur cette page: ${result.data.length}`);
  console.log(
    `Navigation: Précédent=${result.meta.hasPrevious}, Suivant=${result.meta.hasNext}`,
  );
}

/**
 * Exemple 6: Pour API REST
 */
async function exempleAPIRest() {
  console.log('\n=== Exemple API REST ===');

  const paginator = createPaginator({ enableCache: true });

  // Simulation d'une requête API
  const queryParams = {
    page: 2,
    pageSize: 25,
    search: 'user1', // Filtrage côté client pour la démo
  };

  // Filtrer les données selon la recherche
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(queryParams.search.toLowerCase()),
  );

  const result = await paginator.paginateWithLinks(
    filteredUsers,
    {
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      enableCache: true,
    },
    'https://api.example.com/users',
  );

  console.log(
    `Recherche "${queryParams.search}": ${filteredUsers.length} résultats`,
  );
  console.log(`Page ${result.meta.currentPage}/${result.meta.totalPages}`);
  console.log('Liens de navigation:');
  if (result.links?.first) console.log(`  Premier: ${result.links.first}`);
  if (result.links?.previous)
    console.log(`  Précédent: ${result.links.previous}`);
  if (result.links?.next) console.log(`  Suivant: ${result.links.next}`);
  if (result.links?.last) console.log(`  Dernier: ${result.links.last}`);
}

/**
 * Exemple 7: Gestion d'erreurs
 */
async function exempleGestionErreurs() {
  console.log("\n=== Gestion d'Erreurs ===");

  const paginator = createPaginator();

  try {
    // Page inexistante
    await paginator.simplePaginate(users, 999, 10);
  } catch (error) {
    console.log(`Erreur capturée: ${error.message}`);
  }

  try {
    // Taille de page invalide
    await paginator.paginate(users, { page: 1, pageSize: -5 });
  } catch (error) {
    console.log(`Erreur capturée: ${error.message}`);
  }
}

// Fonction principale pour exécuter tous les exemples
async function runUniversalExamples() {
  console.log("🌍 Exemples d'utilisation universelle de let-me-paginate");
  console.log('Compatible avec tous les projets JavaScript/TypeScript\n');

  await exempleSimple();
  await exempleRoutesDonnees();
  await exemplePaginationIntelligente();
  await exempleAvecCache();
  await exempleAvance();
  await exempleAPIRest();
  await exempleGestionErreurs();

  console.log('\n✅ Tous les exemples universels ont été exécutés !');
}

// Export pour utilisation
export {
  exempleAPIRest,
  exempleAvance,
  exempleAvecCache,
  exempleGestionErreurs,
  exemplePaginationIntelligente,
  exempleRoutesDonnees,
  exempleSimple,
  runUniversalExamples,
};

// Exécution directe
if (require.main === module) {
  runUniversalExamples().catch(console.error);
}
