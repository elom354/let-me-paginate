import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PaginationModule } from './pagination';

@Module({
  imports: [
    PaginationModule.forRoot({
      enableCache: true,
      cacheConfig: {
        defaultTtl: 5 * 60 * 1000, // 5 minutes
        maxSize: 1000,
        evictionStrategy: 'lru',
      },
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
