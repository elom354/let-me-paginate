# Let Me Paginate

Un package TypeScript/JavaScript robuste pour la pagination avec architecture clean et système de cache intégré. **Compatible avec tous les projets JS/TS**, pas seulement NestJS !

## ✨ Fonctionnalités

- 🌍 **Universel** - Fonctionne avec tous les projets JS/TS (React, Vue, Node.js, Express, NestJS, etc.)
- 🚀 **Pagination intelligente** - Paginez n'importe quel tableau d'objets
- 🔄 **Mode "toutes les données"** - Option pour retourner toutes les données sans pagination
- 🧠 **Pagination automatique** - Décide automatiquement si paginer ou non selon la taille des données
- 🏗️ **Architecture Clean** - Code bien structuré et maintenable
- 💾 **Système de cache intégré** - Cache LRU en mémoire avec TTL configurable
- 🔗 **Liens de navigation** - Génération automatique des liens prev/next
- ✅ **Validation robuste** - Validation complète des paramètres
- 🧪 **Tests complets** - Couverture de tests élevée
- 📊 **Métadonnées riches** - Informations détaillées sur la pagination

## 🛠️ Installation

```bash
npm install let-me-paginate
```

## 🚀 Utilisation universelle (tous projets JS/TS)

### Utilisation la plus simple

```typescript
import { quickPaginate } from 'let-me-paginate';

const data = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  // ... plus d'éléments
];

// Pagination simple
const result = await quickPaginate(data, 1, 10); // page 1, 10 éléments par page
console.log(result.data); // 10 premiers éléments
console.log(result.meta); // métadonnées de pagination
```

### Toutes les données sans pagination

```typescript
import { quickPaginate, createPaginator } from 'let-me-paginate';

// Option 1: Via quickPaginate
const allData1 = await quickPaginate(data, 1, 10, { noPagination: true });

// Option 2: Via le paginateur
const paginator = createPaginator();
const allData2 = await paginator.getAllData(data);

console.log(allData1.data.length); // Tous les éléments
console.log(allData1.meta.totalPages); // Toujours 1
```

### Pagination intelligente

```typescript
import { quickPaginate } from 'let-me-paginate';

// Si <= 50 éléments: pas de pagination, sinon pagination automatique
const result = await quickPaginate(data, 1, 10, {
  maxItemsBeforePagination: 50
});

// Le package décide automatiquement selon la taille des données
```

### Avec cache

```typescript
import { createPaginator } from 'let-me-paginate';

const paginator = createPaginator({
  enableCache: true,
  maxCacheSize: 1000
});

// Premier appel - calcul normal
const result1 = await paginator.simplePaginate(data, 1, 10, true);
console.log(result1.fromCache); // false

// Deuxième appel - depuis le cache (plus rapide)
const result2 = await paginator.simplePaginate(data, 1, 10, true);
console.log(result2.fromCache); // true
```

### Configuration avancée

```typescript
import { CorePaginator, SimpleCache } from 'let-me-paginate';

const cache = new SimpleCache(500);
const paginator = new CorePaginator(cache);

const result = await paginator.paginate(data, {
  page: 2,
  pageSize: 20,
  enableCache: true,
  cacheTtl: 5 * 60 * 1000, // 5 minutes
  noPagination: false,
});
```

## 🏗️ Utilisation avec NestJS

```typescript
import { Module } from '@nestjs/common';
import { PaginationModule } from 'let-me-paginate/nestjs';

@Module({
  imports: [
    PaginationModule.forRoot({
      enableCache: true,
      cacheConfig: {
        defaultTtl: 5 * 60 * 1000,
        maxSize: 1000,
      },
    }),
  ],
})
export class AppModule {}
```

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { PaginatorService } from 'let-me-paginate/nestjs';

@Controller('items')
export class ItemsController {
  constructor(private readonly paginatorService: PaginatorService) {}

  @Get()
  async getItems(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('all') all: boolean = false,
  ) {
    const data = [...]; // vos données

    if (all) {
      // Retourner toutes les données
      return await this.paginatorService.paginate(data, { noPagination: true });
    }

    // Pagination normale
    return await this.paginatorService.simplePaginate(data, page, pageSize);
  }
}
```

## 📋 API Principale

### `quickPaginate(data, page?, pageSize?, options?)`

Fonction utilitaire la plus simple pour paginer rapidement.

```typescript
const result = await quickPaginate(data, 1, 10, {
  enableCache: true,
  noPagination: false,
  maxItemsBeforePagination: 100,
});
```

### `createPaginator(options?)`

Crée une instance de paginateur avec cache optionnel.

```typescript
const paginator = createPaginator({
  enableCache: true,
  maxCacheSize: 1000,
});
```

### `CorePaginator`

Classe principale pour usage avancé.

**Méthodes principales :**

- `paginate(data, config)` - Pagination normale
- `getAllData(data, enableCache?, cacheTtl?)` - Toutes les données
- `smartPaginate(data, maxItems?, pageSize?, page?)` - Pagination intelligente
- `simplePaginate(data, page?, pageSize?, enableCache?)` - Pagination simple

## 🎯 Cas d'usage

### 1. API REST avec option "tout"

```typescript
// GET /api/users?page=1&pageSize=20
// GET /api/users?all=true

