import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { CategoryEntity } from './infrastructure/persistence/relational/entities/category.entity';
import { CategoryRepository } from './infrastructure/persistence/category.repository';
import { CategoryRelationalRepository } from './infrastructure/persistence/relational/repositories/category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity])],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: CategoryRepository,
      useClass: CategoryRelationalRepository,
    },
  ],
  exports: [CategoriesService],
})
export class CategoriesModule {}
