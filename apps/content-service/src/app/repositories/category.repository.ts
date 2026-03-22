import { Injectable } from '@nestjs/common';
import { PrismaService, transformResponse } from '@performa-edu/libs';
import {
  GetAllCategoriesResponse,
} from '@performa-edu/proto-types/content-service';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCategories(): Promise<GetAllCategoriesResponse> {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return { categories: transformResponse(categories) };
  }
}
