import { Prisma, PrismaClient } from '@prisma/client';
export { Prisma, PrismaClient } from '@prisma/client';
export * as PrismaRuntime from '@prisma/client';

export type ModelName = Prisma.ModelName;
export type PrismaModelName = ModelName;

export const getPrismaModelProp = <N extends PrismaModelName>(name: N) =>
  `${name.charAt(0).toLowerCase()}${name.slice(1)}` as PrismaModelProp<N>;

export const getPrismaDelegate = <N extends PrismaModelName>(
  name: N,
  prisma: PrismaClient
) => prisma[getPrismaModelProp(name)] as PrismaModelDelegate<N> as any; // For generic model delegate

export type PrismaModel<N extends ModelName = ModelName> =
  Prisma.TypeMap['model'][N]['payload'];
export type PrismaModelProp<N extends ModelName = ModelName> = Uncapitalize<N>;
export type PrismaModelType<N extends ModelName = ModelName> =
  Prisma.TypeMap['model'][N];
export type PrismaModelPayload<N extends ModelName = ModelName> =
  PrismaModelType<N>['payload'];
export type PrismaModelDelegate<N extends ModelName = ModelName> =
  PrismaClient[PrismaModelProp<N>];

export type PrismaModels = { [N in Prisma.ModelName]: PrismaModel<N> };
export type PrismaModelProps = { [N in Prisma.ModelName]: PrismaModelProp<N> };
export type PrismaModelTypes = { [N in Prisma.ModelName]: PrismaModelType<N> };
export type PrismaModelPayloads = {
  [N in Prisma.ModelName]: PrismaModelPayload<N>;
};
export type PrismaModelDelegates = {
  [N in Prisma.ModelName]: PrismaModelDelegate<N>;
};

export type FindManyArgs<N extends ModelName> =
  PrismaModelType<N>['operations']['findMany']['args'];
export type FindUniqueArgs<N extends ModelName> =
  PrismaModelType<N>['operations']['findUnique']['args'];
export type WhereInput<N extends ModelName = ModelName> = NonNullable<
  FindManyArgs<N>['where']
>;
export type SelectInput<N extends ModelName = ModelName> = NonNullable<
  FindManyArgs<N>['select']
>;
export type WhereAnd<N extends ModelName = ModelName> = NonNullable<
  WhereInput<N>['AND']
>;
export type WhereOr<N extends ModelName = ModelName> = NonNullable<
  WhereInput<N>['OR']
>;
export type OrderByInput<N extends ModelName = ModelName> = NonNullable<
  FindManyArgs<N>['orderBy']
>;
export type WhereUniqueInput<N extends ModelName = ModelName> = NonNullable<
  FindUniqueArgs<N>['where']
>;

// Check if 'include' exists in FindManyArgs before accessing it
export type IncludeInput<N extends ModelName = ModelName> =
  'include' extends keyof FindManyArgs<N>
    ? NonNullable<FindManyArgs<N>['include']>
    : never;
