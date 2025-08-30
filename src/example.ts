/**
 * Exemple d'utilisation du package let-me-paginate
 *
 * Ce fichier montre comment utiliser le package dans différents contextes
 */

import { PaginatorService } from './pagination/application/services/paginator.service';
import { PaginationUtils } from './pagination/application/utils/pagination.utils';
import { MemoryCacheService } from './pagination/infrastructure/cache/memory-cache.service';

// Données d'exemple
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  createdAt: Date;
}

const users: User[] = Array.from({ length: 157 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: ['admin', 'user', 'moderator'][i % 3] as User['role'],
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
}));

async function exempleBasique() {
  console.log('\n=== Exemple basique ===');

  const paginationUtils = new PaginationUtils();
  const paginatorService = new PaginatorService(paginationUtils);

  const config = {
    page: 1,
    pageSize: 10,
    enableCache: false,
  };

  const result = await paginatorService.paginate(users, config);

  console.log(`Page ${result.meta.currentPage} sur ${result.meta.totalPages}`);
  console.log(`${result.data.length} utilisateurs sur cette page`);
  console.log(`Total: ${result.meta.totalItems} utilisateurs`);
  console.log(
    'Premiers utilisateurs:',
    result.data.slice(0, 3).map((u) => u.name),
  );
}

async function exempleAvecCache() {
  console.log('\n=== Exemple avec cache ===');

  const cacheConfig = {
    defaultTtl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    evictionStrategy: 'lru' as const,
  };

  const cacheService = new MemoryCacheService(cacheConfig);
  const paginationUtils = new PaginationUtils();
  const paginatorService = new PaginatorService(paginationUtils, cacheService);

  const config = {
    page: 2,
    pageSize: 15,
    enableCache: true,
    cacheTtl: 2 * 60 * 1000, // 2 minutes
  };

  // Premier appel - pas de cache
  console.time('Premier appel');
  const result1 = await paginatorService.paginate(users, config);
  console.timeEnd('Premier appel');
  console.log(`Depuis le cache: ${result1.fromCache}`);

  // Deuxième appel - depuis le cache
  console.time('Deuxième appel');
  const result2 = await paginatorService.paginate(users, config);
  console.timeEnd('Deuxième appel');
  console.log(`Depuis le cache: ${result2.fromCache}`);
}

async function exempleAvecLiens() {
  console.log('\n=== Exemple avec liens de navigation ===');

  const paginationUtils = new PaginationUtils();
  const paginatorService = new PaginatorService(paginationUtils);

  const config = {
    page: 5,
    pageSize: 20,
    enableCache: false,
  };

  const result = await paginatorService.paginateWithLinks(
    users,
    config,
    'https://api.example.com/users',
  );

  console.log(`Page ${result.meta.currentPage} sur ${result.meta.totalPages}`);
  console.log('Liens de navigation:');
  if (result.links?.first) console.log(`  Première: ${result.links.first}`);
  if (result.links?.previous)
    console.log(`  Précédente: ${result.links.previous}`);
  if (result.links?.next) console.log(`  Suivante: ${result.links.next}`);
  if (result.links?.last) console.log(`  Dernière: ${result.links.last}`);
}

async function exempleMethodesUtilitaires() {
  console.log('\n=== Méthodes utilitaires ===');

  const paginationUtils = new PaginationUtils();
  const paginatorService = new PaginatorService(paginationUtils);

  // Pagination simple
  const simpleResult = await paginatorService.simplePaginate(users, 3, 25);
  console.log(
    `Pagination simple - Page 3, ${simpleResult.data.length} éléments`,
  );

  // Configuration avec défauts
  const defaultConfig = paginatorService.createConfig({
    page: 1,
    enableCache: true,
  });
  console.log('Configuration par défaut:', {
    page: defaultConfig.page,
    pageSize: defaultConfig.pageSize,
    enableCache: defaultConfig.enableCache,
  });

  // Toutes les pages (attention: peut être coûteux pour de gros datasets)
  const smallDataset = users.slice(0, 50);
  const allPages = await paginatorService.getAllPages(smallDataset, 15);
  console.log(
    `Dataset de ${smallDataset.length} éléments divisé en ${allPages.length} pages`,
  );
}

async function exempleGestionErreurs() {
  console.log('\n=== Gestion des erreurs ===');

  const paginationUtils = new PaginationUtils();
  const paginatorService = new PaginatorService(paginationUtils);

  try {
    // Page inexistante
    const config = {
      page: 999,
      pageSize: 10,
      enableCache: false,
    };
    await paginatorService.paginate(users, config);
  } catch (error) {
    console.log('Erreur capturée:', error.message);
  }

  try {
    // Taille de page invalide
    const config = {
      page: 1,
      pageSize: 0,
      enableCache: false,
    };
    await paginatorService.paginate(users, config);
  } catch (error) {
    console.log('Erreur capturée:', error.message);
  }
}

async function exempleFiltrageEtTri() {
  console.log('\n=== Exemple avec filtrage et tri ===');

  const paginationUtils = new PaginationUtils();
  const paginatorService = new PaginatorService(paginationUtils);

  // Filtrer les administrateurs
  const admins = users.filter((user) => user.role === 'admin');

  // Trier par date de création (plus récent en premier)
  const sortedAdmins = admins.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const config = {
    page: 1,
    pageSize: 5,
    enableCache: true,
    cacheTtl: 1 * 60 * 1000, // 1 minute
  };

  const result = await paginatorService.paginate(sortedAdmins, config);

  console.log(`${result.meta.totalItems} administrateurs au total`);
  console.log('Administrateurs les plus récents:');
  result.data.forEach((admin) => {
    console.log(
      `  ${admin.name} - ${admin.email} (créé le ${admin.createdAt.toLocaleDateString()})`,
    );
  });
}

// Exécution des exemples
async function runExamples() {
  console.log('🚀 Démonstration du package let-me-paginate\n');

  await exempleBasique();
  await exempleAvecCache();
  await exempleAvecLiens();
  await exempleMethodesUtilitaires();
  await exempleGestionErreurs();
  await exempleFiltrageEtTri();

  console.log('\n✅ Tous les exemples ont été exécutés avec succès !');
}

// Exporter pour utilisation
export {
  runExamples,
  exempleBasique,
  exempleAvecCache,
  exempleAvecLiens,
  exempleMethodesUtilitaires,
  exempleGestionErreurs,
  exempleFiltrageEtTri,
};

// Exécution directe si ce fichier est lancé
if (require.main === module) {
  runExamples().catch(console.error);
}
