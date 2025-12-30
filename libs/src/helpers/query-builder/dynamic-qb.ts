import { isEmpty } from 'lodash';
import {
  IncludeInput,
  ModelName,
  OrderByInput,
  Prisma,
  SelectInput,
  WhereInput,
} from '../../prisma/types';
import { Injectable } from '@nestjs/common';
import { PageOptionsDto } from '../../common';
import { sortAttribute } from './sort-attribute';
import { PrismaService } from 'libs/src/prisma/prisma.service';
import { Order } from 'libs/src/constant';

export type QueryBuilderOptionsType<T extends ModelName> = {
  select?: SelectInput<T>;
  where?: WhereInput<T>;
  orderBy?: OrderByInput<T>;
  include?: IncludeInput<T>;
} & PageOptionsDto;

@Injectable()
export class DynamicQueryBuilder {
  constructor(private prisma: PrismaService) {}

  async buildDynamicQuery<T extends ModelName>(
    model: T,
    options: QueryBuilderOptionsType<T>
  ): Promise<{ data: Prisma.Payload<T>[]; count: number }> {
    const {
      select,
      where = {},
      orderBy = {},
      pageSize = 10,
      order = 0, // ASC = 0, DESC = 1
      sortBy,
      page = 1,
      include,
    } = options;

    // Fix pagination calculation
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Handle sorting
    if (sortBy && !isEmpty(sortBy)) {
      const sort = sortAttribute(sortBy);

      if (sort) {
        const sortKey = Object.keys(sort)[0];
        const sortValue = order === 0 ? 'asc' : 'desc'; // Convert enum to string
        const isDotNotation = sortKey.includes('.');

        if (isDotNotation) {
          const [relation, field] = sortKey.split('.');
          orderBy[relation] = {
            [field]: sortValue,
          };
        } else {
          orderBy[sortKey] = sortValue;
        }
      }
    }

    // Use proper model delegate based on model name
    const modelProp = model.charAt(0).toLowerCase() + model.slice(1);
    const modelDelegate = this.prisma[modelProp as keyof PrismaService] as any;

    const result = await this.prisma.$transaction([
      modelDelegate.findManyActive({
        skip,
        take,
        where,
        orderBy,
        ...(select ? { select } : {}),
        ...(include ? { include } : {}),
      }),
      modelDelegate.count({ where }),
    ]);

    return {
      data: result[0] as Prisma.Payload<T>[],
      count: result[1],
    };
  }
}
