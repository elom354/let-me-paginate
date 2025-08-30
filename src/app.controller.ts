import { Controller, Get, Query } from '@nestjs/common';
import { PaginatorService } from './pagination';

@Controller()
export class AppController {
  constructor(private readonly paginatorService: PaginatorService) {}

  @Get('example')
  async getPaginatedExample(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('enableCache') enableCache: boolean = false,
  ) {
    // Exemple de données
    const sampleData = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      description: `Description for item ${i + 1}`,
      createdAt: new Date(),
    }));

    const config = {
      page: Number(page),
      pageSize: Number(pageSize),
      enableCache,
      cacheTtl: 2 * 60 * 1000, // 2 minutes
    };

    return await this.paginatorService.paginate(sampleData, config);
  }

  @Get('example-with-links')
  async getPaginatedExampleWithLinks(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    const sampleData = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      description: `Description for item ${i + 1}`,
      createdAt: new Date(),
    }));

    const config = {
      page: Number(page),
      pageSize: Number(pageSize),
      enableCache: true,
    };

    return await this.paginatorService.paginateWithLinks(
      sampleData,
      config,
      'http://localhost:3000/example-with-links',
    );
  }
}