app.get('/api/users', async (req, res) => {
  const { page = 1, pageSize = 20, all = false } = req.query;

  if (all) {
    const result = await quickPaginate(users, 1, 10, { noPagination: true });
    return res.json(result);
  }

  const result = await quickPaginate(users, Number(page), Number(pageSize));
  res.json(result);
});
```

### 2. Interface utilisateur adaptative

```typescript
// React/Vue component
const loadData = async () => {
  // Si peu de données, tout afficher
  // Si beaucoup, paginer automatiquement
  const result = await quickPaginate(data, page, pageSize, {
    maxItemsBeforePagination: 50
  });

  setItems(result.data);
  setShowPagination(result.meta.totalPages > 1);
};
```

### 3. Export de données

```typescript
// Pour les exports, on veut souvent toutes les données
const exportData = async () => {
  const allData = await quickPaginate(data, 1, 10, { noPagination: true });
  return generateCSV(allData.data);
};
```

### 4. Recherche avec résultats intelligents

```typescript
const search = async (query) => {
  const filteredData = data.filter(item =>
    item.name.includes(query)
  );

  // Si peu de résultats, tout afficher
  // Si beaucoup, paginer
  return await quickPaginate(filteredData, 1, 10, {
    maxItemsBeforePagination: 20
  });
};
```

## 🌐 Compatibilité

### Projets supportés

- ✅ **Node.js** (Express, Fastify, Koa, etc.)
- ✅ **NestJS** (avec module dédié)
- ✅ **React** (hooks, components)
- ✅ **Vue.js** (composables)
- ✅ **Angular** (services)
- ✅ **Svelte/SvelteKit**
- ✅ **Next.js** (API routes, SSR)
- ✅ **Nuxt.js**
- ✅ **Electron**
- ✅ **React Native**
- ✅ **Vanilla JavaScript/TypeScript**

### Environnements

- ✅ **Browser** (client-side)
- ✅ **Node.js** (server-side)
- ✅ **Serverless** (Vercel, Netlify, AWS Lambda)
- ✅ **Edge Runtime**

## 📦 Imports disponibles

```typescript
// Import principal (recommandé)
import { quickPaginate, createPaginator } from 'let-me-paginate';

// Import core seulement
import { CorePaginator } from 'let-me-paginate/core';

// Import NestJS seulement
import { PaginationModule } from 'let-me-paginate/nestjs';
```

## 🔧 Configuration

```typescript
interface ExtendedPaginationConfig {
  page?: number;                    // Numéro de page
  pageSize?: number;                // Éléments par page
  maxPageSize?: number;             // Taille max autorisée
  enableCache?: boolean;            // Activer le cache
  cacheTtl?: number;               // Durée de vie cache (ms)
  noPagination?: boolean;          // Désactiver la pagination
}
```

## 📊 Format de réponse

```json
{
  "data": [...],                   // Données de la page/toutes
  "meta": {
    "currentPage": 1,              // Page courante
    "pageSize": 10,                // Taille de page
    "totalItems": 100,             // Total d'éléments
    "totalPages": 10,              // Total de pages
    "hasPrevious": false,          // A une page précédente
    "hasNext": true,               // A une page suivante
    "firstItemIndex": 1,           // Index du premier élément
    "lastItemIndex": 10            // Index du dernier élément
  },
  "fromCache": false,              // Provient du cache
  "links": {                       // Liens de navigation (optionnel)
    "first": "...",
    "previous": "...",
    "next": "...",
    "last": "..."
  }
}
```

## 🧪 Tests

```bash
npm test                          # Tests unitaires
npm run test:cov                  # Avec couverture
npm run test:watch                # Mode watch
```

## 🚀 Build et publication

```bash
npm run build                     # Compiler TypeScript
npm run format                    # Formater le code
npm run lint                      # Vérifier le code
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📝 Licence

MIT - Utilisez librement dans tous vos projets !

## 💡 Pourquoi ce package ?

- **Universel** : Un seul package pour tous vos projets
- **Intelligent** : Décide automatiquement quand paginer
- **Flexible** : Mode pagination ou "toutes les données"
- **Performant** : Cache intégré pour de meilleures performances
- **Simple** : API intuitive avec des défauts sensés
- **Robuste** : Tests complets et gestion d'erreurs
- **Moderne** : TypeScript, ESM, architecture clean

Parfait pour les APIs REST, interfaces utilisateur, exports de données, et bien plus !
